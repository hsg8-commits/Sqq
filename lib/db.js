import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Only check for MONGODB_URI at runtime, not during build
if (!MONGODB_URI && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ MONGODB_URI is not defined. Database operations will fail at runtime.');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Return early if no MONGODB_URI (happens during build)
  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not defined, skipping database connection');
    throw new Error('Database connection not configured');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;