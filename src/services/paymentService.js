/**
 * Payment Service
 * Handles all business logic related to payments
 */

const paymentRepository = require('../repositories/paymentRepository');
const invoiceRepository = require('../repositories/invoiceRepository');
const { createSuccessResponse, createErrorResponse } = require('../helpers/responseHelper');
const Logger = require('../utils/logger');
const AuditService = require('./auditService');

class PaymentService {
  /**
   * Create a new payment
   * @param {Object} paymentData - Payment data
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Payment creation result
   */
  static async create(paymentData, merchantId) {
    try {
      Logger.info('Payment creation attempt', { merchantId, invoiceId: paymentData.invoice });

      // Validate invoice exists and belongs to merchant
      const invoice = await invoiceRepository.findOne({
        _id: paymentData.invoice,
        merchant: merchantId
      });

      if (!invoice) {
        return createErrorResponse('Invoice not found', 404);
      }

      // Check if payment already exists for this invoice
      const existingPayment = await paymentRepository.findByInvoice(paymentData.invoice);
      if (existingPayment) {
        return createErrorResponse('Payment already exists for this invoice', 409);
      }

      // Set merchant ID and status
      paymentData.merchant = merchantId;
      paymentData.status = paymentData.status || 'pending';
      paymentData.amount = paymentData.amount || paymentData.amount_due || paymentData.amount_paid || invoice.total;
      paymentData.amount_due = paymentData.amount_due || invoice.total;

      const payment = await paymentRepository.create(paymentData);

      await AuditService.log({
        actorId: merchantId,
        action: 'payment.create',
        entityType: 'payment',
        entityId: payment._id.toString(),
        metadata: { invoiceId: paymentData.invoice, amount: paymentData.amount },
      });

      Logger.info('Payment created successfully', { paymentId: payment._id, merchantId });

      return createSuccessResponse({ payment }, 'Payment created successfully');

    } catch (error) {
      Logger.error('Payment creation failed', {
        error: error.message,
        merchantId,
        paymentData
      });
      return createErrorResponse('Payment creation failed', 400);
    }
  }

  /**
   * Get all payments for merchant
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Payments result
   */
  static async getAll(merchantId, options = {}) {
    try {
      Logger.info('Get all payments attempt', { merchantId });

      const payments = await paymentRepository.findByMerchant(merchantId, options);

      Logger.info('Payments retrieved successfully', { merchantId, count: payments.length });

      return createSuccessResponse({ payments }, 'Payments retrieved successfully');

    } catch (error) {
      Logger.error('Get all payments failed', { error: error.message, merchantId });
      return createErrorResponse('Failed to retrieve payments', 500);
    }
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Payment result
   */
  static async getById(paymentId, merchantId) {
    try {
      Logger.info('Get payment by ID attempt', { paymentId, merchantId });

      const payment = await paymentRepository.findOne({
        _id: paymentId,
        merchant: merchantId
      }, { populate: ['invoice'] });

      if (!payment) {
        return createErrorResponse('Payment not found', 404);
      }

      Logger.info('Payment retrieved successfully', { paymentId, merchantId });

      return createSuccessResponse({ payment }, 'Payment retrieved successfully');

    } catch (error) {
      Logger.error('Get payment by ID failed', { error: error.message, paymentId, merchantId });
      return createErrorResponse('Failed to retrieve payment', 500);
    }
  }

  /**
   * Update payment status
   * @param {string} paymentId - Payment ID
   * @param {string} status - New status
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Update result
   */
  static async updateStatus(paymentId, status, merchantId) {
    try {
      Logger.info('Payment status update attempt', { paymentId, merchantId, status });

      // Validate status
      const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return createErrorResponse('Invalid payment status', 400);
      }

      // Check if payment exists and belongs to merchant
      const payment = await paymentRepository.findOne({
        _id: paymentId,
        merchant: merchantId
      });

      if (!payment) {
        return createErrorResponse('Payment not found', 404);
      }

      const updatedPayment = await paymentRepository.updateById(paymentId, { status }, {
        new: true,
        runValidators: true
      });

      await AuditService.log({
        actorId: merchantId,
        action: 'payment.update_status',
        entityType: 'payment',
        entityId: paymentId,
        metadata: { status },
      });

      Logger.info('Payment status updated successfully', { paymentId, merchantId, status });

      return createSuccessResponse({ payment: updatedPayment }, 'Payment status updated successfully');

    } catch (error) {
      Logger.error('Payment status update failed', {
        error: error.message,
        paymentId,
        merchantId,
        status
      });
      return createErrorResponse('Payment status update failed', 400);
    }
  }

