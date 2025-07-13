const express = require("express");
const router = express.Router();
const {
  getMyConversations,
  getConversationById,
  createConversation,
  getConversationMessages,
  sendMessage,
  deleteConversation,
  markConversationAsRead,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");
const { uploadMiddleware } = require("../middleware/uploadMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const {
  createConversationValidation,
  sendMessageValidation,
} = require("../utils/validationSchemas");

// All routes are protected
router.use(protect);

// Conversation routes
router.get("/conversations", getMyConversations);
router.get("/conversations/:id", getConversationById);
router.post(
  "/conversations",
  validate(createConversationValidation),
  createConversation
);
router.delete("/conversations/:id", deleteConversation);
router.put("/conversations/:id/read", markConversationAsRead);

// Message routes
router.get("/conversations/:id/messages", getConversationMessages);
router.post(
  "/conversations/:id/messages",
  uploadMiddleware.single("attachment"),
  validate(sendMessageValidation),
  sendMessage
);

module.exports = router;
