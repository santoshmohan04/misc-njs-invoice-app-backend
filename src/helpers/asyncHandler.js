/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 */

/**
 * Wraps an async function to catch errors and pass them to next middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function that handles errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;