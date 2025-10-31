import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 20,
  },
  lastName: {
    type: String,
    default: "",
    maxLength: 20,
  },
  username: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 20,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  avatar: {
    type: String,
    required: false,
  },
  biography: {
    type: String,
    default: "",
    maxLength: 70,
  },
  type: {
    type: String,
    enum: ["private"],
    default: "private",
  },
  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline",
  },
  password: {
    type: String,
    required: true,
  },
  roomMessageTrack: {
    type: [{
      roomId: String,
      scrollPos: Number,
    }],
    default: [],
  },
  // Additional admin-specific fields
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
  warningsCount: {
    type: Number,
    default: 0,
  },
  lastWarning: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for admin queries
UserSchema.index({ username: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ isBlocked: 1 });
UserSchema.index({ createdAt: -1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);