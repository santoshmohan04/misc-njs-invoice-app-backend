const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/config');

/**
 * JWT Configuration from environment variables
 */
const JWT_CONFIG = {
  SECRET: config.jwt.secret,
  REFRESH_SECRET: config.jwt.refreshSecret,
  ACCESS_EXPIRATION: config.jwt.accessExpiration,
  REFRESH_EXPIRATION: config.jwt.refreshExpiration
};

/**
 * Password hashing configuration
 */
const BCRYPT_CONFIG = {
  SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
};

/**
 * Generate access token for user authentication
 * @param {Object} payload - User payload containing _id
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_CONFIG.SECRET,
    { expiresIn: JWT_CONFIG.ACCESS_EXPIRATION }
  );
};

/**
 * Generate refresh token for token renewal
 * @param {Object} payload - User payload containing _id
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_CONFIG.REFRESH_SECRET,
    { expiresIn: JWT_CONFIG.REFRESH_EXPIRATION }
  );
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.SECRET);
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.REFRESH_SECRET);
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(BCRYPT_CONFIG.SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Password match result
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Extract token from request headers
 * Supports both 'x-auth' header and 'Authorization: Bearer <token>' header
 * @param {Object} req - Express request object
 * @returns {string|null} Extracted token or null
 */
const extractToken = (req) => {
  const strategy = config.auth.strategy || 'hybrid';
  let token = null;

  if (strategy === 'cookie' || strategy === 'hybrid') {
    token = req.cookies?.accessToken || null;
  }

  // Check x-auth header first (legacy support)
  if (!token && (strategy === 'header' || strategy === 'hybrid')) {
    token = req.header('x-auth');
  }

  // Check Authorization Bearer header
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  return token;
};

const extractRefreshToken = (req) => {
  const strategy = config.auth.strategy || 'hybrid';
  let token = null;

  if (strategy === 'cookie' || strategy === 'hybrid') {
    token = req.cookies?.refreshToken || null;
  }

  if (!token && (strategy === 'header' || strategy === 'hybrid')) {
    token = req.body?.refreshToken || req.header('x-refresh-token');
  }

  return token;
};

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Standardized error response
 */
const createErrorResponse = (message, statusCode = 400) => {
  return {
    success: false,
    message,
    statusCode
  };
};

/**
 * Create standardized success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Standardized success response
 */
const createSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

module.exports = {
  JWT_CONFIG,
  BCRYPT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  extractToken,
  extractRefreshToken,
  createErrorResponse,
  createSuccessResponse
};