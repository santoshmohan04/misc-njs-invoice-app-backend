const userRepository = require('../repositories/userRepository');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  createErrorResponse,
  createSuccessResponse
} = require('../utils/authUtils');
const config = require('../config/config');
const Logger = require('../utils/logger');

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
  static async register(userData) {
    try {
      Logger.info('User registration attempt', { email: userData.email });

      // Password hashing is handled by the user model pre-save middleware
      const user = await userRepository.create(userData);

      // Generate tokens
      const accessToken = generateAccessToken({ _id: user._id });
      const refreshToken = generateRefreshToken({ _id: user._id });

      // Save tokens
      await userRepository.addToken(user._id, 'auth', accessToken);
      await userRepository.addToken(user._id, 'auth', accessToken);
      await userRepository.addToken(user._id, 'refresh', refreshToken);

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
  static async login(email, password) {
    try {
      Logger.info('User login attempt', { email });

      const user = await userRepository.findByCredentials(email, password);

      // Generate new tokens
      const accessToken = generateAccessToken({ _id: user._id });
      const refreshToken = generateRefreshToken({ _id: user._id });

      // Remove old refresh tokens and add new one
      await userRepository.removeAllTokens(user._id);
      await userRepository.addToken(user._id, 'refresh', refreshToken);

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
  static async refreshToken(refreshToken) {
    try {
      Logger.info('Token refresh attempt');

      const user = await userRepository.findByRefreshToken(refreshToken);

      // Generate new access token
      const newAccessToken = generateAccessToken({ _id: user._id });

      Logger.info('Token refreshed successfully', { userId: user._id });

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
  static async logout(userId, token) {
    try {
      Logger.info('User logout attempt', { userId });

      const user = await userRepository.removeToken(userId, token);

      if (!user) {
        return createErrorResponse('User not found', 404);
      }

      Logger.info('User logged out successfully', { userId });

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
  static async logoutAll(userId) {
    try {
      Logger.info('User logout all attempt', { userId });

      const user = await userRepository.removeAllTokens(userId);

      if (!user) {
        return createErrorResponse('User not found', 404);
      }

      Logger.info('User logged out from all devices', { userId });

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