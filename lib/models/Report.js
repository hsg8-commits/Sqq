import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    enum: ['user', 'message', 'room', 'media'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'inappropriate_content',
      'fake_account',
      'copyright_violation',
      'violence',
      'hate_speech',
      'adult_content',
      'other'
    ],
    required: true,
  },
  description: {
    type: String,
    required: false,
    maxLength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
  },
  adminAction: {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    action: {
      type: String,
      enum: ['no_action', 'warning_sent', 'content_removed', 'user_suspended', 'user_banned'],
    },
    notes: {
      type: String,
      maxLength: 1000,
    },
    actionDate: {
      type: Date,
    },
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  evidence: [{
    type: {
      type: String,
      enum: ['screenshot', 'message', 'file', 'link'],
    },
    url: String,
    description: String,
  }],
}, {
  timestamps: true,
});

// Indexes
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reporterId: 1 });
ReportSchema.index({ targetType: 1, targetId: 1 });
ReportSchema.index({ priority: 1, status: 1 });

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);