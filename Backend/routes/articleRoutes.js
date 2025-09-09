import express from "express";
import {
  uploadArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  retryProcessing,
  searchArticles,
  summarizeUrl
} from "../controllers/articleController.js";
import { uploadMiddleware } from "../services/cloudinaryService.js"; // Updated
//import cloudinary from '../services/cloudinaryService.js';

const router = express.Router();

// Cloudinary Test route. Uncomment to test.
/*
router.get("/test-cloudinary", async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    const config = cloudinary.config();
    res.json({ 
      success: true, 
      message: 'Cloudinary connected successfully',
      cloud_name: config.cloud_name,
      api_key: config.api_key ? 'present' : 'missing'
    });
  } catch (error) {
    console.error('Cloudinary test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
*/

// Regular routes
router.get("/", getArticles);
router.get("/search/:query", searchArticles);
router.post("/upload", uploadMiddleware, uploadArticle); // Use the middleware
router.post("/summarize-url", summarizeUrl);

// Parameterized routes
router.get("/:id", getArticleById);
router.put("/:id", updateArticle);
router.delete("/:id", deleteArticle);
router.post("/:id/retry", retryProcessing);

export default router;