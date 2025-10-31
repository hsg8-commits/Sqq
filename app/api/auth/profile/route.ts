import { NextRequest, NextResponse } from 'next/server';
import { authenticate, withErrorHandling } from '@/lib/middleware';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const admin = await authenticate(req);

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
    createdAt: admin.createdAt,
    isActive: admin.isActive,
  };

  return NextResponse.json({
    success: true,
    admin: adminData
  });
});