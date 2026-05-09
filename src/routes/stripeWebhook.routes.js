const express = require('express');
const StripeWebhookService = require('../services/stripeWebhookService');
const Logger = require('../utils/logger');

const router = express.Router();

router.post('/stripe', async (req, res) => {
  try {
    const signature = req.header('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ success: false, message: 'Missing Stripe signature or webhook secret' });
    }

    const event = StripeWebhookService.constructEvent(req.body, signature, webhookSecret);
    const result = await StripeWebhookService.processEvent(event);

    return res.status(200).json({
      success: true,
      message: result.duplicate ? 'Duplicate event ignored' : 'Webhook processed',
    });
  } catch (error) {
    Logger.error('stripe.webhook.error', { error: error.message });
    return res.status(400).json({ success: false, message: `Webhook Error: ${error.message}` });
  }
});

module.exports = router;
