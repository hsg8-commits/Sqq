import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { comparePassword, createSession, verify2FAToken, isAccountLocked, incrementLoginAttempts, resetLoginAttempts } from '@/lib/auth';
import { logAdminAction, validateInput, withErrorHandling, getClientIP } from '@/lib/middleware';

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

  // Find admin by username or email
  const admin = await Admin.findOne({
    $or: [
      { username: username.toLowerCase() },
      { email: username.toLowerCase() }
    ]
  });

  // قم بتعديل السطر 32 ليصبح:
  if (!admin) {
    await logAdminAction(null, 'ADMIN_LOGIN', username, null, {}, false, 'Admin not found', req); // تم تغيير 'Admin' إلى null
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }


  // Check if account is locked
  if (isAccountLocked(admin)) {
    await logAdminAction(admin._id, 'ADMIN_LOGIN', admin.username, 'Admin', {}, false, 'Account locked', req);
    throw new Error('تم قفل الحساب مؤقتاً بسبب محاولات تسجيل دخول متعددة خاطئة');
  }

  // Check if account is active
  if (!admin.isActive) {
    await logAdminAction(admin._id, 'ADMIN_LOGIN', admin.username, 'Admin', {}, false, 'Account deactivated', req);
    throw new Error('الحساب غير نشط');
  }

  // Verify password
  const isValidPassword = await comparePassword(password, admin.password);
  if (!isValidPassword) {
    await incrementLoginAttempts(admin);
    await logAdminAction(admin._id, 'ADMIN_LOGIN', admin.username, 'Admin', {}, false, 'Invalid password', req);
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  // Check 2FA if enabled
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

  // Reset login attempts on successful login
  await resetLoginAttempts(admin);

  // Update last login
  admin.lastLogin = new Date();
  await admin.save();

  // Create session
  const token = createSession(admin);
  
  // Set cookie
  const cookieStore = cookies();
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
  
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  // Log successful login
  await logAdminAction(admin._id, 'ADMIN_LOGIN', admin.username, 'Admin', {
    ipAddress: getClientIP(req),
    userAgent: req.headers.get('user-agent'),
    rememberMe
  }, true, null, req);

  // Return admin data (without sensitive info)
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
