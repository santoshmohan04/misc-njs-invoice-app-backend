/**
 * Environment Configuration
 * Centralized configuration management for different environments
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

/**
 * Application Configuration
 */
const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3333,
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost'
  },

  // Database Configuration
  database: {
    url: process.env.MONGODB_URL,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d'
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'invoiceappserver@gmail.com'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    loginMax: 5, // limit login attempts
    loginWindowMs: 15 * 60 * 1000 // 15 minutes
  },

  // File Upload
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.NODE_ENV !== 'test',
    enableFile: process.env.NODE_ENV === 'production'
  },

  // Security / CORS
  security: {
    // Comma-separated list of allowed CORS origins (e.g. https://myapp.com,https://staging.myapp.com)
    corsOrigins: process.env.CORS_ORIGINS || '',
    // Primary frontend URL shorthand (merged into corsOrigins)
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    // Trust the first hop from a reverse proxy (nginx, load balancer, etc.)
    trustProxy: process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production',
  }
};

/**
 * Validate required environment variables
 */
const validateConfig = () => {
  const requiredVars = [
    'MONGODB_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'EMAIL_USER',
    'EMAIL_PASS'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate configuration on module load
validateConfig();

module.exports = config;
