// const { Conversation, Message } = require("../models/messageModel");
// const User = require("../models/userModel");
// const asyncHandler = require("express-async-handler");
// const mongoose = require("mongoose");

// /**
//  * @desc    Get all conversations for current user
//  * @route   GET /api/messages/conversations
//  * @access  Private
//  */
// const getMyConversations = asyncHandler(async (req, res) => {
//   // Find all conversations where the current user is a participant
//   const conversations = await Conversation.find({
//     participants: { $in: [req.user.id] },
//     isActive: true,
//   })
//     .populate("participants", "firstName lastName profileImage")
//     .populate("lastMessage", "content createdAt readBy")
//     .sort({ updatedAt: -1 });

//   // Transform conversations to include other participant info
//   const transformedConversations = conversations.map((conversation) => {
//     const otherParticipants = conversation.participants.filter(
//       (participant) => participant._id.toString() !== req.user.id
//     );

//     // Check if the last message has been read by the current user
//     let isUnread = false;
//     if (
//       conversation.lastMessage &&
//       conversation.lastMessage.sender &&
//       conversation.lastMessage.sender.toString() !== req.user.id
//     ) {
//       isUnread = !conversation.lastMessage.readBy.some(
//         (read) => read.user.toString() === req.user.id
//       );
//     }

//     return {
//       _id: conversation._id,
//       participants: conversation.participants,
//       otherParticipants,
//       lastMessage: conversation.lastMessage,
//       isUnread,
//       createdAt: conversation.createdAt,
//       updatedAt: conversation.updatedAt,
//     };
//   });

//   res.json(transformedConversations);
// });

// /**
//  * @desc    Get conversation by ID
//  * @route   GET /api/messages/conversations/:id
//  * @access  Private
//  */
// const getConversationById = asyncHandler(async (req, res) => {
//   const conversation = await Conversation.findById(req.params.id).populate(
//     "participants",
//     "firstName lastName profileImage"
//   );

//   if (!conversation) {
//     res.status(404);
//     throw new Error("Conversation not found");
//   }

//   // Check if user is a participant
//   if (
//     !conversation.participants.some(
//       (participant) => participant._id.toString() === req.user.id
//     )
//   ) {
//     res.status(403);
//     throw new Error("Not authorized to access this conversation");
//   }

//   // Get other participants
//   const otherParticipants = conversation.participants.filter(
//     (participant) => participant._id.toString() !== req.user.id
//   );

//   res.json({
//     _id: conversation._id,
//     participants: conversation.participants,
//     otherParticipants,
//     createdAt: conversation.createdAt,
//     updatedAt: conversation.updatedAt,
//   });
// });

// /**
//  * @desc    Create or get conversation with another user
//  * @route   POST /api/messages/conversations
//  * @access  Private
//  */
// const createConversation = asyncHandler(async (req, res) => {
//   const { participantId } = req.body;

//   if (!participantId) {
//     res.status(400);
//     throw new Error("Please provide a participant ID");
//   }

//   // Verify participant exists
//   const participant = await User.findById(participantId);
//   if (!participant) {
//     res.status(404);
//     throw new Error("User not found");
//   }

//   // Don't allow conversation with self
//   if (participantId === req.user.id) {
//     res.status(400);
//     throw new Error("Cannot create conversation with yourself");
//   }

//   // Check if conversation already exists
//   let conversation = await Conversation.findOne({
//     participants: { $all: [req.user.id, participantId] },
//     isActive: true,
//   }).populate("participants", "firstName lastName profileImage");

//   // If conversation exists, return it
//   if (conversation) {
//     // Get other participants
//     const otherParticipants = conversation.participants.filter(
//       (participant) => participant._id.toString() !== req.user.id
//     );

//     return res.json({
//       _id: conversation._id,
//       participants: conversation.participants,
//       otherParticipants,
//       createdAt: conversation.createdAt,
//       updatedAt: conversation.updatedAt,
//       isNew: false,
//     });
//   }

//   // Create new conversation
//   conversation = await Conversation.create({
//     participants: [req.user.id, participantId],
//   });

//   // Populate participants
//   await conversation.populate(
//     "participants",
//     "firstName lastName profileImage"
//   );

