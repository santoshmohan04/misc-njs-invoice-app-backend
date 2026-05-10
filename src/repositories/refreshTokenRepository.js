const { RefreshToken } = require('../../models/refreshToken');
const BaseRepository = require('./baseRepository');

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  async createToken(payload) {
    return this.create(payload);
  }

  async findActiveToken(token) {
    return this.findOne({ token, revoked: false, expiresAt: { $gt: new Date() } });
  }

  async revokeToken(token, metadata = {}) {
    return this.model.findOneAndUpdate(
      { token, revoked: false },
      {
        $set: {
          revoked: true,
          revokedAt: new Date(),
          revokeReason: metadata.reason || 'manual',
        },
      },
      { new: true }
    );
  }

  async revokeByUser(userId, metadata = {}) {
    return this.model.updateMany(
      { userId, revoked: false },
      {
        $set: {
          revoked: true,
          revokedAt: new Date(),
          revokeReason: metadata.reason || 'logout-all',
        },
      }
    );
  }

  async removeExpiredRevoked() {
    return this.model.deleteMany({
      $or: [
        { expiresAt: { $lte: new Date() } },
        { revoked: true, updatedAt: { $lte: new Date(Date.now() - (1000 * 60 * 60 * 24 * 7)) } },
      ],
    });
  }
}

module.exports = new RefreshTokenRepository();
