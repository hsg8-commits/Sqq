import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Message from '@/lib/models/Message';
import Room from '@/lib/models/Room';
import Media from '@/lib/models/Media';
import Report from '@/lib/models/Report';
import { authenticate, authorize, withErrorHandling } from '@/lib/middleware';

export const GET = withErrorHandling(async (req: NextRequest) => {
  await connectDB();
  const admin = await authenticate(req);
  await authorize('system', 'view')(req);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Users statistics
  const totalUsers = await User.countDocuments({ isBlocked: false });
  const onlineUsers = await User.countDocuments({ status: 'online', isBlocked: false });
  const blockedUsers = await User.countDocuments({ isBlocked: true });
  const newUsersToday = await User.countDocuments({ 
    createdAt: { $gte: today },
    isBlocked: false 
  });
  const newUsersYesterday = await User.countDocuments({ 
    createdAt: { $gte: yesterday, $lt: today },
    isBlocked: false 
  });

  // Messages statistics
  const totalMessages = await Message.countDocuments({ isDeleted: false });
  const messagesToday = await Message.countDocuments({ 
    createdAt: { $gte: today },
    isDeleted: false 
  });
  const messagesYesterday = await Message.countDocuments({ 
    createdAt: { $gte: yesterday, $lt: today },
    isDeleted: false 
  });

  // Rooms statistics
  const totalRooms = await Room.countDocuments({ isBlocked: false });
  const privateRooms = await Room.countDocuments({ type: 'private', isBlocked: false });
  const groupRooms = await Room.countDocuments({ type: 'group', isBlocked: false });
  const channelRooms = await Room.countDocuments({ type: 'channel', isBlocked: false });

  // Media statistics
  const totalMediaFiles = await Media.countDocuments({ isDeleted: false });
  const mediaFilesToday = await Media.countDocuments({ 
    createdAt: { $gte: today },
    isDeleted: false 
  });
  
  // Calculate total storage used (in bytes)
  const storageStats = await Media.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: null, totalSize: { $sum: '$size' } } }
  ]);
  const totalStorage = storageStats[0]?.totalSize || 0;

  // Reports statistics
  const totalReports = await Report.countDocuments();
  const pendingReports = await Report.countDocuments({ status: 'pending' });
  const resolvedReports = await Report.countDocuments({ status: 'resolved' });
  const reportsToday = await Report.countDocuments({ 
    createdAt: { $gte: today } 
  });

  // Activity trends (last 7 days)
  const dailyStats = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    
    const [dayUsers, dayMessages, dayReports] = await Promise.all([
      User.countDocuments({ 
        createdAt: { $gte: date, $lt: nextDate },
        isBlocked: false 
      }),
      Message.countDocuments({ 
        createdAt: { $gte: date, $lt: nextDate },
        isDeleted: false 
      }),
      Report.countDocuments({ 
        createdAt: { $gte: date, $lt: nextDate } 
      })
    ]);

    dailyStats.push({
      date: date.toISOString().split('T')[0],
      users: dayUsers,
      messages: dayMessages,
      reports: dayReports,
    });
  }

  // Most active users (by message count)
  const mostActiveUsers = await Message.aggregate([
    { $match: { isDeleted: false, createdAt: { $gte: weekAgo } } },
    { $group: { _id: '$sender', messageCount: { $sum: 1 } } },
    { $sort: { messageCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        messageCount: 1,
        username: '$user.username',
        name: '$user.name',
        avatar: '$user.avatar'
      }
    }
  ]);

  // Calculate percentage changes
  const userGrowth = newUsersYesterday > 0 
    ? ((newUsersToday - newUsersYesterday) / newUsersYesterday * 100).toFixed(1)
    : newUsersToday > 0 ? 100 : 0;

  const messageGrowth = messagesYesterday > 0
    ? ((messagesToday - messagesYesterday) / messagesYesterday * 100).toFixed(1)
    : messagesToday > 0 ? 100 : 0;

  const reportGrowth = await Report.countDocuments({ 
    createdAt: { $gte: yesterday, $lt: today } 
  }).then(yesterdayReports => {
    return yesterdayReports > 0
      ? ((reportsToday - yesterdayReports) / yesterdayReports * 100).toFixed(1)
      : reportsToday > 0 ? 100 : 0;
  });

  return NextResponse.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        onlineUsers,
        blockedUsers,
        totalMessages,
        totalRooms,
        totalStorage: Math.round(totalStorage / (1024 * 1024)), // Convert to MB
        pendingReports,
      },
      growth: {
        users: { count: newUsersToday, percentage: userGrowth },
        messages: { count: messagesToday, percentage: messageGrowth },
        reports: { count: reportsToday, percentage: reportGrowth },
        media: { count: mediaFilesToday, percentage: 0 },
      },
      breakdown: {
        rooms: {
          private: privateRooms,
          group: groupRooms,
          channel: channelRooms,
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          resolved: resolvedReports,
        }
      },
      trends: {
        daily: dailyStats,
        mostActiveUsers,
      }
    }
  });
});
