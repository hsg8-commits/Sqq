import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/lib/models/Admin';
import bcryptjs from 'bcryptjs';
import { getRolePermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Temporary API endpoint to create initial super admin
 * ⚠️ DELETE THIS FILE AFTER FIRST USE!
 * 
 * Usage: POST to /api/setup/init-admin
 * 
 * This endpoint creates the default super admin account
 * if it doesn't already exist.
 */

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check if any admin already exists
    const existingAdminCount = await Admin.countDocuments();
    
    if (existingAdminCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'يوجد مشرف بالفعل في النظام. لا يمكن إنشاء المشرف الأساسي.',
        note: 'If you need to reset, please delete all admins from database first.'
      }, { status: 400 });
    }

    // Get credentials from request body or use defaults
    const body = await req.json().catch(() => ({}));
    const username = body.username || 'superadmin';
    const email = body.email || 'admin@telegram.com';
    const password = body.password || 'admin123456';

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create super admin
    const superAdmin = await Admin.create({
      username,
      email,
      password: hashedPassword,
      role: 'superadmin',
      permissions: getRolePermissions('superadmin'),
      isActive: true,
      twoFactorEnabled: false,
      loginAttempts: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المشرف الأساسي بنجاح',
      admin: {
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role,
      },
      credentials: {
        username,
        password, // Show password only this once
      },
      warning: '⚠️ احذف ملف /app/api/setup/init-admin/route.ts فوراً لأسباب أمنية!',
      note: 'قم بتغيير كلمة المرور بعد تسجيل الدخول الأول'
    });

  } catch (error: any) {
    console.error('Error creating super admin:', error);
    return NextResponse.json({
      success: false,
      message: 'فشل إنشاء المشرف الأساسي',
      error: error.message
    }, { status: 500 });
  }
}

// Also allow GET request for easier testing
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const adminCount = await Admin.countDocuments();
    const superAdminCount = await Admin.countDocuments({ role: 'superadmin' });
    
    return NextResponse.json({
      success: true,
      message: 'نقطة إعداد المشرف الأولي',
      stats: {
        totalAdmins: adminCount,
        superAdmins: superAdminCount,
      },
      instructions: {
        ar: 'لإنشاء المشرف الأساسي، أرسل طلب POST إلى هذا الرابط',
        en: 'To create the initial super admin, send a POST request to this endpoint',
        method: 'POST',
        endpoint: '/api/setup/init-admin',
        body: {
          username: 'superadmin (optional)',
          email: 'admin@telegram.com (optional)',
          password: 'admin123456 (optional)',
        },
      },
      warning: '⚠️ احذف هذا الملف بعد الاستخدام!'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
