import express from "express";
import multer from "multer";
import {
  uploadArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  retryProcessing,
  searchArticles,
  summarizeUrl,
} from "../controllers/articleController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // Clean filename to avoid issues
    const cleanName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, cleanName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only one file allowed.'
      });
    }
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  // Pass other errors to the main error handler
  next(error);
};

router.get("/", getArticles);
router.get("/search/:query", searchArticles);
router.get("/:id", getArticleById);
router.put("/:id", updateArticle);
router.delete("/:id", deleteArticle);
router.post("/:id/retry", retryProcessing);
router.post("/summarize-url", summarizeUrl);

// Add multer error handling middleware
router.post("/upload", upload.single("file"), handleMulterError, uploadArticle);

export default router;