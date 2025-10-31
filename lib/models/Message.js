import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
  },
  roomID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  seen: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: [],
  }],
  readTime: {
    type: Date,
  },
  voiceData: {
    src: String,
    duration: Number,
    playedBy: [String],
  },
  fileData: {
    name: String,
    size: Number,
    type: String,
    url: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  tempId: {
    type: String,
    unique: true,
  },
  status: {
    type: String,
    enum: ["pending", "sent", "failed"],
    default: "sent",
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  hideFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: [],
  }],
  replays: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: [],
  }],
  replayedTo: mongoose.Schema.Types.Mixed,
  pinnedAt: {
    type: Date,
    default: null,
  },
  // Admin-specific fields
  isReported: {
    type: Boolean,
    default: false,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for admin queries
MessageSchema.index({ roomID: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ isReported: 1 });
MessageSchema.index({ isDeleted: 1 });
MessageSchema.index({ createdAt: -1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);