//   // Get other participants
//   const otherParticipants = conversation.participants.filter(
//     (participant) => participant._id.toString() !== req.user.id
//   );

//   res.status(201).json({
//     _id: conversation._id,
//     participants: conversation.participants,
//     otherParticipants,
//     createdAt: conversation.createdAt,
//     updatedAt: conversation.updatedAt,
//     isNew: true,
//   });
// });

// /**
//  * @desc    Get messages in a conversation
//  * @route   GET /api/messages/conversations/:id/messages
//  * @access  Private
//  */
// const getConversationMessages = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 20 } = req.query;

//   // Find conversation
//   const conversation = await Conversation.findById(req.params.id);

//   if (!conversation) {
//     res.status(404);
//     throw new Error("Conversation not found");
//   }

//   // Check if user is a participant
//   if (!conversation.participants.includes(req.user.id)) {
//     res.status(403);
//     throw new Error("Not authorized to access this conversation");
//   }

//   // Count total messages for pagination
//   const count = await Message.countDocuments({ conversation: req.params.id });

//   // Get messages with pagination, sorted by newest first
//   // But return them in ascending order for display
//   const messages = await Message.find({ conversation: req.params.id })
//     .populate("sender", "firstName lastName profileImage")
//     .sort({ createdAt: -1 })
//     .limit(Number(limit))
//     .skip((Number(page) - 1) * Number(limit));

//   // Mark messages as read
//   await Promise.all(
//     messages.map(async (message) => {
//       if (
//         message.sender._id.toString() !== req.user.id &&
//         !message.readBy.some((read) => read.user.toString() === req.user.id)
//       ) {
//         await message.markAsRead(req.user.id);
//       }
//       return message;
//     })
//   );

//   // Return in ascending order for display
//   res.json({
//     messages: messages.reverse(),
//     page: Number(page),
//     pages: Math.ceil(count / Number(limit)),
//     total: count,
//   });
// });

// /**
//  * @desc    Send message in a conversation
//  * @route   POST /api/messages/conversations/:id/messages
//  * @access  Private
//  */
// const sendMessage = asyncHandler(async (req, res) => {
//   const { content } = req.body;

//   if (!content) {
//     res.status(400);
//     throw new Error("Please provide a message content");
//   }

//   // Find conversation
//   const conversation = await Conversation.findById(req.params.id);

//   if (!conversation) {
//     res.status(404);
//     throw new Error("Conversation not found");
//   }

//   // Check if user is a participant
//   if (!conversation.participants.includes(req.user.id)) {
//     res.status(403);
//     throw new Error("Not authorized to send messages in this conversation");
//   }

//   // Create message
//   const message = await Message.create({
//     conversation: req.params.id,
//     sender: req.user.id,
//     content,
//     readBy: [{ user: req.user.id }], // Mark as read by sender
//   });

//   // Populate sender info
//   await message.populate("sender", "firstName lastName profileImage");

//   res.status(201).json(message);
// });

// /**
//  * @desc    Mark all messages in a conversation as read
//  * @route   PUT /api/messages/conversations/:id/read
//  * @access  Private
//  */
// const markConversationAsRead = asyncHandler(async (req, res) => {
//   // Find conversation
//   const conversation = await Conversation.findById(req.params.id);

//   if (!conversation) {
//     res.status(404);
//     throw new Error("Conversation not found");
//   }

//   // Check if user is a participant
//   if (!conversation.participants.includes(req.user.id)) {
//     res.status(403);
//     throw new Error("Not authorized to access this conversation");
//   }

//   // Mark all unread messages from other participants as read
//   await Message.updateMany(
//     {
//       conversation: req.params.id,
//       sender: { $ne: req.user.id },
//       "readBy.user": { $ne: req.user.id },
//     },
//     {
//       $push: {
//         readBy: {
//           user: req.user.id,
//           readAt: new Date(),
//         },
//       },
//     }
//   );

//   res.json({ message: "All messages marked as read" });
// });

// /**
//  * @desc    Delete/archive conversation
//  * @route   DELETE /api/messages/conversations/:id
//  * @access  Private
//  */
// const deleteConversation = asyncHandler(async (req, res) => {
//   // Find conversation
//   const conversation = await Conversation.findById(req.params.id);

