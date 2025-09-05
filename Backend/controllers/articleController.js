import asyncHandler from "express-async-handler";
import Article from "../models/articleModel.js";
import fs from "fs";
//Importing both the real and mock summarizers.
import { extractMetadataAndSummarize as realExtract } from "../services/openaiService.js";
import { extractMetadataAndSummarize as mockExtract } from "../services/mockOpenaiService.js";

import { extractBasicMetadata } from "../services/pdfMetadataService.js";
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

// @desc    Upload and process PDF
// @route   POST /api/articles/upload
// @access  Public
const uploadArticle = asyncHandler(async (req, res) => {
    console.log('Upload request received');
  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      error: "No file uploaded" 
    });
  }

  console.log('File received:', req.file);
  let pdfDocument = null;

  try {

    console.log('Reading file buffer');
    const dataBuffer = fs.readFileSync(req.file.path);
    console.log('File buffer length:', dataBuffer.length);
    const pdfData = new Uint8Array(dataBuffer);

    // Use the correct export structure
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    pdfDocument = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    // Extract basic metadata first
    const basicMetadata = await extractBasicMetadata(dataBuffer);

    // Create article with pending status and basic metadata
    const article = await Article.create({
      title: req.file.originalname.replace('.pdf', ''),
      authors: basicMetadata.authors,
      publicationYear: basicMetadata.publicationYear,
      journal: basicMetadata.journal,
      source: req.file.path,
      originalText: fullText,
      processingStatus: "processing",
    });

    // Send immediate response
    res.status(201).json({
      success: true,
      message: "File uploaded successfully. Processing started.",
      article
    });

    // Process metadata extraction and summary in background
    processArticle(article._id, fullText);

  } catch (error) {
    console.error("Upload error details:", error);
    
    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Clean up PDF document if it was created
    if (pdfDocument) {
      try {
        pdfDocument.destroy();
      } catch (cleanupError) {
        console.error("Error cleaning up PDF document:", cleanupError);
      }
    }
    
    // Send proper error response
    res.status(500).json({
    success: false,
    error: "Error processing PDF",
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
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
    const limitedText = text.substring(0, 4000);
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

  // Clean up uploaded file
  if (article.source && fs.existsSync(article.source)) {
    fs.unlinkSync(article.source);
  }

  await Article.findByIdAndDelete(req.params.id);
  res.json({ message: "Article removed successfully" });
});

export {
  uploadArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  retryProcessing,
  searchArticles
};