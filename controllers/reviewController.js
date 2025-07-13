const Review = require("../models/reviewModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Create a review
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
  const { recipientId, rating, title, comment, projectDetails } = req.body;

  // Check if recipient exists
  const recipient = await User.findById(recipientId);

  if (!recipient) {
    res.status(404);
    throw new Error("Recipient not found");
  }

  // Check if user is trying to review themselves
  if (recipient._id.toString() === req.user.id) {
    res.status(400);
    throw new Error("You cannot review yourself");
  }

  // Check if user has already reviewed this recipient
  const existingReview = await Review.findOne({
    author: req.user.id,
    recipient: recipientId,
  });

  if (existingReview) {
    res.status(400);
    throw new Error("You have already reviewed this professional");
  }

  // Create the review
  const review = await Review.create({
    author: req.user.id,
    recipient: recipientId,
    rating,
    title,
    comment,
    projectDetails,
  });

  // Populate author info
  await review.populate({
    path: "author",
    select: "firstName lastName",
  });

  res.status(201).json(review);
});

/**
 * @desc    Get all reviews for a user
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
const getUserReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.params.userId;

  // Check if user exists
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Count total documents for pagination
  const count = await Review.countDocuments({
    recipient: userId,
    isActive: true,
  });

  // Get reviews with pagination
  const reviews = await Review.find({
    recipient: userId,
    isActive: true,
  })
    .populate({
      path: "author",
      select: "firstName lastName",
    })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  // Get average rating
  const stats = await Review.getAverageRating(userId);

  res.json({
    reviews,
    page: Number(page),
    pages: Math.ceil(count / Number(limit)),
    total: count,
    stats,
  });
});

/**
 * @desc    Get a review by ID
 * @route   GET /api/reviews/:id
 * @access  Public
 */
const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    _id: req.params.id,
    isActive: true,
  })
    .populate({
      path: "author",
      select: "firstName lastName",
    })
    .populate({
      path: "recipient",
      select: "firstName lastName",
    });

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  res.json(review);
});

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const updateReview = asyncHandler(async (req, res) => {
  const { rating, title, comment, projectDetails } = req.body;

  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  // Check if user is the author of the review
  if (review.author.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to update this review");
  }

  // Update fields
  review.rating = rating || review.rating;
  review.title = title || review.title;
  review.comment = comment || review.comment;
  review.projectDetails = projectDetails || review.projectDetails;
  review.updatedAt = Date.now();

  const updatedReview = await review.save();

  // Populate author info
  await updatedReview.populate({
    path: "author",
    select: "firstName lastName",
  });

  res.json(updatedReview);
});

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  // Check if user is the author of the review
  if (review.author.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to delete this review");
  }

  // Soft delete (make inactive)
  review.isActive = false;
  await review.save();

  res.json({ message: "Review deleted successfully" });
});

/**
 * @desc    Mark a review as helpful/unhelpful
 * @route   PUT /api/reviews/:id/helpful
 * @access  Private
 */
const toggleHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    _id: req.params.id,
    isActive: true,
  });

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  // Toggle helpful status
  const userIdStr = req.user.id;

  // Check if user has already marked this as helpful
  const alreadyMarked = review.helpful.users.some(
    (id) => id.toString() === userIdStr
  );

  if (alreadyMarked) {
    // Remove the user and decrement count
    review.helpful.users = review.helpful.users.filter(
      (id) => id.toString() !== userIdStr
    );
    review.helpful.count -= 1;
  } else {
    // Add the user and increment count
    review.helpful.users.push(req.user.id);
    review.helpful.count += 1;
  }

  await review.save();

  res.json({
    helpfulCount: review.helpful.count,
    markedAsHelpful: review.helpful.users.includes(req.user.id),
  });
});

/**
 * @desc    Add a response to a review
 * @route   PUT /api/reviews/:id/respond
 * @access  Private
 */
const respondToReview = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    res.status(400);
    throw new Error("Response content is required");
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  // Check if user is the recipient of the review
  if (review.recipient.toString() !== req.user.id) {
    res.status(403);
    throw new Error(
      "Only the professional who received the review can respond"
    );
  }

  // Add response
  review.response = {
    content,
    createdAt: new Date(),
  };

  const updatedReview = await review.save();

  // Populate author and recipient info
  await updatedReview.populate([
    {
      path: "author",
      select: "firstName lastName",
    },
    {
      path: "recipient",
      select: "firstName lastName",
    },
  ]);

  res.json(updatedReview);
});

/**
 * @desc    Get reviews written by current user
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  // Count total documents for pagination
  const count = await Review.countDocuments({
    author: req.user.id,
  });

  // Get reviews with pagination
  const reviews = await Review.find({
    author: req.user.id,
  })
    .populate({
      path: "recipient",
      select: "firstName lastName",
    })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  res.json({
    reviews,
    page: Number(page),
    pages: Math.ceil(count / Number(limit)),
    total: count,
  });
});

/**
 * @desc    Verify a review (admin only)
 * @route   PUT /api/reviews/:id/verify
 * @access  Private/Admin
 */
const verifyReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  // Check if user is an admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to verify reviews");
  }

  // Mark as verified
  review.isVerified = true;
  await review.save();

  res.json({
    message: "Review verified successfully",
    isVerified: review.isVerified,
  });
});

module.exports = {
  createReview,
  getUserReviews,
  getReviewById,
  updateReview,
  deleteReview,
  toggleHelpful,
  respondToReview,
  getMyReviews,
  verifyReview,
};
