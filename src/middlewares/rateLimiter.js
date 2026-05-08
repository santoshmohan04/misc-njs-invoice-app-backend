const rateLimit = require('express-rate-limit');

/**
 * Rate limiting configuration from environment variables
 */
const RATE_LIMIT_CONFIG = {
  WINDOW_MS: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS) || 5, // 5 requests per window
};

/**
 * Login rate limiter middleware
 * Limits login attempts to prevent brute force attacks
 */
const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: {
    success: false,
    message: `Too many login attempts. Please try again after ${RATE_LIMIT_CONFIG.WINDOW_MS / 60000} minutes.`,
    retryAfter: Math.ceil(RATE_LIMIT_CONFIG.WINDOW_MS / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use default IP-based rate limiting (handles IPv4/IPv6 properly)
  // keyGenerator is not needed - express-rate-limit handles this automatically
});

/**
 * General API rate limiter
 * Limits general API requests to prevent abuse
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginRateLimiter,
  apiRateLimiter,
  RATE_LIMIT_CONFIG
};