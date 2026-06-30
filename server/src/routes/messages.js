import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/messages/users
// @desc    Get all users (excluding current user) for DM list
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('username avatar createdAt');
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error.message);
    res.status(500).json({ message: 'Server error fetching user list' });
  }
});

// @route   GET /api/messages/global
// @desc    Get last 100 global public room messages
router.get('/global', protect, async (req, res) => {
  try {
    const messages = await Message.find({ receiver: null })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(100);
    
    res.json(messages);
  } catch (error) {
    console.error('Fetch global messages error:', error.message);
    res.status(500).json({ message: 'Server error fetching global messages' });
  }
});

// @route   GET /api/messages/private/:userId
// @desc    Get last 100 private messages between two users
router.get('/private/:userId', protect, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId }
      ]
    })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Fetch private messages error:', error.message);
    res.status(500).json({ message: 'Server error fetching private messages' });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get all users with whom current user has messages
router.get('/conversations', protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find messages involving current user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    }).select('sender receiver');

    // Extract unique partner user IDs
    const partnerIds = new Set();
    messages.forEach((msg) => {
      if (msg.sender && msg.sender.toString() !== currentUserId.toString()) {
        partnerIds.add(msg.sender.toString());
      }
      if (msg.receiver && msg.receiver.toString() !== currentUserId.toString()) {
        partnerIds.add(msg.receiver.toString());
      }
    });

    // Retrieve username and avatar details for conversation partners
    const partners = await User.find({ _id: { $in: Array.from(partnerIds) } })
      .select('username avatar');

    res.json(partners);
  } catch (error) {
    console.error('Fetch conversations error:', error.message);
    res.status(500).json({ message: 'Server error fetching conversations' });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a specific message (sender only)
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify sender
    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this message' });
    }

    await message.deleteOne();

    // Broadcast real-time deletion
    const io = req.app.get('io');
    if (io) {
      const deletePayload = {
        messageId: message._id,
        senderId: message.sender,
        receiverId: message.receiver
      };

      if (message.receiver) {
        // Private chat: notify both users
        io.to(message.sender.toString()).to(message.receiver.toString()).emit('message_deleted', deletePayload);
      } else {
        // Global chat: notify everyone
        io.emit('message_deleted', deletePayload);
      }
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error.message);
    res.status(500).json({ message: 'Server error deleting message' });
  }
});

// @route   DELETE /api/messages/private/:userId
// @desc    Delete all messages in a private conversation
router.delete('/private/:userId', protect, async (req, res) => {
  try {
    const partnerId = req.params.userId;
    const currentUserId = req.user._id;

    await Message.deleteMany({
      $or: [
        { sender: currentUserId, receiver: partnerId },
        { sender: partnerId, receiver: currentUserId }
      ]
    });

    // Broadcast real-time conversation deletion
    const io = req.app.get('io');
    if (io) {
      io.to(currentUserId.toString()).to(partnerId.toString()).emit('conversation_deleted', {
        deleterId: currentUserId,
        partnerId
      });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error.message);
    res.status(500).json({ message: 'Server error deleting conversation' });
  }
});

export default router;
