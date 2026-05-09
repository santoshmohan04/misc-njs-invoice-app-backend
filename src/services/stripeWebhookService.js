const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const { ProcessedWebhookEvent } = require('../../models/processedWebhookEvent');
const paymentRepository = require('../repositories/paymentRepository');
const Logger = require('../utils/logger');

class StripeWebhookService {
  static constructEvent(payload, signature, secret) {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }

  static async processEvent(event) {
    const existing = await ProcessedWebhookEvent.findOne({ eventId: event.id });
    if (existing) {
      return { processed: false, duplicate: true };
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object, event.id);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object, event.id);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object, event.id);
        break;
      default:
        Logger.info('stripe.webhook.ignored', { eventType: event.type, eventId: event.id });
    }

    await ProcessedWebhookEvent.create({
      eventId: event.id,
      type: event.type,
      payload: {
        objectId: event.data?.object?.id,
      },
    });

    return { processed: true, duplicate: false };
  }

  static async handlePaymentIntentSucceeded(paymentIntent, eventId) {
    const paymentId = paymentIntent.metadata?.paymentId;
    if (!paymentId) {
      return;
    }

    await paymentRepository.updateById(paymentId, {
      status: 'completed',
      stripePaymentIntentId: paymentIntent.id,
      lastWebhookEventId: eventId,
      processedAt: new Date(),
    });
  }

  static async handlePaymentIntentFailed(paymentIntent, eventId) {
    const paymentId = paymentIntent.metadata?.paymentId;
    if (!paymentId) {
      return;
    }

    await paymentRepository.updateById(paymentId, {
      status: 'failed',
      stripePaymentIntentId: paymentIntent.id,
      lastWebhookEventId: eventId,
      processedAt: new Date(),
    });
  }

  static async handleChargeRefunded(charge, eventId) {
    const paymentIntentId = charge.payment_intent;
    if (!paymentIntentId) {
      return;
    }

    await paymentRepository.updateOne(
      { stripePaymentIntentId: paymentIntentId },
      {
        $set: {
          status: 'refunded',
          refundedAt: new Date(),
          lastWebhookEventId: eventId,
        },
      }
    );
  }
}

module.exports = StripeWebhookService;
