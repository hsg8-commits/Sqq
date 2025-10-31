import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["group", "private", "channel"],
    required: true,
  },
  avatar: String,
  description: String,
  biography: String,
  link: String,
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
  }],
  medias: [mongoose.Schema.Types.Mixed],
  locations: [mongoose.Schema.Types.Mixed],
  // Admin-specific fields
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockReason: {
    type: String,
    default: null,
  },
  blockedAt: {
    type: Date,
    default: null,
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
  isReported: {
    type: Boolean,
    default: false,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for admin queries
RoomSchema.index({ type: 1 });
RoomSchema.index({ creator: 1 });
RoomSchema.index({ participants: 1 });
RoomSchema.index({ isBlocked: 1 });
RoomSchema.index({ isReported: 1 });
RoomSchema.index({ createdAt: -1 });

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);