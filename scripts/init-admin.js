#!/usr/bin/env node

/**
 * Admin Panel Initialization Script 
 * لوحة التحكم الإدارية - سكريبت التهيئة الأولية
 * 
 * This script sets up the admin panel with:
 * - Default super admin account
 * - System settings
 * - Database indexes for performance
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
import Admin from '../lib/models/Admin.js';
import SystemSettings, { defaultSettings } from '../lib/models/SystemSettings.js';
import { getRolePermissions } from '../lib/auth.js';

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@telegram.com';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingAdmin = await Admin.findOne({ role: 'superadmin' });
    
    if (existingAdmin) {
      console.log('ℹ️  Super admin already exists:', existingAdmin.username);
      return existingAdmin;
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(ADMIN_DEFAULT_PASSWORD, 12);
    
    // Create super admin
    const superAdmin = await Admin.create({
      username: 'superadmin',
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'superadmin',
      permissions: getRolePermissions('superadmin'),
      isActive: true,
    });

    console.log('✅ Super admin created successfully');
    console.log('👤 Username: superadmin');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_DEFAULT_PASSWORD);
    console.log('⚠️  Please change the default password after first login!');
    
    return superAdmin;
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  }
}

async function createModerator() {
  try {
    // Check if moderator already exists
    const existingModerator = await Admin.findOne({ username: 'moderator' });
    
    if (existingModerator) {
      console.log('ℹ️  Moderator already exists:', existingModerator.username);
      return existingModerator;
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash('moderator123456', 12);
    
    // Create moderator
    const moderator = await Admin.create({
      username: 'moderator',
      email: 'moderator@telegram.com',
      password: hashedPassword,
      role: 'moderator',
      permissions: getRolePermissions('moderator'),
      isActive: true,
    });

    console.log('✅ Moderator created successfully');
    console.log('👤 Username: moderator');
    console.log('📧 Email: moderator@telegram.com');
    console.log('🔑 Password: moderator123456');
    
    return moderator;
  } catch (error) {
    console.error('❌ Error creating moderator:', error);
    throw error;
  }
}

async function setupSystemSettings() {
  try {
    console.log('🔧 Setting up system settings...');
    
    for (const setting of defaultSettings) {
      const existing = await SystemSettings.findOne({ key: setting.key });
      
      if (!existing) {
        await SystemSettings.create(setting);
        console.log(`✅ Created setting: ${setting.key}`);
      } else {
        console.log(`ℹ️  Setting already exists: ${setting.key}`);
      }
    }
    
    console.log('✅ System settings configured successfully');
  } catch (error) {
    console.error('❌ Error setting up system settings:', error);
    throw error;
  }
}

async function createIndexes() {
  try {
    console.log('📊 Creating database indexes for performance...');
    
    // Admin indexes
    await Admin.collection.createIndex({ username: 1 });
    await Admin.collection.createIndex({ email: 1 });
    await Admin.collection.createIndex({ isActive: 1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    // Don't throw - indexes are not critical for basic functionality
  }
}

async function displaySummary() {
  try {
    const adminCount = await Admin.countDocuments();
    const superAdminCount = await Admin.countDocuments({ role: 'superadmin' });
    const settingsCount = await SystemSettings.countDocuments();
    
    console.log('\n📋 Initialization Summary:');
    console.log('═══════════════════════════');
    console.log(`👥 Total Admins: ${adminCount}`);
    console.log(`👑 Super Admins: ${superAdminCount}`);
    console.log(`⚙️  System Settings: ${settingsCount}`);
    console.log('═══════════════════════════');
    console.log('\n🚀 Admin Panel is ready to use!');
    console.log('🌐 Start the application with: npm run dev');
    console.log('📱 Access at: http://localhost:3002');
    console.log('\n⚠️  Security Reminder:');
    console.log('1. Change default passwords immediately');
    console.log('2. Enable 2FA for all admin accounts');
    console.log('3. Review and adjust permissions as needed');
    
  } catch (error) {
    console.error('❌ Error generating summary:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Initializing Admin Panel...\n');
    
    // Connect to database
    await connectDB();
    
    // Create admin accounts
    await createSuperAdmin();
    await createModerator();
    
    // Setup system settings
    await setupSystemSettings();
    
    // Create database indexes
    await createIndexes();
    
    // Display summary
    await displaySummary();
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Initialization interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Initialization terminated');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the initialization
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
