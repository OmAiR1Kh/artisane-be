// const jwt = require("jsonwebtoken");
// const User = require("../models/userModel");
// const { Conversation, Message } = require("../models/messageModel");

// /**
//  * Set up Socket.IO for real-time messaging
//  * @param {Object} io - Socket.IO server instance
//  */
// const setupSocketIO = (io) => {
//   // Stores active users: { userId: socketId }
//   const activeUsers = new Map();

//   // Socket.IO middleware for authentication
//   io.use(async (socket, next) => {
//     try {
//       const token = socket.handshake.auth.token;

//       if (!token) {
//         return next(new Error("Authentication error: Token missing"));
//       }

//       // Verify token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       // Find user
//       const user = await User.findById(decoded.id).select("-password");

//       if (!user) {
//         return next(new Error("Authentication error: User not found"));
//       }

//       // Attach user to socket
//       socket.user = user;
//       next();
//     } catch (error) {
//       console.error("Socket authentication error:", error);
//       next(new Error("Authentication error: Invalid token"));
//     }
//   });

//   io.on("connection", (socket) => {
//     console.log(
//       `User connected: ${socket.user.firstName} ${socket.user.lastName} (${socket.user._id})`
//     );

//     // Add user to active users
//     activeUsers.set(socket.user._id.toString(), socket.id);

//     // Join user to their private room
//     socket.join(socket.user._id.toString());

//     // Join all conversations user is part of
//     joinUserConversations(socket);

//     // Emit online status to other users
//     emitUserStatus(socket.user._id.toString(), true);

//     // Send active users list to client
//     socket.emit("activeUsers", Array.from(activeUsers.keys()));

//     // Handle new message
//     socket.on("sendMessage", async (data) => {
//       try {
//         const { conversationId, content, attachments = [] } = data;

//         // Validate data
//         if (!conversationId || (!content && attachments.length === 0)) {
//           return socket.emit("error", {
//             message:
//               "Conversation ID and either content or attachments are required",
//           });
//         }

//         // Find conversation
//         const conversation = await Conversation.findById(conversationId);

//         if (!conversation) {
//           return socket.emit("error", { message: "Conversation not found" });
//         }

//         // Check if user is part of the conversation
//         if (!conversation.participants.includes(socket.user._id)) {
//           return socket.emit("error", {
//             message: "Not authorized to send messages in this conversation",
//           });
//         }

//         // Create message
//         const message = await Message.create({
//           conversation: conversationId,
//           sender: socket.user._id,
//           content,
//           attachments,
//         });

//         // Populate sender info
//         await message.populate({
//           path: "sender",
//           select: "firstName lastName",
//         });

//         // Update conversation's lastMessage and updatedAt
//         conversation.lastMessage = message._id;
//         conversation.updatedAt = new Date();
//         await conversation.save();

//         // Emit message to all participants in the conversation
//         io.to(conversationId).emit("newMessage", message);

//         // Also notify participants individually if they're not in the conversation room
//         conversation.participants.forEach(async (participantId) => {
//           const participantIdStr = participantId.toString();

//           // Skip sender
//           if (participantIdStr === socket.user._id.toString()) {
//             return;
//           }

//           // Send notification to participant's personal room
//           io.to(participantIdStr).emit("messageNotification", {
//             conversationId,
//             message,
//             sender: {
//               _id: socket.user._id,
//               name: `${socket.user.firstName} ${socket.user.lastName}`,
//             },
//           });

//           // TODO: Send email notification if user is offline (not in activeUsers)
//           if (!activeUsers.has(participantIdStr)) {
//             // This would be implemented in production with emailUtils
//             // sendMessageNotificationEmail(participant.email, participant.firstName, senderName);
//           }
//         });
//       } catch (error) {
//         console.error("Send message error:", error);
//         socket.emit("error", { message: "Failed to send message" });
//       }
//     });

//     // Handle read receipts
//     socket.on("markAsRead", async (data) => {
//       try {
//         const { conversationId, messageId } = data;

//         if (!conversationId) {
//           return socket.emit("error", {
//             message: "Conversation ID is required",
//           });
//         }

//         // If messageId provided, mark specific message as read
//         if (messageId) {
//           const message = await Message.findById(messageId);

