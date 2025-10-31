import { verifyToken, hasPermission, isAccountLocked } from './auth.js';
import Admin from './models/Admin.js';
import AdminLog from './models/AdminLog.js';
import connectDB from './db.js';

// Authentication middleware
export const authenticate = async (req) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = verifyToken(token);
    
    await connectDB();
    const admin = await Admin.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      throw new Error('Admin not found');
    }

    if (!admin.isActive) {
      throw new Error('Account is deactivated');
    }

    if (isAccountLocked(admin)) {
      throw new Error('Account is temporarily locked due to multiple failed login attempts');
    }

    req.admin = admin;
    return admin;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

// Authorization middleware
export const authorize = (resource, action) => {
  return async (req) => {
    const admin = req.admin;
    
    if (!admin) {
      throw new Error('Authentication required');
    }

    // Super admin has all permissions
    if (admin.role === 'superadmin') {
      return true;
    }

    // Check specific permissions
    if (!hasPermission(admin.permissions, resource, action)) {
      throw new Error(`Insufficient permissions for ${resource}:${action}`);
    }

    return true;
  };
};

// Logging middleware
export const logAdminAction = async (adminId, action, target = null, targetType = null, details = {}, success = true, errorMessage = null, req = null) => {
  try {
    await connectDB();
    
    const logData = {
      adminId,
      action,
      target,
      targetType,
      details,
      success,
      errorMessage,
    };

    if (req) {
      logData.ipAddress = getClientIP(req);
      logData.userAgent = req.headers['user-agent'];
    }

    await AdminLog.create(logData);
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

// Get client IP address
export const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
};

// Rate limiting middleware
export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req) => {
    const ip = getClientIP(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(ip)) {
      const userRequests = requests.get(ip).filter(time => time > windowStart);
      requests.set(ip, userRequests);
    } else {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);
    
    if (userRequests.length >= maxRequests) {
      throw new Error('Too many requests. Please try again later.');
    }

    userRequests.push(now);
    requests.set(ip, userRequests);

    return true;
  };
};

// Input validation middleware
export const validateInput = (schema) => {
  return (data) => {
    const errors = {};

    Object.keys(schema).forEach(field => {
      const rules = schema[field];
      const value = data[field];

      if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors[field] = `${field} is required`;
        return;
      }

      if (value && rules.type && typeof value !== rules.type) {
        errors[field] = `${field} must be of type ${rules.type}`;
        return;
      }

      if (value && rules.minLength && value.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
        return;
      }

      if (value && rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `${field} must be no more than ${rules.maxLength} characters`;
        return;
      }

      if (value && rules.pattern && !rules.pattern.test(value)) {
        errors[field] = `${field} format is invalid`;
        return;
      }

      if (rules.enum && value && !rules.enum.includes(value)) {
        errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
        return;
      }
    });

    if (Object.keys(errors).length > 0) {
      const error = new Error('Validation failed');
      error.validationErrors = errors;
      throw error;
    }

    return true;
  };
};

// Error handling wrapper
export const withErrorHandling = (handler) => {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);

      if (error.validationErrors) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.validationErrors,
        });
      }

      const statusCode = error.message.includes('Authentication') ? 401 :
                        error.message.includes('permission') ? 403 :
                        error.message.includes('Not found') ? 404 :
                        error.message.includes('Too many requests') ? 429 :
                        500;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  };
};