import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  file: {
    type: Buffer,
    required: false, // Admin panel will work with URLs
  },
  url: {
    type: String,
    required: false,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  filename: String,
  mimetype: String,
  size: Number,
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
  scanResult: {
    isScanned: {
      type: Boolean,
      default: false,
    },
    isSafe: {
      type: Boolean,
      default: true,
    },
    threats: [String],
    scannedAt: Date,
  },
}, {
  timestamps: true,
});

// Indexes for admin queries
MediaSchema.index({ sender: 1, createdAt: -1 });
MediaSchema.index({ roomID: 1, createdAt: -1 });
MediaSchema.index({ mimetype: 1 });
MediaSchema.index({ isReported: 1 });
MediaSchema.index({ isDeleted: 1 });
MediaSchema.index({ size: 1 });
MediaSchema.index({ createdAt: -1 });

export default mongoose.models.Media || mongoose.model('Media', MediaSchema);