import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Message from '@/lib/models/Message';
import Room from '@/lib/models/Room';
import Media from '@/lib/models/Media';
import Report from '@/lib/models/Report';
import { authenticate, authorize, logAdminAction, withErrorHandling } from '@/lib/middleware';

export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  await connectDB();
  const admin = await authenticate(req);
  await authorize('users', 'view')(req);

  const userId = params.id;

  // Get user details
  const user = await User.findById(userId)
    .select('-password -roomMessageTrack')
    .lean();

  if (!user) {
    throw new Error('المستخدم غير موجود');
  }

  // Get user statistics
  const [
    messageCount,
    roomCount,
    mediaCount,
    reportCount,
    recentMessages,
    userRooms
  ] = await Promise.all([
    Message.countDocuments({ sender: userId, isDeleted: false }),
    Room.countDocuments({ participants: userId }),
    Media.countDocuments({ sender: userId, isDeleted: false }),
    Report.countDocuments({ reporterId: userId }),
    
    // Get recent messages (last 10)
    Message.find({ sender: userId, isDeleted: false })
      .populate('roomID', 'name type')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    
    // Get user rooms
    Room.find({ participants: userId })
      .populate('participants', 'name username avatar')
      .select('name type avatar participants createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
  ]);

  // Get activity timeline (messages by day for last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activity = await Message.aggregate([
    {
      $match: {
        sender: user._id,
        isDeleted: false,
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get reports about this user
  const reportsAboutUser = await Report.find({
    targetType: 'user',
    targetId: userId
  })
    .populate('reporterId', 'name username')
    .populate('adminAction.adminId', 'username')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Get storage usage
  const storageStats = await Media.aggregate([
    { $match: { sender: user._id, isDeleted: false } },
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$size' },
        totalFiles: { $sum: 1 }
      }
    }
  ]);

  const storageUsed = storageStats[0]?.totalSize || 0;

  const userData = {
    ...user,
    fullName: `${user.name} ${user.lastName}`.trim(),
    stats: {
      messageCount,
      roomCount,
      mediaCount,
      reportCount,
      storageUsed: Math.round(storageUsed / (1024 * 1024)), // Convert to MB
    },
    recentMessages: recentMessages.map(msg => ({
      _id: msg._id,
      message: msg.message ? msg.message.substring(0, 100) : '',
      hasFile: !!msg.fileData,
      hasVoice: !!msg.voiceData,
      roomName: msg.roomID?.name,
      roomType: msg.roomID?.type,
      createdAt: msg.createdAt,
      isEdited: msg.isEdited,
    })),
    rooms: userRooms.map(room => ({
      _id: room._id,
      name: room.name,
      type: room.type,
      avatar: room.avatar,
      participantCount: room.participants?.length || 0,
      createdAt: room.createdAt,
    })),
    activity,
    reports: reportsAboutUser.map(report => ({
      _id: report._id,
      reason: report.reason,
      status: report.status,
      reporterName: report.reporterId?.name,
      adminAction: report.adminAction?.action,
      createdAt: report.createdAt,
    })),
  };

  await logAdminAction(admin._id, 'USER_VIEW', userId, 'User', { 
    userDetails: true 
  }, true, null, req);

  return NextResponse.json({
    success: true,
    data: userData
  });
});

export const DELETE = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  await connectDB();
  const admin = await authenticate(req);
  
  if (!admin.permissions.users.delete && admin.role !== 'superadmin') {
    throw new Error('ليس لديك صلاحية حذف المستخدمين');
  }

  const userId = params.id;
  const body = await req.json();
  const { reason, deleteMessages = false, deleteMedia = false } = body;

  if (!reason || reason.length < 10) {
    throw new Error('يجب تقديم سبب الحذف (10 أحرف على الأقل)');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('المستخدم غير موجود');
  }

  // Start transaction
  const session = await connectDB().startSession();
  session.startTransaction();

  try {
    // Mark user as deleted/blocked
    await User.findByIdAndUpdate(userId, {
      isBlocked: true,
      blockReason: `حذف الحساب: ${reason}`,
      blockedAt: new Date(),
      blockedBy: admin._id,
      status: 'offline'
    }, { session });

    // Optionally delete messages
    if (deleteMessages) {
      await Message.updateMany(
        { sender: userId },
        {
          isDeleted: true,
          deletedBy: admin._id,
          deletedAt: new Date()
        },
        { session }
      );
    }

    // Optionally delete media
    if (deleteMedia) {
      await Media.updateMany(
        { sender: userId },
        {
          isDeleted: true,
          deletedBy: admin._id,
          deletedAt: new Date()
        },
        { session }
      );
    }

    // Remove from all rooms
    await Room.updateMany(
      { participants: userId },
      { $pull: { participants: userId, admins: userId } },
      { session }
    );

    await session.commitTransaction();

    await logAdminAction(admin._id, 'USER_DELETE', userId, 'User', {
      reason,
      deleteMessages,
      deleteMedia,
      username: user.username
    }, true, null, req);

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});