//           if (!message) {
//             return socket.emit("error", { message: "Message not found" });
//           }

//           // Mark message as read
//           await message.markAsRead(socket.user._id);

//           // Notify other participants
//           io.to(conversationId).emit("messageRead", {
//             messageId,
//             readBy: {
//               user: socket.user._id,
//               readAt: new Date(),
//             },
//           });
//         } else {
//           // Mark all messages in conversation as read
//           const messages = await Message.find({
//             conversation: conversationId,
//             sender: { $ne: socket.user._id },
//             "readBy.user": { $ne: socket.user._id },
//           });

//           // Mark all as read in parallel
//           if (messages.length > 0) {
//             await Promise.all(
//               messages.map((message) => message.markAsRead(socket.user._id))
//             );

//             // Notify other participants
//             io.to(conversationId).emit("conversationRead", {
//               conversationId,
//               readBy: socket.user._id,
//               readAt: new Date(),
//             });
//           }
//         }
//       } catch (error) {
//         console.error("Mark as read error:", error);
//         socket.emit("error", { message: "Failed to mark message as read" });
//       }
//     });

//     // Handle typing indicator
//     socket.on("typing", (data) => {
//       const { conversationId, isTyping } = data;

//       if (!conversationId) {
//         return;
//       }

//       // Broadcast typing status to other participants
//       socket.to(conversationId).emit("userTyping", {
//         conversationId,
//         user: {
//           _id: socket.user._id,
//           name: `${socket.user.firstName} ${socket.user.lastName}`,
//         },
//         isTyping,
//       });
//     });

//     // Handle join conversation
//     socket.on("joinConversation", async (data) => {
//       try {
//         const { conversationId } = data;

//         if (!conversationId) {
//           return socket.emit("error", {
//             message: "Conversation ID is required",
//           });
//         }

//         // Find conversation
//         const conversation = await Conversation.findById(conversationId);

//         if (!conversation) {
//           return socket.emit("error", { message: "Conversation not found" });
//         }

//         // Check if user is part of the conversation
//         if (!conversation.participants.includes(socket.user._id)) {
//           return socket.emit("error", {
//             message: "Not authorized to join this conversation",
//           });
//         }

//         // Join conversation room
//         socket.join(conversationId);

//         // Notify user of successful join
//         socket.emit("joinedConversation", { conversationId });
//       } catch (error) {
//         console.error("Join conversation error:", error);
//         socket.emit("error", { message: "Failed to join conversation" });
//       }
//     });

//     // Handle leave conversation
//     socket.on("leaveConversation", (data) => {
//       const { conversationId } = data;

//       if (!conversationId) {
//         return;
//       }

//       // Leave conversation room
//       socket.leave(conversationId);
//     });

//     // Handle disconnect
//     socket.on("disconnect", () => {
//       console.log(
//         `User disconnected: ${socket.user.firstName} ${socket.user.lastName} (${socket.user._id})`
//       );

//       // Remove user from active users
//       activeUsers.delete(socket.user._id.toString());

//       // Emit offline status to other users
//       emitUserStatus(socket.user._id.toString(), false);
//     });
//   });

//   /**
//    * Join user to all their conversation rooms
//    * @param {Object} socket - Socket instance
//    */
//   const joinUserConversations = async (socket) => {
//     try {
//       // Find all conversations user is part of
//       const conversations = await Conversation.find({
//         participants: socket.user._id,
//         isActive: true,
//       });

//       // Join each conversation room
//       conversations.forEach((conversation) => {
//         socket.join(conversation._id.toString());
//       });
//     } catch (error) {
//       console.error("Join user conversations error:", error);
//     }
//   };

//   /**
//    * Emit user online/offline status to relevant users
//    * @param {String} userId - User ID
//    * @param {Boolean} isOnline - Online status
//    */
//   const emitUserStatus = async (userId, isOnline) => {
//     try {
//       // Find all conversations user is part of
//       const conversations = await Conversation.find({
//         participants: userId,
//         isActive: true,
//       });

//       // Get all participants from these conversations
//       const participants = new Set();
//       conversations.forEach((conversation) => {
//         conversation.participants.forEach((participantId) => {
//           // Exclude the user themselves
//           if (participantId.toString() !== userId) {
//             participants.add(participantId.toString());
//           }
//         });
//       });

