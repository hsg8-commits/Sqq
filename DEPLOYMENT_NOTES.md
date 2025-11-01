# ملاحظات النشر - Deployment Notes

## ✅ المشاكل التي تم حلها

### 1. مشكلة AdminLog validation error
**المشكلة**: ظهور خطأ 500 عند محاولة تسجيل الدخول بدلاً من رسالة "اسم المستخدم أو كلمة المرور غير صحيحة".

**السبب**:
- عند محاولة تسجيل دخول بمستخدم غير موجود، يتم تسجيل الحدث في AdminLog
- كان حقل `adminId` في schema الـ AdminLog مطلوباً (`required: true`)
- عندما يكون المستخدم غير موجود، يتم تمرير `null` كـ `adminId`
- هذا يسبب خطأ validation ويؤدي إلى 500 Internal Server Error

**الحل**:
```javascript
// في lib/models/AdminLog.js
adminId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Admin',
  required: false, // جعل الحقل اختيارياً
}
```

### 2. مشكلة إعادة التحميل اللانهائية (Infinite Reload)
**المشكلة**: كانت الصفحة تُعيد تحميل نفسها باستمرار عند فتح الرابط الأساسي.

**السبب**: 
- عند محاولة التحقق من المستخدم المسجل دخوله عبر `/api/auth/profile`
- كان الـ API يرجع خطأ 401 (غير مصرح)
- الـ axios interceptor كان يقوم بإعادة توجيه المستخدم إلى `/`
- هذا يسبب حلقة لا نهائية: تحميل الصفحة → طلب profile → خطأ 401 → إعادة توجيه → تحميل الصفحة...

**الحل**:
```typescript
// في lib/axios.ts
// لا تقم بإعادة التوجيه عند فشل التحقق من profile
if (error.response?.status === 401 && !error.config.url?.includes('/api/auth/profile')) {
  // فقط أعد التوجيه للطلبات الأخرى
}
```

### 2. مشكلة Network Error
**المشكلة**: ظهور "Network Error" عند محاولة تسجيل الدخول من روابط Vercel المختلفة.

**السبب**:
- كان الـ baseURL في axios مضبوط على رابط ثابت: `https://sqq-virid.vercel.app`
- عند الدخول من رابط preview مختلف (مثل: `sqq-18y4djrf7-sjgdsofts-projects.vercel.app`)
- كانت الطلبات تذهب للدومين الخطأ مما يسبب CORS errors

**الحل**:
```typescript
// في lib/axios.ts
const axiosInstance = axios.create({
  // استخدام الدومين الحالي ديناميكياً
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  withCredentials: true,
});
```

### 3. مشكلة Database Connection أثناء البناء
**المشكلة**: فشل البناء بسبب عدم وجود MONGODB_URI.

**الحل**:
```javascript
// في lib/db.js
// لا ترمي خطأ أثناء البناء، فقط تحذير
if (!MONGODB_URI && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ MONGODB_URI is not defined');
}
```

## 🔧 إعدادات Vercel المطلوبة

تأكد من إضافة المتغيرات البيئية التالية في إعدادات Vercel:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-very-secret-jwt-key-here
NODE_ENV=production
```

### كيفية إضافة المتغيرات في Vercel:
1. اذهب إلى dashboard.vercel.com
2. اختر المشروع
3. اذهب إلى Settings → Environment Variables
4. أضف كل متغير على حدة
5. تأكد من تحديد "Production", "Preview", و "Development"

## 🚀 الآن التطبيق يعمل على:

- ✅ الرابط الأساسي: https://sqq-virid.vercel.app
- ✅ روابط Preview: https://sqq-*.vercel.app
- ✅ الروابط الداخلية: https://sqq-*-sjgdsofts-projects.vercel.app

## 🔐 بيانات الدخول الافتراضية

### المشرف العام (Super Admin)
- **اسم المستخدم**: `superadmin`
- **كلمة المرور**: `admin123456`

### المشرف العادي (Moderator)
- **اسم المستخدم**: `moderator`
- **كلمة المرور**: `moderator123456`

⚠️ **مهم جداً**: قم بتغيير كلمات المرور فور تسجيل الدخول الأول!

## 📝 ملاحظات إضافية

### ⚠️ مهم جداً: إنشاء حسابات المشرفين

**قبل أن تتمكن من تسجيل الدخول**، يجب إنشاء حساب المشرف الأساسي في قاعدة البيانات:

#### الطريقة 1: تشغيل السكريبت محلياً (موصى به)
```bash
# 1. انسخ المشروع على جهازك
git clone [repository-url]

# 2. ثبت المكتبات
npm install

# 3. أنشئ ملف .env بنفس بيانات Vercel
# تأكد من أن MONGODB_URI هو نفسه المستخدم في Vercel

