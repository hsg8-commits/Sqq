import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minLength: 3,
    maxLength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  role: {
    type: String,
    enum: ['superadmin', 'moderator', 'viewer'],
    default: 'moderator',
  },
  permissions: {
    users: {
      view: { type: Boolean, default: true },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    messages: {
      view: { type: Boolean, default: true },
      delete: { type: Boolean, default: false },
    },
    rooms: {
      view: { type: Boolean, default: true },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    reports: {
      view: { type: Boolean, default: true },
      manage: { type: Boolean, default: false },
    },
    system: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
    },
    admins: {
      view: { type: Boolean, default: false },
      manage: { type: Boolean, default: false },
    },
  },
  avatar: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    default: null,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Virtual for checking if account is locked
AdminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for performance (username and email already have unique indexes)
AdminSchema.index({ isActive: 1 });

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);