//   if (!conversation) {
//     res.status(404);
//     throw new Error("Conversation not found");
//   }

//   // Check if user is a participant
//   if (!conversation.participants.includes(req.user.id)) {
//     res.status(403);
//     throw new Error("Not authorized to delete this conversation");
//   }

//   // Instead of deleting, mark as inactive
//   conversation.isActive = false;
//   await conversation.save();

//   res.json({ message: "Conversation deleted successfully" });
// });

// /**
//  * @desc    Get unread message counts
//  * @route   GET /api/messages/unread
//  * @access  Private
//  */
// const getUnreadCount = asyncHandler(async (req, res) => {
//   // Aggregate to get unread message count per conversation
//   const conversationCounts = await Message.aggregate([
//     {
//       $match: {
//         sender: { $ne: mongoose.Types.ObjectId(req.user.id) },
//         "readBy.user": { $ne: mongoose.Types.ObjectId(req.user.id) },
//       },
//     },
//     {
//       $group: {
//         _id: "$conversation",
//         count: { $sum: 1 },
//       },
//     },
//   ]);

//   // Calculate total unread count
//   const totalUnread = conversationCounts.reduce(
//     (acc, conv) => acc + conv.count,
//     0
//   );

//   res.json({
//     totalUnread,
//     conversationCounts,
//   });
// });

// module.exports = {
//   getMyConversations,
//   getConversationById,
//   createConversation,
//   getConversationMessages,
//   sendMessage,
//   markConversationAsRead,
//   deleteConversation,
//   getUnreadCount,
// };

const { Conversation, Message } = require("../models/messageModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

// Cache for active conversations to reduce DB queries
const conversationCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Clear conversation from cache when it's updated
const clearConversationCache = (conversationId) => {
  conversationCache.delete(conversationId.toString());
};

/**
 * @desc    Get all conversations for current user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
const getMyConversations = asyncHandler(async (req, res) => {
  // Use lean() for better performance when we don't need to modify the documents
  const conversations = await Conversation.find({
    participants: { $in: [req.user.id] },
    isActive: true,
  })
    .populate("participants", "firstName lastName profileImage")
    .populate("lastMessage", "content createdAt readBy sender")
    .sort({ updatedAt: -1 })
    .lean();

  // Transform conversations to include other participant info
  const transformedConversations = conversations.map((conversation) => {
    const otherParticipants = conversation.participants.filter(
      (participant) => participant._id.toString() !== req.user.id
    );

    // Check if the last message has been read by the current user
    let isUnread = false;
    if (
      conversation.lastMessage &&
      conversation.lastMessage.sender &&
      conversation.lastMessage.sender.toString() !== req.user.id
    ) {
      isUnread = !conversation.lastMessage.readBy.some(
        (read) => read.user.toString() === req.user.id
      );
    }

    return {
      _id: conversation._id,
      participants: conversation.participants,
      otherParticipants,
      lastMessage: conversation.lastMessage,
      isUnread,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  });

  res.json(transformedConversations);
});

/**
 * @desc    Get conversation by ID
 * @route   GET /api/messages/conversations/:id
 * @access  Private
 */
const getConversationById = asyncHandler(async (req, res) => {
  const conversationId = req.params.id;

  // Check cache first
  const cacheKey = conversationId.toString();
  if (conversationCache.has(cacheKey)) {
    const { data, timestamp } = conversationCache.get(cacheKey);

    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_TTL) {
      // Verify the current user has access to this cached conversation
      if (data.participants.some((p) => p._id.toString() === req.user.id)) {
        return res.json(data);
      }
    } else {
      // Cache expired, remove it
      conversationCache.delete(cacheKey);
    }
  }

  const conversation = await Conversation.findById(conversationId)
    .populate("participants", "firstName lastName profileImage")
    .lean();

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  // Check if user is a participant
  if (
    !conversation.participants.some(
      (participant) => participant._id.toString() === req.user.id
    )
  ) {
    res.status(403);
    throw new Error("Not authorized to access this conversation");
  }

  // Get other participants
  const otherParticipants = conversation.participants.filter(
    (participant) => participant._id.toString() !== req.user.id
  );

  const result = {
    _id: conversation._id,
    participants: conversation.participants,
    otherParticipants,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };

  // Cache the result
  conversationCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  });

  res.json(result);
});

