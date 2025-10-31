import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import speakeasy from 'speakeasy';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// JWT utilities
export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Password utilities
export const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(12);
  return bcryptjs.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return bcryptjs.compare(password, hashedPassword);
};

// Two-Factor Authentication utilities
export const generate2FASecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `Admin Panel (${email})`,
    issuer: 'Telegram Clone Admin',
    length: 32,
  });
  return secret;
};

export const verify2FAToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow for time drift
  });
};

// Session utilities
export const createSession = (admin) => {
  const payload = {
    adminId: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions,
  };
  
  return generateToken(payload);
};

// Permission checker
export const hasPermission = (adminPermissions, resource, action) => {
  if (!adminPermissions || !adminPermissions[resource]) {
    return false;
  }
  return adminPermissions[resource][action] === true;
};

// Role-based permissions
export const getRolePermissions = (role) => {
  const permissions = {
    superadmin: {
      users: { view: true, edit: true, delete: true },
      messages: { view: true, delete: true },
      rooms: { view: true, edit: true, delete: true },
      reports: { view: true, manage: true },
      system: { view: true, edit: true },
      admins: { view: true, manage: true },
    },
    moderator: {
      users: { view: true, edit: true, delete: false },
      messages: { view: true, delete: true },
      rooms: { view: true, edit: false, delete: false },
      reports: { view: true, manage: true },
      system: { view: false, edit: false },
      admins: { view: false, manage: false },
    },
    viewer: {
      users: { view: true, edit: false, delete: false },
      messages: { view: true, delete: false },
      rooms: { view: true, edit: false, delete: false },
      reports: { view: true, manage: false },
      system: { view: false, edit: false },
      admins: { view: false, manage: false },
    },
  };

  return permissions[role] || permissions.viewer;
};

// Rate limiting utilities
export const isAccountLocked = (admin) => {
  return admin.lockUntil && admin.lockUntil > Date.now();
};

export const incrementLoginAttempts = async (admin) => {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  admin.loginAttempts += 1;

  if (admin.loginAttempts >= maxAttempts && !admin.lockUntil) {
    admin.lockUntil = new Date(Date.now() + lockTime);
  }

  await admin.save();
};

export const resetLoginAttempts = async (admin) => {
  admin.loginAttempts = 0;
  admin.lockUntil = undefined;
  await admin.save();
};
