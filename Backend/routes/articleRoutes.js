import express from "express";
import multer from "multer";
import {
  uploadArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  retryProcessing,
  searchArticles
} from "../controllers/articleController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.get("/", getArticles);

router.get("/search/:query", searchArticles);

router.get("/:id",getArticleById)
router.put("/:id", updateArticle)
router.delete("/:id", deleteArticle);

router.post("/:id/retry", retryProcessing);
router.post("/upload", upload.single("file"), uploadArticle);

export default router;