/**
 * Centralized Error Handling Middleware
 * Handles all errors in a consistent format
 */

const Logger = require('../utils/logger');
const { sendError } = require('../helpers/responseHelper');
const config = require('../config/config');

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  Logger.logError(err, req);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return sendError(res, 'Validation failed', 400, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return sendError(res, 'Duplicate entry found', 409);
  }

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    return sendError(res, 'Payment processing error', 400, err.message);
  }

  // Custom application errors
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // Default error response
  const message = config.server.env === 'production'
    ? 'Internal server error'
    : err.message || 'Internal server error';

  sendError(res, message, 500);
};

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const notFoundHandler = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  Logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  sendError(res, message, 404);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function that handles errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};