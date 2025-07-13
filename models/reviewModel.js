const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Please provide a rating"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot be more than 1000 characters"],
    },
    projectDetails: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    helpful: {
      count: {
        type: Number,
        default: 0,
      },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    response: {
      content: {
        type: String,
        trim: true,
      },
      createdAt: {
        type: Date,
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

// Prevent users from reviewing themselves
ReviewSchema.pre("save", function (next) {
  if (this.author.toString() === this.recipient.toString()) {
    const error = new Error("Users cannot review themselves");
    return next(error);
  }
  next();
});

// Prevent duplicate reviews from the same author to the same recipient
ReviewSchema.index({ author: 1, recipient: 1 }, { unique: true });

// Static method to get average rating for a recipient
ReviewSchema.statics.getAverageRating = async function (recipientId) {
  const result = await this.aggregate([
    {
      $match: {
        recipient: mongoose.Types.ObjectId(recipientId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$recipient",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0
    ? {
        averageRating: parseFloat(result[0].averageRating.toFixed(1)),
        totalReviews: result[0].totalReviews,
      }
    : {
        averageRating: 0,
        totalReviews: 0,
      };
};

// Method to mark review as helpful
ReviewSchema.methods.markAsHelpful = async function (userId) {
  const userIdStr = userId.toString();

  // Check if user has already marked this as helpful
  const alreadyMarked = this.helpful.users.some(
    (id) => id.toString() === userIdStr
  );

  if (alreadyMarked) {
    // Remove the user and decrement count
    this.helpful.users = this.helpful.users.filter(
      (id) => id.toString() !== userIdStr
    );
    this.helpful.count -= 1;
  } else {
    // Add the user and increment count
    this.helpful.users.push(userId);
    this.helpful.count += 1;
  }

  await this.save();
  return this;
};

const Review = mongoose.model("Review", ReviewSchema);

module.exports = Review;
