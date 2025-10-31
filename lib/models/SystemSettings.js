import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  category: {
    type: String,
    enum: [
      'general',
      'security',
      'notifications',
      'features',
      'limits',
      'appearance',
      'backup'
    ],
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false,
  },
}, {
  timestamps: true,
});

// Indexes
SystemSettingsSchema.index({ category: 1 });
SystemSettingsSchema.index({ key: 1 });
SystemSettingsSchema.index({ isPublic: 1 });

// Default system settings
export const defaultSettings = [
  {
    key: 'app_name',
    value: 'Telegram Clone',
    category: 'general',
    description: 'اسم التطبيق',
    dataType: 'string',
    isPublic: true,
  },
  {
    key: 'app_logo',
    value: '/logo.png',
    category: 'appearance',
    description: 'شعار التطبيق',
    dataType: 'string',
    isPublic: true,
  },
  {
    key: 'max_file_size',
    value: 50 * 1024 * 1024, // 50MB
    category: 'limits',
    description: 'الحد الأقصى لحجم الملف بالبايت',
    dataType: 'number',
    isPublic: false,
  },
  {
    key: 'max_message_length',
    value: 4096,
    category: 'limits',
    description: 'الحد الأقصى لطول الرسالة',
    dataType: 'number',
    isPublic: false,
  },
  {
    key: 'registration_enabled',
    value: true,
    category: 'security',
    description: 'تفعيل التسجيل الجديد',
    dataType: 'boolean',
    isPublic: false,
  },
  {
    key: 'guest_access_enabled',
    value: false,
    category: 'security',
    description: 'السماح بالدخول كضيف',
    dataType: 'boolean',
    isPublic: false,
  },
  {
    key: 'maintenance_mode',
    value: false,
    category: 'general',
    description: 'وضع الصيانة',
    dataType: 'boolean',
    isPublic: true,
  },
  {
    key: 'notification_sound',
    value: true,
    category: 'notifications',
    description: 'تفعيل أصوات الإشعارات',
    dataType: 'boolean',
    isPublic: true,
  },
];

export default mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);