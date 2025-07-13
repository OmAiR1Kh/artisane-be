const express = require("express");
const router = express.Router();
const {
  getMyPortfolio,
  getPortfolioItemById,
  getUserPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  toggleLikePortfolioItem,
  searchPortfolioItems,
  updatePortfolioMedia,
} = require("../controllers/portfolioController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const { uploadMiddleware } = require("../middleware/uploadMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const {
  createPortfolioValidation,
  updatePortfolioValidation,
} = require("../utils/validationSchemas");

// Public routes
router.get("/search", searchPortfolioItems);
router.get("/user/:userId", getUserPortfolio);
router.get("/me", protect, getMyPortfolio);
router.get("/:id", getPortfolioItemById);

// Protected routes
router.post(
  "/",
  protect,
  restrictTo("photographer", "videographer", "admin"),
  uploadMiddleware.single("media"),
  validate(createPortfolioValidation),
  createPortfolioItem
);
router.put(
  "/:id",
  protect,
  validate(updatePortfolioValidation),
  updatePortfolioItem
);
router.delete("/:id", protect, deletePortfolioItem);
router.put("/:id/like", protect, toggleLikePortfolioItem);
router.put(
  "/:id/media",
  protect,
  uploadMiddleware.single("media"),
  updatePortfolioMedia
);

module.exports = router;
