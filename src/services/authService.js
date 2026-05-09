const userRepository = require('../repositories/userRepository');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const {
  generateAccessToken,
  generateRefreshToken,
  createErrorResponse,
  createSuccessResponse
} = require('../utils/authUtils');
const config = require('../config/config');
const Logger = require('../utils/logger');
const SessionService = require('./sessionService');
const AuditService = require('./auditService');

/**
 * Authentication Service
 * Handles all authentication-related business logic
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result with tokens
   */
  static async register(userData, req = null) {
    try {
      Logger.info('User registration attempt', { email: userData.email });

      // Password hashing is handled by the user model pre-save middleware
      const user = await userRepository.create(userData);

      // Generate tokens
      const accessToken = generateAccessToken({ _id: user._id });
      const refreshToken = generateRefreshToken({ _id: user._id });
      const refreshExpiry = new Date(Date.now() + config.jwt.refreshExpirationMs);
      const sessionMeta = req
        ? {
            deviceInfo: SessionService.getDeviceInfo(req),
            ipAddress: SessionService.getIpAddress(req),
            fingerprint: SessionService.createFingerprint(req),
          }
        : {};

      // Keep access token persistence for backward-compatible auth middleware.
      await userRepository.addToken(user._id, 'auth', accessToken);

      // Persist refresh token in dedicated collection.
      await refreshTokenRepository.createToken({
        userId: user._id,
        token: refreshToken,
        expiresAt: refreshExpiry,
        revoked: false,
        ...sessionMeta,
      });

      // Keep legacy refresh token entry during incremental migration.
      await userRepository.addToken(user._id, 'refresh', refreshToken, refreshExpiry);

      await AuditService.log({
        actorId: user._id,
        action: 'auth.register',
        entityType: 'user',
        entityId: user._id.toString(),
        metadata: { email: user.email },
        ipAddress: sessionMeta.ipAddress || null,
        userAgent: req ? req.get('User-Agent') : null,
      });

      Logger.info('User registered successfully', { userId: user._id, email: user.email });

      return createSuccessResponse({
        user: user.toJSON(),
        accessToken,
        refreshToken
      }, 'User registered successfully');

    } catch (error) {
      Logger.error('User registration failed', { error: error.message, email: userData.email });

      if (error.code === 11000) { // Duplicate key error
        return createErrorResponse('Email already exists', 409);
      }
      return createErrorResponse('Registration failed', 400);
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result with tokens
   */
  static async login(email, password, req = null) {
    try {
      Logger.info('User login attempt', { email });

      const user = await userRepository.findByCredentials(email, password);

      // Generate new tokens
      const accessToken = generateAccessToken({ _id: user._id });
      const refreshToken = generateRefreshToken({ _id: user._id });
      const refreshExpiry = new Date(Date.now() + config.jwt.refreshExpirationMs);
      const sessionMeta = req
        ? {
            deviceInfo: SessionService.getDeviceInfo(req),
            ipAddress: SessionService.getIpAddress(req),
            fingerprint: SessionService.createFingerprint(req),
          }
        : {};

      // Remove old short-lived access token and issue a new one.
      await userRepository.addToken(user._id, 'auth', accessToken);

      await refreshTokenRepository.createToken({
        userId: user._id,
        token: refreshToken,
        expiresAt: refreshExpiry,
        revoked: false,
        ...sessionMeta,
      });

      // Keep legacy fallback until old token references are fully retired.
      await userRepository.addToken(user._id, 'refresh', refreshToken, refreshExpiry);

      await AuditService.log({
        actorId: user._id,
        action: 'auth.login',
        entityType: 'user',
        entityId: user._id.toString(),
        metadata: { email },
        ipAddress: sessionMeta.ipAddress || null,
        userAgent: req ? req.get('User-Agent') : null,
      });

      Logger.info('User logged in successfully', { userId: user._id, email });

      return createSuccessResponse({
        user: user.toJSON(),
        accessToken,
        refreshToken
      }, 'Login successful');

    } catch (error) {
      Logger.error('User login failed', { error: error.message, email });
      return createErrorResponse(error.message, 401);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token result
   */
  static async refreshToken(refreshToken, req = null) {
    try {
      Logger.info('Token refresh attempt');

      const user = await userRepository.findByRefreshToken(refreshToken);

      const tokenDoc = await refreshTokenRepository.findActiveToken(refreshToken);
      if (!tokenDoc) {
        return createErrorResponse('Invalid refresh token', 401);
      }

      const incomingFingerprint = req ? SessionService.createFingerprint(req) : null;
      if (incomingFingerprint && tokenDoc.fingerprint && incomingFingerprint !== tokenDoc.fingerprint) {
        Logger.warn('Suspicious refresh token usage detected', {
          userId: user._id,
          tokenId: tokenDoc._id,
          ipAddress: req.ip,
        });
        await refreshTokenRepository.revokeToken(refreshToken, { reason: 'fingerprint-mismatch' });
        return createErrorResponse('Invalid refresh token', 401);
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({ _id: user._id });

      // Persist the new access token so auth middleware can validate it
      await userRepository.addToken(user._id, 'auth', newAccessToken);

      await refreshTokenRepository.updateById(tokenDoc._id, { lastUsedAt: new Date() });

      Logger.info('Token refreshed successfully', { userId: user._id });

      await AuditService.log({
        actorId: user._id,
        action: 'auth.refresh',
        entityType: 'refresh_token',
        entityId: tokenDoc._id.toString(),
        metadata: {},
        ipAddress: req ? req.ip : null,
        userAgent: req ? req.get('User-Agent') : null,
      });

      return createSuccessResponse({
        accessToken: newAccessToken
      }, 'Token refreshed successfully');

    } catch (error) {
      Logger.error('Token refresh failed', { error: error.message });
      return createErrorResponse('Invalid refresh token', 401);
    }
  }

  /**
   * Logout user by removing specific token
   * @param {string} userId - User ID
   * @param {string} token - Token to remove
   * @returns {Promise<Object>} Logout result
   */
  static async logout(userId, token, refreshToken = null, req = null) {
    try {
      Logger.info('User logout attempt', { userId });

      const user = await userRepository.removeToken(userId, token);

      if (refreshToken) {
        await refreshTokenRepository.revokeToken(refreshToken, { reason: 'logout-current-session' });
      }

      if (!user) {
        return createErrorResponse('User not found', 404);
      }

      Logger.info('User logged out successfully', { userId });

      await AuditService.log({
        actorId: userId,
        action: 'auth.logout',
        entityType: 'user',
        entityId: userId.toString(),
        metadata: {},
        ipAddress: req ? req.ip : null,
        userAgent: req ? req.get('User-Agent') : null,
      });

      return createSuccessResponse(null, 'Logged out successfully');

    } catch (error) {
      Logger.error('User logout failed', { error: error.message, userId });
      return createErrorResponse('Logout failed', 500);
    }
  }

  /**
   * Logout user from all devices by clearing all tokens
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Logout all result
   */
  static async logoutAll(userId, req = null) {
    try {
      Logger.info('User logout all attempt', { userId });

      const user = await userRepository.removeAllTokens(userId);

      if (!user) {
        return createErrorResponse('User not found', 404);
      }

      Logger.info('User logged out from all devices', { userId });

      await AuditService.log({
        actorId: userId,
        action: 'auth.logout_all',
        entityType: 'user',
        entityId: userId.toString(),
        metadata: {},
        ipAddress: req ? req.ip : null,
        userAgent: req ? req.get('User-Agent') : null,
      });

      return createSuccessResponse(null, 'Logged out from all devices successfully');

    } catch (error) {
      Logger.error('User logout all failed', { error: error.message, userId });
      return createErrorResponse('Logout failed', 500);
    }
  }

  /**
   * Verify user by token and return user data
   * @param {string} token - Access token
   * @returns {Promise<Object>} User verification result
   */
  static async verifyUser(token) {
    try {
      Logger.debug('Token verification attempt');

      const user = await userRepository.findByToken(token);

      Logger.debug('Token verified successfully', { userId: user._id });

      return createSuccessResponse({
        user: user.toJSON(),
        token
      });

    } catch (error) {
      Logger.error('Token verification failed', { error: error.message });
      return createErrorResponse('Invalid token', 401);
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  static async updateProfile(userId, updateData) {
    try {
      Logger.info('Profile update attempt', { userId });

      const user = await userRepository.updateProfile(userId, updateData);

      if (!user) {
        return createErrorResponse('User not found', 404);
      }

      Logger.info('Profile updated successfully', { userId });

      await AuditService.log({
        actorId: userId,
        action: 'profile.update',
        entityType: 'user',
        entityId: userId.toString(),
        metadata: { fields: Object.keys(updateData || {}) },
      });

      return createSuccessResponse({
        user: user.toJSON()
      }, 'Profile updated successfully');

    } catch (error) {
      Logger.error('Profile update failed', { error: error.message, userId });
      return createErrorResponse('Profile update failed', 400);
    }
  }
}

module.exports = AuthService;