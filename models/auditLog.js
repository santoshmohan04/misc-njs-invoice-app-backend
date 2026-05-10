const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    actorId: {
      type: Schema.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema, 'audit_logs');

module.exports = { AuditLog };
