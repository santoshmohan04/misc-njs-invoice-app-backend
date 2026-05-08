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
 * @swagger
 * /api/payment/create:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create a payment record
 *     description: Creates a new payment record linked to an invoice. Use POST /api/payment/{id}/process to charge the card via Stripe.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentCreateRequest'
 *           example:
 *             invoice: "64a1b2c3d4e5f6a7b8c9d0e5"
 *             amount: 285.00
 *             currency: USD
 *             method: card
 *             status: pending
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/payment/all:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get all payments
 *     description: Returns a paginated list of all payment records for the authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/sortParam'
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/payment/{id}:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get a payment by ID
 *     description: Returns a single payment record owned by the authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoIdParam'
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await PaymentService.getById(req.params.id, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/payment/{id}/status:
 *   put:
 *     tags:
 *       - Payments
 *     summary: Update payment status
 *     description: Updates the status of an existing payment record.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentStatusUpdateRequest'
 *           example:
 *             status: completed
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Status is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/payment/{id}/process:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Process payment via Stripe
 *     description: Charges the customer using the supplied Stripe payment method ID. Requires `STRIPE_SECRET_KEY` to be configured on the server.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentProcessRequest'
 *           example:
 *             paymentMethodId: pm_1OqFCd2eZvKYlo2C4XXXXX
 *             type: card
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/payment/statistics/overview:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get payment statistics
 *     description: Returns aggregated payment statistics (total collected, pending, failed, etc.) for the authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 30
 *                         totalAmount:
 *                           type: number
 *                           example: 8550.00
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics/overview', authenticate, asyncHandler(async (req, res) => {
  const result = await PaymentService.getStatistics(req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/payment/status/{status}:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get payments by status
 *     description: Returns all payment records filtered by the given status for the authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *         description: Payment status to filter by
 *         example: pending
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/sortParam'
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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