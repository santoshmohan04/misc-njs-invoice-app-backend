const mongoose = require('mongoose');
const { Schema } = mongoose;

const RefreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    deviceInfo: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    fingerprint: {
      type: String,
      default: null,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

RefreshTokenSchema.index({ userId: 1, revoked: 1, createdAt: -1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema, 'refresh_tokens');

module.exports = { RefreshToken };
