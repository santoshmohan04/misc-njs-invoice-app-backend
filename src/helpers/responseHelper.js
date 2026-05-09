/**
 * Response Helper Functions
 * Centralized response formatting utilities
 */

const { HTTP_STATUS, MESSAGES } = require('../constants');
const { successEnvelope, errorEnvelope } = require('../contracts/response.contract');

/**
 * Create a success response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted success response
 */
const createSuccessResponse = (data = null, message = MESSAGES.SUCCESS, statusCode = HTTP_STATUS.OK) => {
  return successEnvelope({ data, message, statusCode });
};

/**
 * Create an error response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} errors - Additional error details
 * @returns {Object} Formatted error response
 */
const createErrorResponse = (message = MESSAGES.INTERNAL_ERROR, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  return errorEnvelope({ message, statusCode, errors });
};

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, data = null, message = MESSAGES.SUCCESS, statusCode = HTTP_STATUS.OK) => {
  const response = successEnvelope({
    data,
    message,
    statusCode,
    meta: { correlationId: res.getHeader('x-correlation-id') || null },
  });
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} errors - Additional error details
 */
const sendError = (res, message = MESSAGES.INTERNAL_ERROR, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = errorEnvelope({
    message,
    statusCode,
    errors,
    meta: { correlationId: res.getHeader('x-correlation-id') || null },
  });
  return res.status(statusCode).json(response);
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Array|string} errors - Validation errors
 */
const sendValidationError = (res, errors) => {
  const message = MESSAGES.VALIDATION_FAILED;
  const statusCode = HTTP_STATUS.BAD_REQUEST;
  return sendError(res, message, statusCode, errors);
};

/**
 * Send an unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
const sendUnauthorized = (res, message = MESSAGES.UNAUTHORIZED) => {
  return sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Send a not found response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
const sendNotFound = (res, message = MESSAGES.NOT_FOUND) => {
  return sendError(res, message, HTTP_STATUS.NOT_FOUND);
};

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendNotFound
};