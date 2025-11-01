import mongoose from 'mongoose';

const AdminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false, // Made optional to allow logging of failed login attempts by unknown users
  },
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'USER_VIEW', 'USER_EDIT', 'USER_DELETE', 'USER_BAN', 'USER_UNBAN',
      // Message actions
      'MESSAGE_VIEW', 'MESSAGE_DELETE', 'MESSAGE_EDIT',
      // Room actions
      'ROOM_VIEW', 'ROOM_EDIT', 'ROOM_DELETE', 'ROOM_CREATE',
      // Report actions
      'REPORT_VIEW', 'REPORT_RESOLVE', 'REPORT_DISMISS',
      // System actions
      'SYSTEM_SETTINGS_VIEW', 'SYSTEM_SETTINGS_EDIT',
      'NOTIFICATION_SEND', 'BACKUP_CREATE', 'BACKUP_RESTORE',
      // Admin actions
      'ADMIN_LOGIN', 'ADMIN_LOGOUT', 'ADMIN_CREATE', 'ADMIN_EDIT', 'ADMIN_DELETE',
      // Security actions
      'PASSWORD_CHANGE', '2FA_ENABLE', '2FA_DISABLE',
    ],
  },
  target: {
    type: String, // ID or description of the target
    required: false,
  },
  targetType: {
    type: String,
    enum: ['User', 'Message', 'Room', 'Report', 'Admin', 'System'],
    required: false,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    required: false,
  },
  userAgent: {
    type: String,
    required: false,
  },
  success: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

// Indexes for performance
AdminLogSchema.index({ adminId: 1, createdAt: -1 });
AdminLogSchema.index({ action: 1, createdAt: -1 });
AdminLogSchema.index({ targetType: 1, target: 1 });
AdminLogSchema.index({ createdAt: -1 });

export default mongoose.models.AdminLog || mongoose.model('AdminLog', AdminLogSchema);