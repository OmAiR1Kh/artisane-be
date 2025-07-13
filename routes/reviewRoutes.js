const express = require("express");
const router = express.Router();
const {
  createReview,
  getUserReviews,
  getReviewById,
  updateReview,
  deleteReview,
  toggleHelpful,
  respondToReview,
  getMyReviews,
  verifyReview,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const {
  createReviewValidation,
  updateReviewValidation,
  respondToReviewValidation,
} = require("../utils/validationSchemas");

// Public routes
router.get("/user/:userId", getUserReviews);
router.get("/:id", getReviewById);

// Protected routes
router.get("/my-reviews", protect, getMyReviews);
router.post("/", protect, validate(createReviewValidation), createReview);
router.put("/:id", protect, validate(updateReviewValidation), updateReview);
router.delete("/:id", protect, deleteReview);
router.put("/:id/helpful", protect, toggleHelpful);
router.put(
  "/:id/respond",
  protect,
  validate(respondToReviewValidation),
  respondToReview
);
router.put("/:id/verify", protect, restrictTo("admin"), verifyReview);

module.exports = router;
