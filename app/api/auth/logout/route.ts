import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticate, logAdminAction, withErrorHandling } from '@/lib/middleware';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withErrorHandling(async (req: NextRequest) => {
  // Get current admin if authenticated
  let admin = null;
  try {
    admin = await authenticate(req);
  } catch (error) {
    // Allow logout even if token is invalid
  }

  // Clear cookie
  const cookieStore = cookies();
  cookieStore.delete('token');

  // Log logout action
  if (admin) {
    await logAdminAction(admin._id, 'ADMIN_LOGOUT', admin.username, 'Admin', {}, true, null, req);
  }

  return NextResponse.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
});