/**
 * @desc    Create or get conversation with another user
 * @route   POST /api/messages/conversations
 * @access  Private
 */
const createConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.body;

  if (!participantId) {
    res.status(400);
    throw new Error("Please provide a participant ID");
  }

  // Verify participant exists
  const participant = await User.findById(participantId)
    .select("firstName lastName profileImage")
    .lean();
  if (!participant) {
    res.status(404);
    throw new Error("User not found");
  }

  // Don't allow conversation with self
  if (participantId === req.user.id) {
    res.status(400);
    throw new Error("Cannot create conversation with yourself");
  }

  // Use session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId] },
      isActive: true,
    })
      .populate("participants", "firstName lastName profileImage")
      .session(session);

    // If conversation exists, return it
    if (conversation) {
      // Get other participants
      const otherParticipants = conversation.participants.filter(
        (participant) => participant._id.toString() !== req.user.id
      );

      await session.commitTransaction();
      session.endSession();

      return res.json({
        _id: conversation._id,
        participants: conversation.participants,
        otherParticipants,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        isNew: false,
      });
    }

    // Create new conversation
    conversation = await Conversation.create(
      [
        {
          participants: [req.user.id, participantId],
        },
      ],
      { session }
    );

    // Extract the created conversation
    conversation = conversation[0];

    // Populate participants
    await conversation.populate(
      "participants",
      "firstName lastName profileImage"
    );

    // Get other participants
    const otherParticipants = conversation.participants.filter(
      (participant) => participant._id.toString() !== req.user.id
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      _id: conversation._id,
      participants: conversation.participants,
      otherParticipants,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      isNew: true,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/**
 * @desc    Get messages in a conversation
 * @route   GET /api/messages/conversations/:id/messages
 * @access  Private
 */
const getConversationMessages = asyncHandler(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const conversationId = req.params.id;

  // Validate page and limit
  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    res.status(400);
    throw new Error("Invalid pagination parameters");
  }

  // Find conversation
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  // Check if user is a participant
  if (!conversation.participants.includes(req.user.id)) {
    res.status(403);
    throw new Error("Not authorized to access this conversation");
  }

  // Count total messages for pagination
  const count = await Message.countDocuments({ conversation: conversationId });

  // Get messages with pagination, sorted by newest first
  // But return them in ascending order for display
  const messages = await Message.find({ conversation: conversationId })
    .populate("sender", "firstName lastName profileImage")
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .lean(); // Using lean() for better performance

  // For marking messages as read, use a batch update instead of individual updates
  const unreadMessageIds = messages
    .filter(
      (message) =>
        message.sender._id.toString() !== req.user.id &&
        !message.readBy.some((read) => read.user.toString() === req.user.id)
    )
    .map((message) => message._id);

  if (unreadMessageIds.length > 0) {
    // Mark messages as read in a single query
    await Message.updateMany(
      { _id: { $in: unreadMessageIds } },
      {
        $push: {
          readBy: {
            user: req.user.id,
            readAt: new Date(),
          },
        },
      }
    );

    // Update the read status in the response
    unreadMessageIds.forEach((id) => {
      const message = messages.find((m) => m._id.toString() === id.toString());
      if (message) {
        message.readBy.push({
          user: req.user.id,
          readAt: new Date(),
        });
      }
    });

    // Emit socket events for read messages if socket.io is available
    const io = req.app.get("io");
    if (io) {
      unreadMessageIds.forEach((messageId) => {
        const message = messages.find(
          (m) => m._id.toString() === messageId.toString()
        );
        if (message && message.sender) {
          io.to(`user:${message.sender._id.toString()}`).emit("messageRead", {
            messageId,
            userId: req.user.id,
            conversationId,
          });
        }
      });
    }
  }

  // Return in ascending order for display
  res.json({
    messages: messages.reverse(),
    page: Number(page),
    pages: Math.ceil(count / Number(limit)),
    total: count,
  });
});

