import asyncHandler from "express-async-handler";
import Article from "../models/articleModel.js";
import fs from "fs";
//Importing both the real and mock summarizers.
import { extractMetadataAndSummarize as realExtract } from "../services/openaiService.js";
import { extractMetadataAndSummarize as mockExtract } from "../services/mockOpenaiService.js";

import { extractBasicMetadata } from "../services/pdfMetadataService.js";
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
import cloudinary from '../services/cloudinaryService.js';

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// @desc    Upload and process PDF
// @route   POST /api/articles/upload
// @access  Public
const uploadArticle = asyncHandler(async (req, res) => {
  console.log('Upload request received');
  
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ 
      success: false,
      error: "No file uploaded" 
    });
  }

  console.log('File received from Cloudinary:', {
    originalname: req.file.originalname,
    size: req.file.size,
    path: req.file.path,
    filename: req.file.filename
  });

  let pdfDocument = null;

  try {
    // Since buffer is not available from Cloudinary storage, download the file
    console.log('Downloading PDF from Cloudinary for processing...');
    const response = await fetch(req.file.path);
    
    if (!response.ok) {
      throw new Error(`Failed to download PDF from Cloudinary: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const dataBuffer = Buffer.from(arrayBuffer);
    const pdfData = new Uint8Array(dataBuffer);

    // Process PDF text extraction
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    pdfDocument = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    // Extract basic metadata
    const basicMetadata = await extractBasicMetadata(dataBuffer);

    // Create article with Cloudinary info
    const article = await Article.create({
      title: req.file.originalname.replace('.pdf', ''),
      authors: basicMetadata.authors,
      publicationYear: basicMetadata.publicationYear,
      journal: basicMetadata.journal,
      source: req.file.path, // Cloudinary URL
      cloudinaryPublicId: req.file.filename, // Store public_id for deletion
      originalText: fullText,
      processingStatus: "processing",
    });

    console.log('Article created successfully:', article._id);

    // Send immediate response
    res.status(201).json({
      success: true,
      message: "File uploaded successfully. Processing started.",
      article
    });

    // Process metadata extraction and summary in background
    processArticle(article._id, fullText);

  } catch (error) {
    console.error("Upload error:", error);
    
    // Clean up from Cloudinary if upload was successful but processing failed
    if (req.file && req.file.filename) {
      try {
        console.log('Attempting to delete file from Cloudinary:', req.file.filename);
        await cloudinary.uploader.destroy(req.file.filename, {
          resource_type: 'raw'
        });
        console.log('Cloudinary file deleted successfully');
      } catch (deleteError) {
        console.error("Error cleaning up Cloudinary file:", deleteError);
      }
    }
    
    // Clean up PDF document if it was created
    if (pdfDocument) {
      try {
        pdfDocument.destroy();
      } catch (cleanupError) {
        console.error("Error cleaning up PDF document:", cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: "Error processing PDF: " + error.message
    });
  }
});

// Background processing function
const processArticle = async (articleId, text) => {
  try {

    // Choose which service to use based on environment
    const extractMetadataAndSummarize = process.env.NODE_ENV === 'production' 
    ? realExtract 
    : mockExtract;
    // Limit text to avoid excessive token usage
    const limitedText = text.substring(0, 6000);
    const { metadata, summary } = await extractMetadataAndSummarize(limitedText);
    //const { metadata, summary } = await extractMetadataAndSummarize(text);
    
    await Article.findByIdAndUpdate(articleId, {
      authors: metadata.authors,
      publicationYear: metadata.publicationYear,
      journal: metadata.journal,
      summary,
      processingStatus: "completed"
    });

    console.log(`Processing completed for article ${articleId}`);
  } catch (error) {
    console.error("Error processing article:", error);
    
    let errorMessage = error.message;
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      errorMessage = "OpenAI API quota exceeded. Please check your billing details.";
    }
    
    await Article.findByIdAndUpdate(articleId, {
      processingStatus: "failed",
      errorMessage: errorMessage
    });
  }
};

// @desc    Get all articles with summary status
// @route   GET /api/articles
// @access  Public
const getArticles = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const articles = await Article.find({})
    .select('title authors publicationYear journal processingStatus createdAt updatedAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Article.countDocuments();

  res.json({
    articles,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalArticles: total
  });
});

// @desc    Get single article with full details
// @route   GET /api/articles/:id
// @access  Public
const getArticleById = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }

  // If still processing, check status
  if (article.processingStatus === "processing") {
    const updatedArticle = await Article.findById(req.params.id);
    if (updatedArticle.processingStatus === "completed") {
      return res.json(updatedArticle);
    }
  }

  res.json(article);
});

// @desc    Retry failed processing
// @route   POST /api/articles/:id/retry
// @access  Public
const retryProcessing = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }

  if (!article.originalText) {
    res.status(400);
    throw new Error("No original text available for processing");
  }

  // Update status to processing
  await Article.findByIdAndUpdate(req.params.id, {
    processingStatus: "processing",
    errorMessage: ""
  });

  res.json({ message: "Retry started" });

  // Process in background
  processArticle(article._id, article.originalText);
});

// @desc    Update article metadata
// @route   PUT /api/articles/:id
// @access  Public
const updateArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }

  // Update allowed fields
  if (req.body.title) article.title = req.body.title;
  if (req.body.authors) article.authors = req.body.authors;
  if (req.body.publicationYear) article.publicationYear = req.body.publicationYear;
  if (req.body.journal) article.journal = req.body.journal;

  const updatedArticle = await article.save();
  res.json(updatedArticle);
});

// @desc    Search articles by title, authors, or journal
// @route   GET /api/articles/search/:query
// @access  Public
const searchArticles = asyncHandler(async (req, res) => {
  const query = req.params.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const searchFilter = {
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { authors: { $in: [new RegExp(query, 'i')] } },
      { journal: { $regex: query, $options: 'i' } }
    ]
  };

  const articles = await Article.find(searchFilter)
    .select('title authors publicationYear journal processingStatus createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Article.countDocuments(searchFilter);

  res.json({
    articles,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalArticles: total
  });
});

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Public
const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error("Article not found");
  }

  // Clean up file from Cloudinary if it exists
  if (article.cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(article.cloudinaryPublicId, {
        resource_type: 'raw'
      });
    } catch (error) {
      console.error("Error deleting file from Cloudinary:", error);
      // Don't throw error here - we still want to delete the DB record
    }
  }

  await Article.findByIdAndDelete(req.params.id);
  res.json({ message: "Article removed successfully" });
});

// @desc    Summarize article from URL
// @route   POST /api/articles/summarize-url
// @access  Public

// Enhanced summarizeUrl function with better HTML parsing
const summarizeUrl = asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: "URL is required"
    });
  }

  try {
    // Fetch the HTML content
    const response = await fetch(url);
    const html = await response.text();
    
    // Use cheerio to parse HTML and extract meaningful content
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, nav, footer, header, aside').remove();
    
    // Get the main content
    const title = $('title').text() || getTitleFromUrl(url);
    const paragraphs = $('p').map((i, el) => $(el).text()).get();
    const text = paragraphs.join(' ').substring(0, 10000); // Limit text length
    
    // Use the same OpenAI service to summarize the text
    const extractMetadataAndSummarize = process.env.NODE_ENV === 'production' 
      ? realExtract 
      : mockExtract;
    
    const { metadata, summary } = await extractMetadataAndSummarize(text);
    
    // Create article record
    const article = await Article.create({
      title: title,
      authors: metadata.authors,
      publicationYear: metadata.publicationYear,
      journal: metadata.journal || getDomainFromUrl(url),
      source: url,
      originalText: text.substring(0, 1000) + '...', // Store first 1000 chars
      summary,
      processingStatus: "completed",
    });

    res.json({
      success: true,
      article
    });

  } catch (error) {
    console.error("URL summarization error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to summarize URL: " + error.message
    });
  }
});

// Helper function to get domain from URL
const getDomainFromUrl = (url) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch (error) {
    return 'Website';
  }
};

// Helper function to extract title from URL
const getTitleFromUrl = (url) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').replace('.com', '');
  } catch (error) {
    return 'Web Article';
  }
};

export {
  uploadArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  retryProcessing,
  searchArticles,
  summarizeUrl
};