//       // Emit status to all participants
//       participants.forEach((participantId) => {
//         // Only emit to online participants
//         if (activeUsers.has(participantId)) {
//           io.to(participantId).emit("userStatus", {
//             userId,
//             isOnline,
//           });
//         }
//       });
//     } catch (error) {
//       console.error("Emit user status error:", error);
//     }
//   };
// };

// module.exports = { setupSocketIO };

const jwt = require("jsonwebtoken");
const { Conversation, Message } = require("../models/messageModel");
const User = require("../models/userModel");
const markMessageAsRead = async (messageId, userId) => {
  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return null;
    }

    // Check if user has already read this message
    if (message.readBy.some((read) => read.user.toString() === userId)) {
      return message;
    }

    // Mark as read
    message.readBy.push({
      user: userId,
      readAt: new Date(),
    });

    await message.save();
    return message;
  } catch (error) {
    console.error("Error marking message as read:", error);
    return null;
  }
};

/**
 * Socket.io setup for real-time messaging
 * @param {Server} io - Socket.io server instance
 */
const setupSocketIO = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: Token not provided"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `User connected: ${socket.user.firstName} ${socket.user.lastName} (${socket.user._id})`
    );

    // Join user's personal room for direct messages
    socket.on("joinUserRoom", (userId) => {
      if (socket.user._id.toString() === userId) {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined their personal room`);
      }
    });

    // Join a conversation room
    socket.on("joinConversation", async (conversationId) => {
      try {
        // Verify user is part of conversation
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        if (!conversation.participants.includes(socket.user._id)) {
          socket.emit("error", {
            message: "Not authorized to join this conversation",
          });
          return;
        }

        // Join the room
        socket.join(`conversation:${conversationId}`);
        console.log(
          `User ${socket.user._id} joined conversation ${conversationId}`
        );

        // Let other participants know user is online in this conversation
        socket.to(`conversation:${conversationId}`).emit("userJoined", {
          userId: socket.user._id,
          conversationId,
        });
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Leave a conversation room
    socket.on("leaveConversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(
        `User ${socket.user._id} left conversation ${conversationId}`
      );

      // Let other participants know user left this conversation
      socket.to(`conversation:${conversationId}`).emit("userLeft", {
        userId: socket.user._id,
        conversationId,
      });
    });

    // Leave user's personal room
    socket.on("leaveUserRoom", (userId) => {
      socket.leave(`user:${userId}`);
      console.log(`User ${userId} left their personal room`);
    });

    // Mark message as read
    socket.on("markAsRead", async ({ messageId, userId, conversationId }) => {
      try {
        const updatedMessage = await markMessageAsRead(messageId, userId);

        if (!updatedMessage) {
          socket.emit("error", {
            message: "Message not found or already read",
          });
          return;
        }

        // Notify sender that message was read
        io.to(`user:${updatedMessage.sender.toString()}`).emit("messageRead", {
          messageId,
          userId,
          conversationId,
        });

        // Also notify anyone in the conversation room
        io.to(`conversation:${conversationId}`).emit("messageRead", {
          messageId,
          userId,
          conversationId,
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
        socket.emit("error", { message: "Failed to mark message as read" });
      }
    });

    // Handle typing indicator
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("userTyping", {
        userId: socket.user._id,
        conversationId,
        isTyping,
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user._id}`);
    });
  });

  // Middleware to broadcast new messages
  const broadcastNewMessage = async (message) => {
    try {
      // Populate sender info
      await message.populate("sender", "firstName lastName profileImage");

      // Send to all participants in the conversation
      const conversation = await Conversation.findById(message.conversation);

      if (!conversation) return;

      conversation.participants.forEach((participantId) => {
        io.to(`user:${participantId}`).emit("newMessage", message);
      });

      // Also send to the conversation room if anyone is actively there
      io.to(`conversation:${message.conversation}`).emit("newMessage", message);

      // Update conversation's last message
      conversation.lastMessage = message._id;
      await conversation.save();
    } catch (error) {
      console.error("Error broadcasting message:", error);
    }
  };

  // Export the broadcast function to be used in the message controller
  return {
    broadcastNewMessage,
  };
};

module.exports = { setupSocketIO };
