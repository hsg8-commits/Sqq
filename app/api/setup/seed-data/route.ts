import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Room from '@/lib/models/Room';
import Message from '@/lib/models/Message';
import Report from '@/lib/models/Report';
import bcryptjs from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for seeding

/**
 * Seed demo data endpoint
 * ⚠️ DELETE THIS FILE AFTER USE!
 */

const demoUsers = [
  { name: 'أحمد', lastName: 'محمد', username: 'ahmed_m', phone: '+966501234567', biography: 'مطور برمجيات', status: 'online' },
  { name: 'فاطمة', lastName: 'علي', username: 'fatima_a', phone: '+966502345678', biography: 'مصممة جرافيك', status: 'online' },
  { name: 'خالد', lastName: 'سعيد', username: 'khaled_s', phone: '+966503456789', biography: 'رائد أعمال', status: 'offline' },
  { name: 'نورة', lastName: 'عبدالله', username: 'noura_a', phone: '+966504567890', biography: 'كاتبة ومدونة', status: 'online' },
  { name: 'عمر', lastName: 'حسن', username: 'omar_h', phone: '+966505678901', biography: 'مهندس معماري', status: 'offline' },
  { name: 'سارة', lastName: 'أحمد', username: 'sara_a', phone: '+966506789012', biography: 'طبيبة', status: 'online' },
  { name: 'محمد', lastName: 'خالد', username: 'mohammed_k', phone: '+966507890123', biography: 'معلم', status: 'online' },
  { name: 'مريم', lastName: 'يوسف', username: 'mariam_y', phone: '+966508901234', biography: 'محامية', status: 'offline' },
  { name: 'يوسف', lastName: 'إبراهيم', username: 'youssef_i', phone: '+966509012345', biography: 'محلل بيانات', status: 'online' },
  { name: 'ليلى', lastName: 'محمود', username: 'layla_m', phone: '+966500123456', biography: 'صيدلانية', status: 'offline' },
];

const messageTexts = [
  'مرحباً! كيف حالك؟',
  'أهلاً، أنا بخير والحمد لله',
  'هل شاهدت آخر الأخبار؟',
  'نعم، كانت مثيرة للاهتمام',
  'ما رأيك في الموضوع؟',
  'أعتقد أنه رائع!',
  'هل يمكننا الاجتماع غداً؟',
  'بالتأكيد، في أي وقت؟',
  'الساعة الثالثة عصراً مناسبة؟',
  'تمام، أراك غداً!',
];

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const existingUsers = await User.countDocuments();
    if (existingUsers >= 5) {
      return NextResponse.json({
        success: false,
        message: 'يوجد بيانات بالفعل في النظام',
        note: 'To reseed, delete existing data first'
      }, { status: 400 });
    }

    // Create users
    const hashedPassword = await bcryptjs.hash('user123456', 12);
    const users = await User.insertMany(
      demoUsers.map(u => ({ ...u, password: hashedPassword }))
    );

    // Create rooms
    const rooms = [];
    
    // Private rooms
    for (let i = 0; i < users.length - 1; i += 2) {
      const room = await Room.create({
        type: 'private',
        participants: [users[i]._id, users[i + 1]._id],
        name: `${users[i].name} & ${users[i + 1].name}`,
      });
      rooms.push(room);
    }
    
    // Group room
    const group = await Room.create({
      type: 'group',
      name: 'مجموعة التقنية',
      description: 'نقاش حول آخر التطورات التقنية',
      participants: users.slice(0, 5).map(u => u._id),
      creator: users[0]._id,
      admins: [users[0]._id],
    });
    rooms.push(group);
    
    // Channel
    const channel = await Room.create({
      type: 'channel',
      name: 'قناة الأخبار',
      description: 'آخر الأخبار والتحديثات',
      participants: users.map(u => u._id),
      creator: users[0]._id,
      admins: [users[0]._id],
    });
    rooms.push(channel);

    // Create messages
    let messageCount = 0;
    for (const room of rooms) {
      const participants = room.participants;
      const count = Math.floor(Math.random() * 10) + 5;
      
      for (let i = 0; i < count; i++) {
        const sender = participants[Math.floor(Math.random() * participants.length)];
        const text = messageTexts[Math.floor(Math.random() * messageTexts.length)];
        
        const message = await Message.create({
          sender,
          receiver: room.type === 'private' ? participants.find(p => p.toString() !== sender.toString()) : null,
          room: room._id,
          content: text,
          type: 'text',
          isRead: Math.random() > 0.5,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
        
        room.lastMessage = message._id;
        messageCount++;
      }
      
      await room.save();
    }

    // Create reports
    const reportCount = 3;
    for (let i = 0; i < reportCount; i++) {
      const reporter = users[i];
      const reported = users[i + 1];
      
      await Report.create({
        reporter: reporter._id,
        reportedUser: reported._id,
        type: 'spam',
        reason: 'رسائل مزعجة متكررة',
        status: i % 2 === 0 ? 'pending' : 'resolved',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء البيانات التجريبية بنجاح',
      data: {
        users: users.length,
        rooms: rooms.length,
        messages: messageCount,
        reports: reportCount,
      },
      warning: '⚠️ احذف ملف /app/api/setup/seed-data/route.ts بعد الاستخدام!',
      note: 'Demo user credentials: username: ahmed_m, password: user123456'
    });

  } catch (error: any) {
    console.error('Error seeding data:', error);
    return NextResponse.json({
      success: false,
      message: 'فشل إنشاء البيانات التجريبية',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const [userCount, roomCount, messageCount, reportCount] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      Message.countDocuments(),
      Report.countDocuments(),
    ]);
    
    return NextResponse.json({
      success: true,
      message: 'إحصائيات قاعدة البيانات',
      data: {
        users: userCount,
        rooms: roomCount,
        messages: messageCount,
        reports: reportCount,
      },
      instructions: {
        ar: 'لإنشاء بيانات تجريبية، أرسل طلب POST إلى هذا الرابط',
        en: 'To seed demo data, send POST request to this endpoint',
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
