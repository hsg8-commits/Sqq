/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'localhost',
      'res.cloudinary.com',
      'via.placeholder.com'
    ],
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
    SOCKET_SERVER_URL: process.env.SOCKET_SERVER_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig