#!/usr/bin/env node

/**
 * Demo Data Seeding Script
 * بيانات تجريبية للمشروع - ملء قاعدة البيانات
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import User from '../lib/models/User.js';
import Room from '../lib/models/Room.js';
import Message from '../lib/models/Message.js';
import Media from '../lib/models/Media.js';
import Report from '../lib/models/Report.js';
import SystemSettings from '../lib/models/SystemSettings.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Demo users data
const demoUsers = [
  {
    name: 'أحمد',
    lastName: 'محمد',
    username: 'ahmed_m',
    phone: '+966501234567',
    biography: 'مطور برمجيات ومهتم بالتقنية',
    status: 'online',
    password: 'user123456'
  },
  {
    name: 'فاطمة',
    lastName: 'علي',
    username: 'fatima_a',
    phone: '+966502345678',
    biography: 'مصممة جرافيك',
    status: 'online',
    password: 'user123456'
  },
  {
    name: 'خالد',
    lastName: 'سعيد',
    username: 'khaled_s',
    phone: '+966503456789',
    biography: 'رائد أعمال',
    status: 'offline',
    password: 'user123456'
  },
  {
    name: 'نورة',
    lastName: 'عبدالله',
    username: 'noura_a',
    phone: '+966504567890',
    biography: 'كاتبة ومدونة',
    status: 'online',
    password: 'user123456'
  },
  {
    name: 'عمر',
    lastName: 'حسن',
    username: 'omar_h',
    phone: '+966505678901',
    biography: 'مهندس معماري',
    status: 'offline',
    password: 'user123456'
  },
  {
    name: 'سارة',
    lastName: 'أحمد',
    username: 'sara_a',
    phone: '+966506789012',
    biography: 'طبيبة',
    status: 'online',
    password: 'user123456'
  },
  {
    name: 'محمد',
    lastName: 'خالد',
    username: 'mohammed_k',
    phone: '+966507890123',
    biography: 'معلم',
    status: 'online',
    password: 'user123456'
  },
  {
    name: 'مريم',
    lastName: 'يوسف',
    username: 'mariam_y',
    phone: '+966508901234',
    biography: 'محامية',
    status: 'offline',
    password: 'user123456'
  },
  {
    name: 'يوسف',
    lastName: 'إبراهيم',
    username: 'youssef_i',
    phone: '+966509012345',
    biography: 'محلل بيانات',
    status: 'online',
    password: 'user123456'
  },
  {
    name: 'ليلى',
    lastName: 'محمود',
    username: 'layla_m',
    phone: '+966500123456',
    biography: 'صيدلانية',
    status: 'offline',
    password: 'user123456'
  }
];

async function createUsers() {
  try {
    console.log('👥 Creating demo users...');
    
    const hashedPassword = await bcryptjs.hash('user123456', 12);
    
    const users = [];
    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      
      if (existingUser) {
        console.log(`ℹ️  User already exists: ${userData.username}`);
        users.push(existingUser);
        continue;
      }

      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });
      
      users.push(user);
      console.log(`✅ Created user: ${user.username}`);
    }
    
    console.log(`✅ Total users: ${users.length}`);
    return users;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
}

async function createRooms(users) {
  try {
    console.log('\n💬 Creating demo rooms...');
    
    const rooms = [];
    
    // Create private rooms
    for (let i = 0; i < users.length - 1; i += 2) {
      const room = await Room.create({
        type: 'private',
        participants: [users[i]._id, users[i + 1]._id],
        name: `${users[i].name} & ${users[i + 1].name}`,
        lastMessage: null,
      });
      rooms.push(room);
      console.log(`✅ Created private room: ${room.name}`);
    }
    
    // Create group rooms
    const group1 = await Room.create({
      type: 'group',
      name: 'مجموعة التقنية',
      description: 'نقاش حول آخر التطورات التقنية',
      participants: users.slice(0, 5).map(u => u._id),
      creator: users[0]._id,
      admins: [users[0]._id],
      avatar: 'https://ui-avatars.com/api/?name=Tech+Group&background=4F46E5&color=fff',
    });
    rooms.push(group1);
    console.log(`✅ Created group: ${group1.name}`);
    
    const group2 = await Room.create({
      type: 'group',
      name: 'مجموعة الأصدقاء',
      description: 'دردشة عامة للأصدقاء',
      participants: users.slice(3, 8).map(u => u._id),
      creator: users[3]._id,
      admins: [users[3]._id],
      avatar: 'https://ui-avatars.com/api/?name=Friends&background=10B981&color=fff',
    });
    rooms.push(group2);
    console.log(`✅ Created group: ${group2.name}`);
    
    // Create channel
    const channel = await Room.create({
      type: 'channel',
      name: 'قناة الأخبار',
      description: 'آخر الأخبار والتحديثات',
      participants: users.map(u => u._id),
      creator: users[0]._id,
      admins: [users[0]._id],
      avatar: 'https://ui-avatars.com/api/?name=News&background=F59E0B&color=fff',
    });
    rooms.push(channel);
    console.log(`✅ Created channel: ${channel.name}`);
    
    console.log(`✅ Total rooms: ${rooms.length}`);
    return rooms;
  } catch (error) {
    console.error('❌ Error creating rooms:', error);
    throw error;
  }
}

async function createMessages(users, rooms) {
  try {
    console.log('\n📨 Creating demo messages...');
    
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
      'شكراً لك على المساعدة',
      'العفو، في خدمتك دائماً',
      'كيف كان يومك اليوم؟',
      'يوم رائع والحمد لله',
      'ماذا تفعل الآن؟',
      'أعمل على مشروع جديد',
      'يبدو مثيراً للاهتمام!',
      'نعم، سأخبرك بالتفاصيل لاحقاً',
      'في انتظارك!',
      'حسناً، وداعاً!'
    ];
    
    let messageCount = 0;
    
    for (const room of rooms) {
      const participants = room.participants;
      const messageCount_room = Math.floor(Math.random() * 10) + 5; // 5-15 messages per room
      
      for (let i = 0; i < messageCount_room; i++) {
        const sender = participants[Math.floor(Math.random() * participants.length)];
        const text = messageTexts[Math.floor(Math.random() * messageTexts.length)];
        
        const message = await Message.create({
          sender,
          receiver: room.type === 'private' ? participants.find(p => p.toString() !== sender.toString()) : null,
          room: room._id,
          content: text,
          type: 'text',
          isRead: Math.random() > 0.5,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        });
        
        // Update room's last message
        room.lastMessage = message._id;
        messageCount++;
      }
      
      await room.save();
    }
    
    console.log(`✅ Created ${messageCount} messages`);
  } catch (error) {
    console.error('❌ Error creating messages:', error);
    throw error;
  }
}

async function createReports(users) {
  try {
    console.log('\n🚨 Creating demo reports...');
    
    const reportReasons = [
      { type: 'spam', reason: 'رسائل مزعجة متكررة' },
      { type: 'harassment', reason: 'تحرش وإزعاج' },
      { type: 'inappropriate', reason: 'محتوى غير لائق' },
      { type: 'fake', reason: 'حساب مزيف' },
      { type: 'other', reason: 'مخالفة الشروط والأحكام' }
    ];
    
    let reportCount = 0;
    
    for (let i = 0; i < 5; i++) {
      const reporter = users[Math.floor(Math.random() * users.length)];
      const reported = users[Math.floor(Math.random() * users.length)];
      
      if (reporter._id.toString() === reported._id.toString()) continue;
      
      const reportData = reportReasons[i % reportReasons.length];
      
      await Report.create({
        reporter: reporter._id,
        reportedUser: reported._id,
        type: reportData.type,
        reason: reportData.reason,
        status: i % 2 === 0 ? 'pending' : 'resolved',
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
      
      reportCount++;
    }
    
    console.log(`✅ Created ${reportCount} reports`);
  } catch (error) {
    console.error('❌ Error creating reports:', error);
    throw error;
  }
}

async function displaySummary() {
  try {
    const [userCount, roomCount, messageCount, reportCount] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      Message.countDocuments(),
      Report.countDocuments(),
    ]);
    
    console.log('\n📋 Database Summary:');
    console.log('═══════════════════════════');
    console.log(`👥 Users: ${userCount}`);
    console.log(`💬 Rooms: ${roomCount}`);
    console.log(`📨 Messages: ${messageCount}`);
    console.log(`🚨 Reports: ${reportCount}`);
    console.log('═══════════════════════════');
    console.log('\n🎉 Demo data created successfully!');
    console.log('🌐 You can now access the admin panel and see data');
    console.log('📱 Demo user credentials:');
    console.log('   Username: ahmed_m (or any other username)');
    console.log('   Password: user123456');
    
  } catch (error) {
    console.error('❌ Error generating summary:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting demo data seeding...\n');
    
    await connectDB();
    
    // Create demo data
    const users = await createUsers();
    const rooms = await createRooms(users);
    await createMessages(users, rooms);
    await createReports(users);
    
    // Display summary
    await displaySummary();
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Seeding interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Seeding terminated');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the seeding
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
