import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Message from '@/lib/models/Message';
import Room from '@/lib/models/Room';
import { authenticate, authorize, logAdminAction, validateInput, withErrorHandling } from '@/lib/middleware';

export const GET = withErrorHandling(async (req: NextRequest) => {
  await connectDB();
  const admin = await authenticate(req);
  await authorize('users', 'view')(req);

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const skip = (page - 1) * limit;

  // Build query
  const query: any = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  if (status !== 'all') {
    if (status === 'online') query.status = 'online';
    if (status === 'offline') query.status = 'offline';
    if (status === 'blocked') query.isBlocked = true;
    if (status === 'active') query.isBlocked = false;
  }

  // Get users with pagination
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password -roomMessageTrack')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  // Get additional stats for each user
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const [messageCount, roomCount] = await Promise.all([
        Message.countDocuments({ sender: user._id, isDeleted: false }),
        Room.countDocuments({ participants: user._id })
      ]);

      return {
        ...user,
        messageCount,
        roomCount,
        fullName: `${user.name} ${user.lastName}`.trim(),
      };
    })
  );

  await logAdminAction(admin._id, 'USER_VIEW', null, 'User', { 
    page, 
    limit, 
    search, 
    status,
    total 
  }, true, null, req);

  return NextResponse.json({
    success: true,
    data: {
      users: usersWithStats,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        pageSize: limit,
        totalItems: total,
      }
    }
  });
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  await connectDB();
  const admin = await authenticate(req);
  await authorize('users', 'edit')(req);

  const body = await req.json();
  const { userId, action, reason, ...updateData } = body;

  validateInput({
    userId: { required: true, type: 'string' },
    action: { required: true, type: 'string', enum: ['update', 'block', 'unblock', 'warn'] }
  })({ userId, action });

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('المستخدم غير موجود');
  }

  let result = null;
  let actionType = '';
  let updates: Record<string, any> = {};

  switch (action) {
    case 'update':
      await authorize('users', 'edit')(req);
      
      const allowedFields = ['name', 'lastName', 'username', 'biography', 'avatar'];
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updates[key] = updateData[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error('لا توجد حقول صالحة للتحديث');
      }

      result = await User.findByIdAndUpdate(userId, updates, { new: true })
        .select('-password -roomMessageTrack');
      
      actionType = 'USER_EDIT';
      break;

    case 'block':
      if (!admin.permissions.users.delete && admin.role !== 'superadmin') {
        throw new Error('ليس لديك صلاحية حظر المستخدمين');
      }

      validateInput({
        reason: { required: true, type: 'string', minLength: 10 }
      })({ reason });

      result = await User.findByIdAndUpdate(userId, {
        isBlocked: true,
        blockReason: reason,
        blockedAt: new Date(),
        blockedBy: admin._id,
        status: 'offline'
      }, { new: true }).select('-password -roomMessageTrack');

      actionType = 'USER_BAN';
      break;

    case 'unblock':
      if (!admin.permissions.users.delete && admin.role !== 'superadmin') {
        throw new Error('ليس لديك صلاحية إلغاء حظر المستخدمين');
      }

      result = await User.findByIdAndUpdate(userId, {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
        blockedBy: null
      }, { new: true }).select('-password -roomMessageTrack');

      actionType = 'USER_UNBAN';
      break;

    case 'warn':
      validateInput({
        reason: { required: true, type: 'string', minLength: 10 }
      })({ reason });

      result = await User.findByIdAndUpdate(userId, {
        $inc: { warningsCount: 1 },
        lastWarning: new Date()
      }, { new: true }).select('-password -roomMessageTrack');

      // TODO: Send warning notification to user via socket

      actionType = 'USER_WARN';
      break;

    default:
      throw new Error('إجراء غير صالح');
  }

  await logAdminAction(admin._id, actionType, userId, 'User', {
    action,
    reason,
    updateData: action === 'update' ? updates : undefined
  }, true, null, req);

  return NextResponse.json({
    success: true,
    data: result,
    message: `تم ${action === 'update' ? 'تحديث' : action === 'block' ? 'حظر' : action === 'unblock' ? 'إلغاء حظر' : 'تحذير'} المستخدم بنجاح`
  });
});