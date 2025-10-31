#!/bin/bash

# Telegram Clone Admin Panel - Startup Script
# سكريبت بدء تشغيل لوحة تحكم المشرف

set -e

echo "🚀 Starting Telegram Clone Admin Panel..."
echo "═══════════════════════════════════════════"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+ first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js version 16+ is required. Current version: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check if MongoDB is running
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB CLI not found. Please ensure MongoDB is installed and running.${NC}"
else
    echo -e "${GREEN}✅ MongoDB CLI available${NC}"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 Please edit .env file with your configuration before continuing.${NC}"
    read -p "Press Enter after updating .env file..."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Check if database is initialized
echo -e "${BLUE}🔧 Checking database initialization...${NC}"
node -e "
import mongoose from 'mongoose';
import Admin from './lib/models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const adminCount = await Admin.countDocuments();
    console.log(\`Found \${adminCount} admin(s) in database\`);
    
    if (adminCount === 0) {
      console.log('No admins found. Please run initialization script.');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Database check failed:', error.message);
    process.exit(1);
  }
}

checkDB();
" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Database not initialized. Running initialization...${NC}"
    node scripts/init-admin.js
}

echo -e "${GREEN}✅ Database check completed${NC}"

# Start the application
echo -e "${BLUE}🌐 Starting admin panel server...${NC}"
echo -e "${GREEN}📱 Admin panel will be available at: http://localhost:3002${NC}"
echo -e "${YELLOW}🔑 Default login: superadmin / admin123456${NC}"
echo -e "${YELLOW}⚠️  Remember to change default passwords!${NC}"
echo ""

# Start in development mode
npm run dev