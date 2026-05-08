/**
 * Payment Controller
 * Thin controllers that delegate business logic to services
 */

const express = require('express');
const router = express.Router();

// Services
const PaymentService = require('../services/paymentService');

// Middlewares
const { authenticate } = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const asyncHandler = require('../helpers/asyncHandler');

// Validation schemas
const { createSchema, processSchema } = require('../validations/paymentValidations');

// Response helpers
const { sendSuccess, sendError } = require('../helpers/responseHelper');

/**
 * Create payment
 * POST /payment/create
 */
router.post('/create', authenticate, validate(createSchema), asyncHandler(async (req, res) => {
  const paymentData = {
    invoice: req.body.invoice,
    amount: req.body.amount,
    currency: req.body.currency,
    method: req.body.method,
    status: req.body.status || 'pending',
  };

  const result = await PaymentService.create(paymentData, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message, 201);
}));

/**
 * Get all payments
 * GET /payment/all
 */
router.get('/all', authenticate, asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit) || 50,
    skip: parseInt(req.query.skip) || 0,
    sort: req.query.sort || '-createdAt'
  };

  const result = await PaymentService.getAll(req.user._id, options);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Get payment by ID
 * GET /payment/:id
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await PaymentService.getById(req.params.id, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Update payment status
 * PUT /payment/:id/status
 */
router.put('/:id/status', authenticate, asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return sendError(res, 'Status is required', 400);
  }

  const result = await PaymentService.updateStatus(req.params.id, status, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Process payment with Stripe
 * POST /payment/:id/process
 */
router.post('/:id/process', authenticate, validate(processSchema), asyncHandler(async (req, res) => {
  const paymentMethod = {
    id: req.body.paymentMethodId,
    type: req.body.type || 'card'
  };

  const result = await PaymentService.processPayment(req.params.id, paymentMethod, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Get payment statistics
 * GET /payment/statistics
 */
router.get('/statistics/overview', authenticate, asyncHandler(async (req, res) => {
  const result = await PaymentService.getStatistics(req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Get payments by status
 * GET /payment/status/:status
 */
router.get('/status/:status', authenticate, asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit) || 50,
    skip: parseInt(req.query.skip) || 0,
    sort: req.query.sort || '-createdAt'
  };

  const result = await PaymentService.getByStatus(req.params.status, req.user._id, options);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

module.exports = router;