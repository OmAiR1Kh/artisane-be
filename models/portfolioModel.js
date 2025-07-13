const mongoose = require("mongoose");

const PortfolioItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: [true, "Media type is required"],
    },
    mediaUrl: {
      type: String,
      required: [true, "Media URL is required"],
    },
    thumbnailUrl: {
      type: String,
    },
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      name: {
        type: String,
        trim: true,
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
    },
    client: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    metadata: {
      camera: String,
      lens: String,
      settings: String,
      software: String,
    },
    stats: {
      views: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for text search
PortfolioItemSchema.index({
  title: "text",
  description: "text",
  categories: "text",
  tags: "text",
});

// Create index for geospatial queries
PortfolioItemSchema.index({ "location.coordinates": "2dsphere" });

// Add a pre-save hook to ensure thumbnailUrl exists for videos
PortfolioItemSchema.pre("save", function (next) {
  if (this.mediaType === "video" && !this.thumbnailUrl) {
    this.thumbnailUrl = this.mediaUrl.replace(/\.[^/.]+$/, "-thumbnail.jpg");
  }
  next();
});

const PortfolioItem = mongoose.model("PortfolioItem", PortfolioItemSchema);

module.exports = PortfolioItem;
