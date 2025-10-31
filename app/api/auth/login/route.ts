import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import Admin from '@/lib/models/Admin';
import {
  comparePassword,
  createSession,
  verify2FAToken,
  isAccountLocked,
  incrementLoginAttempts,
  resetLoginAttempts
} from '@/lib/auth';
import {
  logAdminAction,
  validateInput,
  withErrorHandling,
  getClientIP
} from '@/lib/middleware';

const loginSchema = {
  username: { required: true, type: 'string', minLength: 3 },
  password: { required: true, type: 'string', minLength: 6 },
  twoFactorToken: { required: false, type: 'string' },
  rememberMe: { required: false, type: 'boolean' },
};

export const POST = withErrorHandling(async (req: NextRequest) => {
  await connectDB();

  const body = await req.json();
  validateInput(loginSchema)(body);

  const { username, password, twoFactorToken, rememberMe } = body;

  // البحث عن الأدمن عبر اسم المستخدم أو البريد الإلكتروني
  const admin = await Admin.findOne({
    $or: [
      { username: username.toLowerCase() },
      { email: username.toLowerCase() }
    ]
  });

  if (!admin) {
    await logAdminAction(null, 'ADMIN_LOGIN', username, null, {}, false, 'Admin not found', req);
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  // التحقق من حالة القفل
  if (isAccountLocked(admin)) {
    await logAdminAction(admin._id, 'ADMIN_LOGIN', admin.username, 'Admin', {}, false, 'Account locked', req);
    throw new Error('تم قفل الحساب مؤقتاً بسبب محاولات تسجيل دخول متعددة خاطئة');
  }

  // التحقق من أن الحساب نشط
  if (!admin.isActive) {
    await logAdminAction(admin._id, 'ADMIN_LOGIN', admin.username, 'Admin', {}, false, 'Account deactivated', req);
    throw new Error('الحساب غير نشط');
  }

  // التحقق من كلمة المرور
  const isValidPassword = await comparePassword(password, admin.password);
  if (!isValidPassword) {
    await incrementLoginAttempts(admin);
    await logAdminAction(admin._id, 'ADMIN_LOGIN', admin.username, 'Admin', {}, false, 'Invalid password', req);
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  // التحقق من المصادقة الثنائية
  if (admin.twoFactorEnabled) {
    if (!twoFactorToken) {
      return NextResponse.json({
        success: false,
        requireTwoFactor: true,
        message: 'رمز المصادقة الثنائية مطلوب'
      });
    }

    const isValid2FA = verify2FAToken(twoFactorToken, admin.twoFactorSecret);
    if (!isValid2FA) {
      await incrementLoginAttempts(admin);
      await logAdminAction(admin._id, 'ADMIN_LOGIN', admin.username, 'Admin', {}, false, 'Invalid 2FA token', req);
      throw new Error('رمز المصادقة الثنائية غير صحيح');
    }
  }

  // إعادة تعيين عدد المحاولات بعد تسجيل الدخول الناجح
  await resetLoginAttempts(admin);

  // تحديث آخر تسجيل دخول
  admin.lastLogin = new Date();
  await admin.save();

  // إنشاء جلسة وتخزين التوكن في الكوكيز
  const token = createSession(admin);
  const cookieStore = cookies();
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  // تسجيل الدخول الناجح
  await logAdminAction(
    admin._id,
    'ADMIN_LOGIN',
    admin.username,
    'Admin',
    {
      ipAddress: getClientIP(req),
      userAgent: req.headers.get('user-agent'),
      rememberMe
    },
    true,
    null,
    req
  );

  const adminData = {
    _id: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions,
    avatar: admin.avatar,
    lastLogin: admin.lastLogin,
    twoFactorEnabled: admin.twoFactorEnabled,
  };

  return NextResponse.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    admin: adminData
  });
});
