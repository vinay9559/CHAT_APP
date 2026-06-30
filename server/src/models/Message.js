import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means public global room chat message
  },
  content: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  mediaUrl: {
    type: String,
    default: null
  },
  reactions: [
    {
      username: { type: String, required: true },
      emoji: { type: String, required: true }
    }
  ]
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