/**
 * @desc    Send message in a conversation
 * @route   POST /api/messages/conversations/:id/messages
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const conversationId = req.params.id;

  if (!content) {
    res.status(400);
    throw new Error("Please provide a message content");
  }

  // Find conversation
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  // Check if user is a participant
  if (!conversation.participants.includes(req.user.id)) {
    res.status(403);
    throw new Error("Not authorized to send messages in this conversation");
  }

  // Process attachment if present
  let attachmentPath = null;
  if (req.file) {
    attachmentPath = `/uploads/messages/${req.file.filename}`;
  }

  // Create message
  const message = await Message.create({
    conversation: conversationId,
    sender: req.user.id,
    content,
    attachments: attachmentPath ? [attachmentPath] : [],
    readBy: [{ user: req.user.id }], // Mark as read by sender
  });

  // Populate sender info
  await message.populate("sender", "firstName lastName profileImage");

  // Update conversation's last message and updatedAt
  conversation.lastMessage = message._id;
  conversation.updatedAt = new Date();
  await conversation.save();

  // Clear conversation cache
  clearConversationCache(conversationId);

  // Get socket handler from app
  const io = req.app.get("io");
  if (io && io.broadcastNewMessage) {
    await io.broadcastNewMessage(message);
  }

  res.status(201).json(message);
});

/**
 * @desc    Mark all messages in a conversation as read
 * @route   PUT /api/messages/conversations/:id/read
 * @access  Private
 */
const markConversationAsRead = asyncHandler(async (req, res) => {
  const conversationId = req.params.id;

  // Find conversation
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  // Check if user is a participant
  if (!conversation.participants.includes(req.user.id)) {
    res.status(403);
    throw new Error("Not authorized to access this conversation");
  }

  // Mark all unread messages from other participants as read
  const result = await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: req.user.id },
      "readBy.user": { $ne: req.user.id },
    },
    {
      $push: {
        readBy: {
          user: req.user.id,
          readAt: new Date(),
        },
      },
    }
  );

  // Notify senders about read messages
  if (result.modifiedCount > 0) {
    // Find the messages that were just marked as read
    const messages = await Message.find({
      conversation: conversationId,
      sender: { $ne: req.user.id },
      "readBy.user": req.user.id,
    })
      .select("_id sender")
      .lean();

    // Notify senders via socket.io if available
    const io = req.app.get("io");
    if (io) {
      const senderIds = [...new Set(messages.map((m) => m.sender.toString()))];

      senderIds.forEach((senderId) => {
        const senderMessages = messages.filter(
          (m) => m.sender.toString() === senderId
        );

        senderMessages.forEach((message) => {
          io.to(`user:${senderId}`).emit("messageRead", {
            messageId: message._id,
            userId: req.user.id,
            conversationId,
          });
        });
      });
    }
  }

  res.json({
    message: "All messages marked as read",
    markedCount: result.modifiedCount,
  });
});

/**
 * @desc    Delete/archive conversation
 * @route   DELETE /api/messages/conversations/:id
 * @access  Private
 */
const deleteConversation = asyncHandler(async (req, res) => {
  const conversationId = req.params.id;

  // Find conversation
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  // Check if user is a participant
  if (!conversation.participants.includes(req.user.id)) {
    res.status(403);
    throw new Error("Not authorized to delete this conversation");
  }

  // Instead of deleting, mark as inactive
  conversation.isActive = false;
  await conversation.save();

  // Clear from cache
  clearConversationCache(conversationId);

  res.json({ message: "Conversation deleted successfully" });
});

/**
 * @desc    Get unread message counts
 * @route   GET /api/messages/unread
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  // Use ObjectId for correct matching
  const userId = mongoose.Types.ObjectId(req.user.id);

  // Aggregate to get unread message count per conversation
  const conversationCounts = await Message.aggregate([
    {
      $match: {
        sender: { $ne: userId },
        "readBy.user": { $ne: userId },
      },
    },
    {
      $group: {
        _id: "$conversation",
        count: { $sum: 1 },
      },
    },
  ]);

  // Calculate total unread count
  const totalUnread = conversationCounts.reduce(
    (acc, conv) => acc + conv.count,
    0
  );

  res.json({
    totalUnread,
    conversationCounts,
  });
});

module.exports = {
  getMyConversations,
  getConversationById,
  createConversation,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  deleteConversation,
  getUnreadCount,
};
