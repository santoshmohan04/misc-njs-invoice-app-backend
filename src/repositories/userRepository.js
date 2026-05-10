/**
 * User Repository
 * Handles all database operations related to users
 */

const { User } = require('../../models/user');
const BaseRepository = require('./baseRepository');
const refreshTokenRepository = require('./refreshTokenRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User document
   */
  async findByEmail(email) {
    return await this.findOne({ email });
  }

  /**
   * Find user by credentials (email and password validation)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User document
   */
  async findByCredentials(email, password) {
    return await this.model.findUserByCredentials(email, password);
  }

  /**
   * Find user by access token
   * @param {string} token - Access token
   * @returns {Promise<Object>} User document
   */
  async findByToken(token) {
    const jwt = require('jsonwebtoken');
    const config = require('../config/config');

    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      const user = await this.findOne({
        "_id": decoded._id,
        "tokens.token": token,
        "tokens.access": "auth",
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;

    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Find user by refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} User document
   */
  async findByRefreshToken(refreshToken) {
    const jwt = require('jsonwebtoken');
    const config = require('../config/config');

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const tokenDoc = await refreshTokenRepository.findActiveToken(refreshToken);
      if (!tokenDoc || tokenDoc.userId.toString() !== decoded._id.toString()) {
        throw new Error('Refresh token not found');
      }

      const user = await this.findOne({ _id: decoded._id });

      if (!user) {
        throw new Error('User not found');
      }

      return user;

    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updateData) {
    return await this.updateById(userId, { $set: updateData }, { new: true, runValidators: true });
  }

  /**
   * Remove specific token from user
   * @param {string} userId - User ID
   * @param {string} token - Token to remove
   * @returns {Promise<Object>} Updated user
   */
  async removeToken(userId, token) {
    const user = await this.findById(userId);
    if (user) {
      user.tokens = user.tokens.filter(t => t.token !== token);
      await refreshTokenRepository.revokeToken(token, { reason: 'logout' });
      return await user.save();
    }
    return null;
  }

  /**
   * Remove all tokens from user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async removeAllTokens(userId) {
    const user = await this.findById(userId);
    if (user) {
      user.tokens = [];
      await refreshTokenRepository.revokeByUser(userId, { reason: 'logout-all' });
      return await user.save();
    }
    return null;
  }

  /**
   * Add token to user
   * @param {string} userId - User ID
   * @param {string} access - Token access type
   * @param {string} token - Token value
   * @param {Date} expiresAt - Token expiration date (optional)
   * @returns {Promise<Object>} Updated user
   */
  async addToken(userId, access, token, expiresAt = null) {
    const user = await this.findById(userId);
    if (user) {
      // Remove existing tokens of the same access type
      user.tokens = user.tokens.filter(t => t.access !== access);

      const tokenData = {
        access,
        token,
        createdAt: new Date()
      };

      if (expiresAt) {
        tokenData.expiresAt = expiresAt;
      }

      user.tokens.push(tokenData);
      return await user.save();
    }
    return null;
  }
}

module.exports = new UserRepository();