const express = require("express");
const router = express.Router();
const {
  updateUser,
  deleteUser,
  getUserById,
  getProfessionals,
  searchUsers,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { updateUserValidation } = require("../utils/validationSchemas");

// Public routes
router.get("/professionals", getProfessionals);
router.get("/search", searchUsers);
router.get("/:id", getUserById);

// Protected routes
router.put("/", protect, validate(updateUserValidation), updateUser);
router.delete("/", protect, deleteUser);

module.exports = router;