# 4. شغل السكريبت
node scripts/init-admin.js
```

#### الطريقة 2: إنشاء الحساب يدوياً في MongoDB
إذا لم تتمكن من تشغيل السكريبت، يمكنك إنشاء المشرف يدوياً:

1. اذهب إلى MongoDB Atlas/Compass
2. افتح قاعدة بياناتك
3. أنشئ collection جديدة اسمها `admins`
4. أضف document بهذا الشكل:

```javascript
{
  username: "superadmin",
  email: "admin@telegram.com",
  password: "$2a$12$YOUR_HASHED_PASSWORD_HERE", // كلمة المرور مشفرة بـ bcrypt
  role: "superadmin",
  permissions: ["ALL"],
  isActive: true,
  loginAttempts: 0,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

**لتشفير كلمة المرور**، استخدم أي أداة bcrypt online مع:
- كلمة المرور: `admin123456`
- Salt rounds: `12`

#### الطريقة 3: استخدام API endpoint المؤقت (الأسهل) ⭐
قمنا بإنشاء API endpoint مؤقت لتسهيل إنشاء المشرف الأول:

**خطوات الاستخدام:**

1. **افتح المتصفح** واذهب إلى:
   ```
   https://sqq-virid.vercel.app/api/setup/init-admin
   ```
   هذا سيعرض لك تعليمات الاستخدام.

2. **استخدم أداة مثل Postman أو curl** لإرسال طلب POST:
   
   **باستخدام curl:**
   ```bash
   curl -X POST https://sqq-virid.vercel.app/api/setup/init-admin \
     -H "Content-Type: application/json" \
     -d '{}'
   ```
   
   **أو مع بيانات مخصصة:**
   ```bash
   curl -X POST https://sqq-virid.vercel.app/api/setup/init-admin \
     -H "Content-Type: application/json" \
     -d '{
       "username": "superadmin",
       "email": "admin@telegram.com",
       "password": "admin123456"
     }'
   ```

3. **في المتصفح (طريقة بديلة):**
   - افتح Developer Console (F12)
   - اذهب إلى Console tab
   - الصق هذا الكود:
   ```javascript
   fetch('/api/setup/init-admin', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({})
   })
   .then(r => r.json())
   .then(data => console.log(data));
   ```

4. **⚠️ مهم جداً**: بعد إنشاء المشرف بنجاح، **احذف الملف التالي فوراً**:
   ```
   app/api/setup/init-admin/route.ts
   ```
   هذا ضروري لأسباب أمنية!

---

### في حالة استمرار مشكلة Network Error:
- امسح cookies المتصفح
- امسح cache المتصفح
- جرب في وضع التصفح الخاص (Incognito)

### للتحقق من logs:
- اذهب إلى Vercel Dashboard
- اختر المشروع
- اذهب إلى "Deployments"
- اضغط على آخر deployment
- اذهب إلى "Runtime Logs" لرؤية الأخطاء

## 🎯 التحسينات المطبقة

- ✅ معالجة أخطاء المصادقة بشكل صحيح
- ✅ دعم جميع روابط Vercel تلقائياً
- ✅ منع الـ infinite reload loops
- ✅ تحسين تجربة المستخدم عند الأخطاء
- ✅ إضافة رسائل خطأ واضحة وبالعربية
- ✅ تحسين أداء البناء (Build)

## 📞 في حالة وجود مشاكل

إذا واجهت أي مشاكل بعد النشر:

1. تحقق من Environment Variables في Vercel
2. تحقق من Runtime Logs
3. تأكد من أن قاعدة البيانات متصلة وتعمل
4. تأكد من تشغيل init script لإنشاء المشرفين

---

**آخر تحديث**: 2024-10-31
**النسخة**: 1.0.2

---

## 🔍 استكشاف الأخطاء الشائعة

### "اسم المستخدم أو كلمة المرور غير صحيحة"
**الأسباب المحتملة:**
1. ✅ **لم يتم إنشاء حساب المشرف بعد** ← استخدم إحدى الطرق الثلاث أعلاه
2. كلمة المرور المدخلة خاطئة
3. اسم المستخدم المدخل خاطئ (تأكد من استخدام `superadmin` وليس email)

### كيف تتحقق من وجود المشرف؟
**اذهب إلى MongoDB:**
1. افتح MongoDB Atlas
2. اذهب إلى Database → Browse Collections
3. ابحث عن collection اسمها `admins`
4. تحقق من وجود document مع `username: "superadmin"`

**أو استخدم API endpoint:**
```bash
curl https://sqq-virid.vercel.app/api/setup/init-admin
```
سيعرض لك عدد المشرفين الموجودين.
