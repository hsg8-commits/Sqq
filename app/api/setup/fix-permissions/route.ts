import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/lib/models/Admin';
import { getRolePermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Fix admin permissions endpoint
 * ⚠️ DELETE THIS FILE AFTER USE!
 */

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json().catch(() => ({}));
    const { username } = body;
    
    const targetUsername = username || 'superadmin';
    
    // Find admin (case-insensitive)
    const admin = await Admin.findOne({ 
      username: { $regex: new RegExp(`^${targetUsername}$`, 'i') } 
    });
    
    if (!admin) {
      return NextResponse.json({
        success: false,
        message: 'المشرف غير موجود'
      }, { status: 404 });
    }
    
    // Update permissions based on role
    const permissions = getRolePermissions(admin.role);
    admin.permissions = permissions;
    
    await admin.save();
    
    return NextResponse.json({
      success: true,
      message: 'تم تحديث الصلاحيات بنجاح',
      admin: {
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions,
      },
      warning: '⚠️ احذف ملف /app/api/setup/fix-permissions/route.ts بعد الاستخدام!'
    });
    
  } catch (error: any) {
    console.error('Error fixing permissions:', error);
    return NextResponse.json({
      success: false,
      message: 'فشل تحديث الصلاحيات',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const admins = await Admin.find({}).select('username role permissions');
    
    return NextResponse.json({
      success: true,
      admins: admins.map(a => ({
        username: a.username,
        role: a.role,
        permissions: a.permissions,
      })),
      instructions: {
        ar: 'لتحديث الصلاحيات، أرسل طلب POST',
        en: 'To fix permissions, send POST request',
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
