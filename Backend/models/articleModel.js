import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    authors: {
      type: [String],
      default: [],
    },
    publicationYear: {
      type: Number,
    },
    journal: {
      type: String,
      default: "",
    },
    source: {
      type: String, // can be URL or file path
    },
    originalText: {
      type: String,
    },
    summary: {
      abstract: {
        type: String,
        default: ""
      },
      methodology: {
        type: String,
        default: ""
      },
      keyFindings: {
        type: String,
        default: ""
      },
      proposedWayForward: {
        type: String,
        default: ""
      },
      additionalInsights: {
        type: String,
        default: ""
      },
      overallSummary: {
        type: String,
        default: ""
      }
    },
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    errorMessage: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Article = mongoose.model("Article", articleSchema);

export default Article;