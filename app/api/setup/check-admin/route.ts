import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/lib/models/Admin';
import bcryptjs from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Diagnostic endpoint to check admin status and reset password
 * DELETE THIS FILE AFTER USE!
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Find all admins
    const admins = await Admin.find({}).select('username email role isActive loginAttempts lockUntil createdAt');
    
    return NextResponse.json({
      success: true,
      count: admins.length,
      admins: admins.map(admin => ({
        username: admin.username,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        loginAttempts: admin.loginAttempts,
        lockUntil: admin.lockUntil,
        createdAt: admin.createdAt,
      })),
      instructions: {
        ar: 'لإعادة تعيين كلمة مرور المشرف، أرسل طلب POST مع username',
        en: 'To reset admin password, send POST request with username',
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { username, newPassword } = body;
    
    if (!username) {
      return NextResponse.json({
        success: false,
        message: 'اسم المستخدم مطلوب'
      }, { status: 400 });
    }
    
    // Find admin (case-insensitive search)
    const admin = await Admin.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'المشرف غير موجود'
      }, { status: 404 });
    }
    
    // Reset password
    const password = newPassword || 'admin123456';
    const hashedPassword = await bcryptjs.hash(password, 12);
    
    admin.password = hashedPassword;
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    admin.isActive = true;
    
    await admin.save();
    
    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح',
      admin: {
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      credentials: {
        username: admin.username,
        password: password,
      },
      warning: '⚠️ احذف ملف /app/api/setup/check-admin/route.ts فوراً!'
    });
    
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json({
      success: false,
      message: 'فشل إعادة تعيين كلمة المرور',
      error: error.message
    }, { status: 500 });
  }
}