  /**
   * Process payment (integrate with Stripe)
   * @param {string} paymentId - Payment ID
   * @param {Object} paymentMethod - Payment method details
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Payment processing result
   */
  static async processPayment(paymentId, paymentMethod, merchantId) {
    try {
      Logger.info('Payment processing attempt', { paymentId, merchantId });

      // Get payment details
      const payment = await paymentRepository.findOne({
        _id: paymentId,
        merchant: merchantId
      }, { populate: ['invoice'] });

      if (!payment) {
        return createErrorResponse('Payment not found', 404);
      }

      if (payment.status === 'completed') {
        return createErrorResponse('Payment already completed', 400);
      }

      // Process payment with Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: payment.currency || 'usd',
        payment_method: paymentMethod.id,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          paymentId: payment._id.toString(),
          invoiceId: payment.invoice._id.toString()
        }
      });

      // Update payment status based on Stripe result
      let newStatus = 'failed';
      if (paymentIntent.status === 'succeeded') {
        newStatus = 'completed';
      } else if (paymentIntent.status === 'requires_payment_method') {
        newStatus = 'failed';
      }

      const updatedPayment = await paymentRepository.updateById(paymentId, {
        status: newStatus,
        stripePaymentIntentId: paymentIntent.id,
        processedAt: new Date()
      }, { new: true });

      await AuditService.log({
        actorId: merchantId,
        action: 'payment.process',
        entityType: 'payment',
        entityId: paymentId,
        metadata: {
          status: newStatus,
          stripePaymentIntentId: paymentIntent.id,
        },
      });

      Logger.info('Payment processed', {
        paymentId,
        merchantId,
        status: newStatus,
        stripePaymentIntentId: paymentIntent.id
      });

      return createSuccessResponse({
        payment: updatedPayment,
        stripePaymentIntent: paymentIntent
      }, `Payment ${newStatus}`);

    } catch (error) {
      Logger.error('Payment processing failed', {
        error: error.message,
        paymentId,
        merchantId
      });

      // Update payment status to failed
      await paymentRepository.updateById(paymentId, { status: 'failed' });

      return createErrorResponse('Payment processing failed', 400);
    }
  }

  /**
   * Get payment statistics for merchant
   * @param {string} merchantId - Merchant ID
   * @returns {Promise<Object>} Statistics result
   */
  static async getStatistics(merchantId) {
    try {
      Logger.info('Get payment statistics attempt', { merchantId });

      const stats = await paymentRepository.getStatistics(merchantId);

      Logger.info('Payment statistics retrieved', { merchantId, stats });

      return createSuccessResponse(stats, 'Payment statistics retrieved successfully');

    } catch (error) {
      Logger.error('Get payment statistics failed', { error: error.message, merchantId });
      return createErrorResponse('Failed to retrieve statistics', 500);
    }
  }

  /**
   * Get payments by status
   * @param {string} status - Payment status
   * @param {string} merchantId - Merchant ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Payments result
   */
  static async getByStatus(status, merchantId, options = {}) {
    try {
      Logger.info('Get payments by status attempt', { merchantId, status });

      const payments = await paymentRepository.findByStatus(status, merchantId, options);

      Logger.info('Payments by status retrieved', { merchantId, status, count: payments.length });

      return createSuccessResponse({ payments }, 'Payments retrieved successfully');

    } catch (error) {
      Logger.error('Get payments by status failed', { error: error.message, merchantId, status });
      return createErrorResponse('Failed to retrieve payments', 500);
    }
  }
}

module.exports = PaymentService;