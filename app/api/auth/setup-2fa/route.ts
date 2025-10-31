import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAdminAction, withErrorHandling, validateInput } from '@/lib/middleware';
import { generate2FASecret, verify2FAToken } from '@/lib/auth';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const admin = await authenticate(req);
  const body = await req.json();
  const { action, token } = body;

  if (action === 'generate') {
    // Generate new 2FA secret
    const secret = generate2FASecret(admin.email);
    
    // Store temporary secret (not activated yet)
    admin.twoFactorSecret = secret.base32;
    await admin.save();

    await logAdminAction(admin._id, '2FA_GENERATE', admin.username, 'Admin', {}, true, null, req);

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      message: 'تم إنشاء رمز المصادقة الثنائية'
    });
  }

  if (action === 'verify') {
    validateInput({
      token: { required: true, type: 'string', minLength: 6, maxLength: 6 }
    })({ token });

    if (!admin.twoFactorSecret) {
      throw new Error('لم يتم إنشاء رمز المصادقة الثنائية');
    }

    const isValid = verify2FAToken(token, admin.twoFactorSecret);
    
    if (!isValid) {
      await logAdminAction(admin._id, '2FA_VERIFY', admin.username, 'Admin', {}, false, 'Invalid token', req);
      throw new Error('الرمز غير صحيح');
    }

    // Activate 2FA
    admin.twoFactorEnabled = true;
    await admin.save();

    await logAdminAction(admin._id, '2FA_ENABLE', admin.username, 'Admin', {}, true, null, req);

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل المصادقة الثنائية بنجاح'
    });
  }

  if (action === 'disable') {
    validateInput({
      token: { required: true, type: 'string', minLength: 6, maxLength: 6 }
    })({ token });

    if (!admin.twoFactorEnabled) {
      throw new Error('المصادقة الثنائية غير مفعلة');
    }

    const isValid = verify2FAToken(token, admin.twoFactorSecret);
    
    if (!isValid) {
      await logAdminAction(admin._id, '2FA_DISABLE', admin.username, 'Admin', {}, false, 'Invalid token', req);
      throw new Error('الرمز غير صحيح');
    }

    // Disable 2FA
    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = null;
    await admin.save();

    await logAdminAction(admin._id, '2FA_DISABLE', admin.username, 'Admin', {}, true, null, req);

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء تفعيل المصادقة الثنائية'
    });
  }

  throw new Error('إجراء غير صالح');
});