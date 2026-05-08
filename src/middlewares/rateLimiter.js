/**
 * Rate Limiting Middleware
 * Re-exports the centralized rate-limiter instances defined in
 * src/config/security.js so that routes can import them from this
 * conventional middlewares location without duplicating configuration.
 */

const {
  apiRateLimiter,
  authRateLimiter,
  authRateLimitOptions,
} = require('../config/security');

// Keep RATE_LIMIT_CONFIG for any existing code that reads it
const RATE_LIMIT_CONFIG = {
  WINDOW_MS: authRateLimitOptions.windowMs,
  MAX_REQUESTS: authRateLimitOptions.max,
};

/**
 * Login rate limiter – strict limit to mitigate brute-force attacks.
 * Configured via LOGIN_RATE_LIMIT_WINDOW_MS / LOGIN_RATE_LIMIT_MAX_REQUESTS.
 */
const loginRateLimiter = authRateLimiter;

module.exports = {
  loginRateLimiter,
  apiRateLimiter,
  RATE_LIMIT_CONFIG,
};
