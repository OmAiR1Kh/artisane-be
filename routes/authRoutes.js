const express = require("express");
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const {
  registerValidation,
  loginValidation,
  passwordResetValidation,
  changePasswordValidation,
} = require("../utils/validationSchemas");

// Public routes
router.post("/register", validate(registerValidation), registerUser);
router.get("/verify/:token", verifyEmail);
router.post("/login", validate(loginValidation), loginUser);
router.post("/forgot-password", forgotPassword);
router.post(
  "/reset-password/:token",
  validate(passwordResetValidation),
  resetPassword
);

// Protected routes
router.get("/me", protect, getCurrentUser);
router.put(
  "/change-password",
  protect,
  validate(changePasswordValidation),
  changePassword
);

module.exports = router;
