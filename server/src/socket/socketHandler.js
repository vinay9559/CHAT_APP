import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';

// Helper to parse cookies from Socket.IO handshake headers
const parseCookies = (cookieString) => {
  if (!cookieString) return {};
  return cookieString.split(';').reduce((acc, curr) => {
    const parts = curr.split('=');
    const key = parts[0]?.trim();
    const val = parts.slice(1).join('=')?.trim();
    if (key) acc[key] = decodeURIComponent(val || '');
    return acc;
  }, {});
};

// Map of userId -> count of open socket connections
const onlineUsers = new Map();

export const socketHandler = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      let token = cookies.token;

      // Fallback: check handshake auth token
      if (!token && socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication failed:', error.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const username = socket.user.username;

    // Join a private room dedicated to this userId
    socket.join(userId);

    // Track online presence
    const activeConnections = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, activeConnections + 1);

    // Broadcast updated online users to everyone
    io.emit('online_users', Array.from(onlineUsers.keys()));
    console.log(`User connected: ${username} (Socket: ${socket.id}). Active connections: ${onlineUsers.get(userId)}`);

    // Handle incoming messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, messageType, mediaUrl } = data;
        const msgType = messageType || 'text';

        // Validation based on message type
        if (msgType === 'text') {
          if (!content || content.trim() === '') return;
        } else {
          // For image/video, mediaUrl is mandatory
          if (!mediaUrl) return;
        }

        // Save message to database
        const newMessage = await Message.create({
          sender: userId,
          receiver: receiverId || null,
          content: content ? content.trim() : '',
          messageType: msgType,
          mediaUrl: mediaUrl || null
        });

        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username avatar')
          .populate('receiver', 'username avatar');

        if (receiverId) {
          // Private Message: Emit to sender's room and receiver's room
          io.to(userId).to(receiverId).emit('receive_message', populatedMessage);
        } else {
          // Public Message: Emit to everyone
          io.emit('receive_message', populatedMessage);
        }
      } catch (err) {
        console.error('Error saving/sending message:', err.message);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { receiverId } = data;
      if (receiverId) {
        // Send typing status to recipient only
        socket.to(receiverId).emit('typing', {
          senderId: userId,
          username,
          receiverId
        });
      } else {
        // Send typing status to everyone except sender
        socket.broadcast.emit('typing', {
          senderId: userId,
          username,
          receiverId: null
        });
      }
    });

    socket.on('stop_typing', (data) => {
      const { receiverId } = data;
      if (receiverId) {
        socket.to(receiverId).emit('stop_typing', {
          senderId: userId,
          receiverId
        });
      } else {
        socket.broadcast.emit('stop_typing', {
          senderId: userId,
          receiverId: null
        });
      }
    });

    // Handle message reactions
    socket.on('react_message', async (data) => {
      try {
        const { messageId, emoji } = data;
        if (!messageId || !emoji) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        // Check if user already reacted with this emoji
        const existingReactionIndex = message.reactions.findIndex(
          (r) => r.username === username && r.emoji === emoji
        );

        if (existingReactionIndex > -1) {
          // Toggle off: remove reaction
          message.reactions.splice(existingReactionIndex, 1);
        } else {
          // Toggle on: add reaction
          message.reactions.push({ username, emoji });
        }

        await message.save();

        const populatedMessage = await Message.findById(messageId)
          .populate('sender', 'username avatar')
          .populate('receiver', 'username avatar');

        // Broadcast updated message to everyone
        io.emit('message_updated', populatedMessage);
      } catch (err) {
        console.error('Error handling reaction:', err.message);
      }
    });

    // Handle call signaling (WebRTC Relays)
    socket.on('call_user', (data) => {
      const { targetId, signalData, callType } = data;
      socket.to(targetId).emit('incoming_call', {
        callerId: userId,
        callerName: username,
        callerAvatar: socket.user.avatar,
        signalData,
        callType
      });
    });

    socket.on('answer_call', (data) => {
      const { targetId, signalData } = data;
      socket.to(targetId).emit('call_answered', {
        signalData
      });
    });

    socket.on('ice_candidate', (data) => {
      const { targetId, candidate } = data;
      socket.to(targetId).emit('ice_candidate', {
        candidate
      });
    });

    socket.on('end_call', (data) => {
      const { targetId } = data;
      socket.to(targetId).emit('call_ended');
    });

    socket.on('call_rejected', (data) => {
      const { targetId } = data;
      socket.to(targetId).emit('call_rejected');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const currentConnections = onlineUsers.get(userId) || 1;
      if (currentConnections <= 1) {
        onlineUsers.delete(userId);
      } else {
        onlineUsers.set(userId, currentConnections - 1);
      }

      // Broadcast updated online users to everyone
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`User disconnected: ${username} (Socket: ${socket.id}). Remaining connections: ${onlineUsers.get(userId) || 0}`);
    });
  });
};
