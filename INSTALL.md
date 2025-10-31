# دليل التثبيت والإعداد - Installation Guide

## متطلبات النظام - System Requirements

- **Node.js**: الإصدار 16 أو أحدث
- **MongoDB**: الإصدار 4.0 أو أحدث  
- **npm**: يأتي مع Node.js
- **ذاكرة**: 512MB على الأقل
- **مساحة**: 200MB للملفات + مساحة قاعدة البيانات

## خطوات التثبيت السريع - Quick Installation

### 1. تحميل الملفات
```bash
# إذا كان لديك Git
git clone <repository-url>
cd admin-panel

# أو فك الضغط إذا كان ملف ZIP
unzip admin-panel.zip
cd admin-panel
```

### 2. تثبيت Node.js (إذا لم يكن مثبتاً)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows - تحميل من الموقع الرسمي
# https://nodejs.org/

# macOS
brew install node
```

### 3. تثبيت MongoDB (إذا لم يكن مثبتاً)
```bash
# Ubuntu/Debian
sudo apt-get install mongodb-server

# Windows - تحميل من الموقع الرسمي
# https://www.mongodb.com/try/download/community

# macOS
brew install mongodb-community
```

### 4. تشغيل السكريبت التلقائي
```bash
./scripts/start.sh
```

هذا السكريبت سيقوم بـ:
- ✅ فحص النظام والمتطلبات
- 📦 تثبيت المكتبات المطلوبة
- 🔧 إعداد قاعدة البيانات
- 👤 إنشاء حسابات المشرفين
- 🚀 تشغيل التطبيق

## التثبيت اليدوي - Manual Installation

إذا كنت تفضل التحكم الكامل في عملية التثبيت:

### 1. تثبيت المكتبات
```bash
npm install
```

### 2. إعداد متغيرات البيئة
```bash
cp .env.example .env
nano .env  # أو أي محرر نصوص
```

قم بتعديل الإعدادات التالية:
```env
# قاعدة البيانات
MONGODB_URI=mongodb://localhost:27017/telegram_clone

# مفتاح التشفير (غيّر هذا!)
JWT_SECRET=your_super_secret_jwt_key_here

# كلمة مرور المشرف الافتراضية
ADMIN_DEFAULT_PASSWORD=admin123456

# بريد المشرف الرئيسي
SUPER_ADMIN_EMAIL=admin@yoursite.com

# عناوين الخدمات
NEXT_PUBLIC_API_URL=http://localhost:3002
SOCKET_SERVER_URL=http://localhost:3001
```

### 3. تهيئة قاعدة البيانات
```bash
node scripts/init-admin.js
```

### 4. تشغيل التطبيق
```bash
npm run dev
```

## بيانات الدخول الافتراضية

بعد التثبيت الناجح، ستجد الحسابات التالية:

### المشرف العام (Super Admin)
- **الرابط**: http://localhost:3002
- **اسم المستخدم**: `superadmin`
- **كلمة المرور**: `admin123456`
- **الصلاحيات**: جميع الصلاحيات

### المشرف العادي (Moderator)  
- **اسم المستخدم**: `moderator`
- **كلمة المرور**: `moderator123456`
- **الصلاحيات**: إدارة المحتوى والمستخدمين

⚠️ **مهم جداً**: غيّر كلمات المرور هذه فوراً بعد أول تسجيل دخول!

## إعدادات الإنتاج - Production Setup

للاستخدام في بيئة الإنتاج:

### 1. متغيرات البيئة الآمنة
```env
NODE_ENV=production
JWT_SECRET=very_long_random_string_here
MONGODB_URI=mongodb://username:password@host:port/database
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### 2. بناء التطبيق
```bash
npm run build
npm start
```

### 3. استخدام PM2 لإدارة العملية
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### 4. إعداد Nginx (اختياري)
```nginx
server {
    listen 80;
    server_name your-admin-domain.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## استكشاف الأخطاء - Troubleshooting

### مشكلة الاتصال بقاعدة البيانات
```bash
# تأكد من تشغيل MongoDB
sudo systemctl status mongodb
# أو
sudo service mongodb status

# إعادة تشغيل MongoDB
sudo systemctl restart mongodb
```

### مشكلة في المنافذ
```bash
# تحقق من المنافذ المستخدمة
netstat -tulpn | grep :3002
netstat -tulpn | grep :27017

# قتل العملية إذا كانت معلقة
sudo kill -9 $(lsof -ti:3002)
```

### مشكلة الصلاحيات
```bash
# إعطاء صلاحيات للمجلد
sudo chown -R $USER:$USER /path/to/admin-panel
chmod -R 755 /path/to/admin-panel
```

### إعادة تهيئة قاعدة البيانات
```bash
# حذف البيانات وإعادة الإنشاء
node -e "
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);
await mongoose.connection.dropDatabase();
console.log('Database cleared');
process.exit(0);
"

# ثم إعادة التهيئة
node scripts/init-admin.js
```

### رسائل خطأ شائعة

| الخطأ | الحل |
|-------|------|
| `Cannot connect to MongoDB` | تأكد من تشغيل MongoDB وصحة MONGODB_URI |
| `Port 3002 already in use` | غيّر المنفذ أو أوقف العملية المستخدمة له |
| `JWT_SECRET is required` | تأكد من وجود JWT_SECRET في ملف .env |
| `Permission denied` | أعط صلاحيات القراءة والكتابة للمجلد |

## الصيانة والتحديث

### النسخ الاحتياطية
```bash
# نسخة احتياطية لقاعدة البيانات
mongodump --db telegram_clone --out backup/$(date +%Y%m%d)

# نسخة احتياطية للملفات
tar -czf admin-panel-backup-$(date +%Y%m%d).tar.gz admin-panel/
```

### مراقبة الأداء
```bash
# استخدام الذاكرة
ps aux | grep node

# حجم قاعدة البيانات
mongo telegram_clone --eval "db.stats()"

# سجلات التطبيق
tail -f logs/admin.log
```

### تحديث النظام
```bash
# تحديث المكتبات
npm update

# إعادة بناء التطبيق
npm run build

# إعادة تشغيل
pm2 restart admin-panel
```

## الدعم الفني

إذا واجهت أي مشاكل:

1. **تحقق من السجلات**: `tail -f logs/error.log`
2. **راجع الإعدادات**: تأكد من صحة ملف `.env`
3. **أعد تشغيل الخدمات**: MongoDB و Node.js
4. **تحقق من المساحة**: تأكد من توفر مساحة كافية
5. **راجع الصلاحيات**: تأكد من صلاحيات الملفات والمجلدات

## معلومات إضافية

- **الوثائق الكاملة**: راجع ملف README.md
- **كود المصدر**: جميع الملفات مفتوحة المصدر
- **التخصيص**: يمكن تعديل الألوان والنصوص من ملفات الإعداد
- **التوسعات**: يمكن إضافة ميزات جديدة بسهولة

---
**تم التطوير خصيصاً لمشروع Telegram Clone**  
**© 2024 Admin Panel**