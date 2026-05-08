/**
 * Security Configuration
 * Centralized configuration for all production security middleware:
 * helmet, CORS, rate limiting, compression, and HTTP logging.
 */

'use strict';

const rateLimit = require('express-rate-limit');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the list of allowed CORS origins from environment variables.
 * CORS_ORIGINS accepts a comma-separated list of origins.
 * FRONTEND_URL is a convenient single-origin shorthand that is merged in.
 * Falls back to localhost for development.
 */
const buildAllowedOrigins = () => {
  const origins = new Set();

  // Primary frontend URL (e.g. https://myapp.com)
  if (process.env.FRONTEND_URL) {
    origins.add(process.env.FRONTEND_URL.trim());
  }

  // Additional comma-separated origins (e.g. staging, preview URLs)
  if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(',')
      .map(o => o.trim())
      .filter(Boolean)
      .forEach(o => origins.add(o));
  }

  // Development fallbacks when nothing is configured
  if (origins.size === 0) {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:4200');
  }

  return Array.from(origins);
};

// ---------------------------------------------------------------------------
// Helmet – secure HTTP response headers
// ---------------------------------------------------------------------------

/**
 * Helmet options harden the app against common web vulnerabilities by
 * setting appropriate HTTP security headers on every response.
 */
const helmetOptions = {
  // Content-Security-Policy: restrict which resources the browser may load
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // Prevent clickjacking – only allow framing from the same origin
  frameguard: { action: 'sameorigin' },
  // Disable MIME-type sniffing
  noSniff: true,
  // Force HTTPS for 1 year (HSTS) – applied only when behind a proxy/TLS
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  // Block pages from loading when XSS is detected (legacy browsers)
  xssFilter: true,
  // Prevent browsers from leaking the referrer to cross-origin destinations
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Remove the X-Powered-By header (also disabled via app.disable below)
  hidePoweredBy: true,
};

// ---------------------------------------------------------------------------
// CORS – Cross-Origin Resource Sharing
// ---------------------------------------------------------------------------

const allowedOrigins = buildAllowedOrigins();

/**
 * CORS options:
 *  - origin: dynamic per-request check against the allow-list
 *  - credentials: allow cookies / Authorization headers from the frontend
 *  - methods: verbs accepted by the API
 *  - allowedHeaders: headers the client may send
 *  - exposedHeaders: headers the client is allowed to read
 *  - maxAge: how long the browser should cache a pre-flight response (seconds)
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 600, // 10 minutes pre-flight cache
};

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

/**
 * General API rate limiter – applied to all /api/* routes.
 * Limits each IP to 100 requests per 15-minute window.
 */
const apiRateLimitOptions = {
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    retryAfter: 900,
  },
  standardHeaders: true,  // Emit RateLimit-* headers (RFC 6585)
  legacyHeaders: false,   // Suppress deprecated X-RateLimit-* headers
};

/**
 * Strict limiter for authentication endpoints to mitigate brute-force attacks.
 * Limits each IP to 5 login attempts per 15-minute window.
 */
const authWindowMs =
  parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const authMaxRequests =
  parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS, 10) || 5;

const authRateLimitOptions = {
  windowMs: authWindowMs,
  max: authMaxRequests,
  message: {
    success: false,
    message: `Too many login attempts. Please try again after ${
      authWindowMs / 60000
    } minutes.`,
    retryAfter: Math.ceil(authWindowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Pre-built limiter instances (re-exported for use in route files)
const apiRateLimiter = rateLimit(apiRateLimitOptions);
const authRateLimiter = rateLimit(authRateLimitOptions);

// ---------------------------------------------------------------------------
// Compression
// ---------------------------------------------------------------------------

/**
 * Compression options:
 *  - level: zlib compression level (6 is a good balance of speed vs size)
 *  - threshold: only compress responses larger than 1 KB
 *  - filter: honour the Accept-Encoding header; skip pre-compressed assets
 */
const compressionOptions = {
  level: 6,
  threshold: 1024, // bytes
  filter: (req, res) => {
    // Respect the `Cache-Control: no-transform` directive
    if (req.headers['x-no-compression']) {
      return false;
    }
    return require('compression').filter(req, res);
  },
};

// ---------------------------------------------------------------------------
// Morgan HTTP request logging
// ---------------------------------------------------------------------------

/**
 * Morgan format string.
 * In production, use 'combined' (Apache-style, includes IP & user-agent).
 * In development, use 'dev' (concise, coloured).
 */
const morganFormat =
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  helmetOptions,
  corsOptions,
  allowedOrigins,
  compressionOptions,
  morganFormat,
  apiRateLimiter,
  authRateLimiter,
  apiRateLimitOptions,
  authRateLimitOptions,
};
