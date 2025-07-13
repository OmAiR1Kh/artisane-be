const { body } = require("express-validator");

// User registration validation
const registerValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail({ gmail_remove_dots: false }), // UPDATED: Added option to keep dots

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),

  body("role")
    .optional()
    .isIn(["client", "photographer", "videographer"])
    .withMessage("Invalid role"),
];

// User login validation
const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail({ gmail_remove_dots: false }), // UPDATED: Added option to keep dots

  body("password").notEmpty().withMessage("Password is required"),
];

// Password reset validation
const passwordResetValidation = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
];

// Change password validation
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),
];

// Update user validation
const updateUserValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail({ gmail_remove_dots: false }), // UPDATED: Added option to keep dots
];

// Update profile validation
const updateProfileValidation = [
  body("displayName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Display name must be between 2 and 50 characters"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot be more than 500 characters"),

  body("location.city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City cannot be more than 100 characters"),

  body("location.state")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("State cannot be more than 100 characters"),

  body("location.country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country cannot be more than 100 characters"),

  body("specializations")
    .optional()
    .isArray()
    .withMessage("Specializations must be an array"),

  body("equipment")
    .optional()
    .isArray()
    .withMessage("Equipment must be an array"),

  body("pricing.hourlyRate")
    .optional()
    .isNumeric()
    .withMessage("Hourly rate must be a number")
    .isFloat({ min: 0 })
    .withMessage("Hourly rate cannot be negative"),

  body("pricing.packageInfo")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Package info cannot be more than 1000 characters"),

  body("experience.years")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Years of experience must be a positive number"),

  body("experience.description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Experience description cannot be more than 1000 characters"),

  body("contact.phone")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone number cannot be more than 20 characters"),

  body("contact.website")
    .optional()
    .trim()
    .isURL()
    .withMessage("Website must be a valid URL"),

  body("contact.socialMedia.instagram")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Instagram handle cannot be more than 100 characters"),

  body("contact.socialMedia.facebook")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Facebook handle cannot be more than 100 characters"),

  body("contact.socialMedia.twitter")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Twitter handle cannot be more than 100 characters"),

  body("contact.socialMedia.linkedin")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("LinkedIn handle cannot be more than 100 characters"),

  body("contact.socialMedia.youtube")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("YouTube handle cannot be more than 100 characters"),

  body("contact.socialMedia.vimeo")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Vimeo handle cannot be more than 100 characters"),

  body("availability")
    .optional()
    .isIn(["available", "limited", "unavailable"])
    .withMessage("Invalid availability status"),

  body("visibility")
    .optional()
    .isIn(["public", "private"])
    .withMessage("Invalid visibility setting"),
];

// Create portfolio item validation
const createPortfolioValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 100 })
    .withMessage("Title cannot be more than 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot be more than 1000 characters"),

  body("categories").optional(),

  body("tags").optional(),

  body("location").optional(),

  body("client")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Client name cannot be more than 100 characters"),

  body("date").optional().isISO8601().withMessage("Date must be a valid date"),

  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic must be a boolean value"),

  body("metadata").optional(),
];

// Update portfolio item validation
const updatePortfolioValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot be more than 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot be more than 1000 characters"),

  body("categories").optional(),

  body("tags").optional(),

  body("location").optional(),

  body("client")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Client name cannot be more than 100 characters"),

  body("date").optional().isISO8601().withMessage("Date must be a valid date"),

  body("isPublic").optional(),

  body("featured").optional(),

  body("metadata").optional(),
];

// Create conversation validation
const createConversationValidation = [
  body("receiverId")
    .notEmpty()
    .withMessage("Receiver ID is required")
    .isMongoId()
    .withMessage("Invalid receiver ID"),
];

// Send message validation
const sendMessageValidation = [
  body("content")
    .optional()
    .isLength({ max: 5000 })
    .withMessage("Message cannot be more than 5000 characters")
    .custom((value, { req }) => {
      if (!value && !req.file) {
        throw new Error("Either message content or attachment is required");
      }
      return true;
    }),
];

// Create review validation
const createReviewValidation = [
  body("recipientId")
    .notEmpty()
    .withMessage("Recipient ID is required")
    .isMongoId()
    .withMessage("Invalid recipient ID"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot be more than 100 characters"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comment cannot be more than 1000 characters"),

  body("projectDetails")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Project details cannot be more than 500 characters"),
];

// Update review validation
const updateReviewValidation = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot be more than 100 characters"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comment cannot be more than 1000 characters"),

  body("projectDetails")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Project details cannot be more than 500 characters"),
];

// Respond to review validation
const respondToReviewValidation = [
  body("content")
    .notEmpty()
    .withMessage("Response content is required")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Response cannot be more than 1000 characters"),
];

module.exports = {
  registerValidation,
  loginValidation,
  passwordResetValidation,
  changePasswordValidation,
  updateUserValidation,
  updateProfileValidation,
  createPortfolioValidation,
  updatePortfolioValidation,
  createConversationValidation,
  sendMessageValidation,
  createReviewValidation,
  updateReviewValidation,
  respondToReviewValidation,
};
