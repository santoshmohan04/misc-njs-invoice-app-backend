/**
 * Environment Configuration
 * Centralized configuration management for different environments
 */

const dotenv = require('dotenv');
const { validateEnv } = require('./env.validation');

// Load environment variables
dotenv.config();

const env = validateEnv();

const parseDurationMs = (duration) => {
  const unit = duration.slice(-1);
  const value = Number(duration.slice(0, -1));

  if (Number.isNaN(value)) {
    return 0;
  }

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return value;
  }
};

/**
 * Application Configuration
 */
const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3333,
    env: env.NODE_ENV,
    host: env.HOST
  },

  // Database Configuration
  database: {
    url: env.MONGODB_URL,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT Configuration
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiration: env.JWT_ACCESS_EXPIRATION,
    refreshExpiration: env.JWT_REFRESH_EXPIRATION,
    accessExpirationMs: parseDurationMs(env.JWT_ACCESS_EXPIRATION),
    refreshExpirationMs: parseDurationMs(env.JWT_REFRESH_EXPIRATION),
  },

  // Email Configuration
  email: {
    service: env.EMAIL_SERVICE,
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
    from: env.EMAIL_FROM
  },

  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.API_RATE_LIMIT_WINDOW_MS,
    max: env.API_RATE_LIMIT_MAX_REQUESTS,
    loginMax: env.LOGIN_RATE_LIMIT_MAX_REQUESTS,
    loginWindowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
    userMax: env.USER_RATE_LIMIT_MAX_REQUESTS,
  },

  // File Upload
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    enableConsole: process.env.NODE_ENV !== 'test',
    enableFile: process.env.NODE_ENV === 'production'
  },

  auth: {
    strategy: env.AUTH_STRATEGY,
    inactivityTimeoutMs: env.AUTH_INACTIVITY_TIMEOUT_MS,
    cookies: {
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      domain: env.COOKIE_DOMAIN || undefined,
    },
  },

  // Security / CORS
  security: {
    // Comma-separated list of allowed CORS origins (e.g. https://myapp.com,https://staging.myapp.com)
    corsOrigins: env.CORS_ORIGINS || '',
    // Primary frontend URL shorthand (merged into corsOrigins)
    frontendUrl: env.FRONTEND_URL || 'http://localhost:3000',
    // Trust the first hop from a reverse proxy (nginx, load balancer, etc.)
    trustProxy: env.TRUST_PROXY || env.NODE_ENV === 'production',
  }
};

module.exports = config;
