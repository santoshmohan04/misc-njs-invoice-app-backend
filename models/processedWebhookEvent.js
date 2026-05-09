const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProcessedWebhookEventSchema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { versionKey: false }
);

ProcessedWebhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const ProcessedWebhookEvent = mongoose.model('ProcessedWebhookEvent', ProcessedWebhookEventSchema, 'processed_webhook_events');

module.exports = { ProcessedWebhookEvent };
