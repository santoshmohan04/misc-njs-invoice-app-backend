/**
 * Invoice Controller
 * Thin controllers that delegate business logic to services
 */

const express = require('express');
const router = express.Router();

// Services
const InvoiceService = require('../services/invoiceService');

// Middlewares
const { authenticate } = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const asyncHandler = require('../helpers/asyncHandler');

// Validation schemas
const { editSchema } = require('../validations/invoiceValidations');

// Response helpers
const { sendSuccess, sendError } = require('../helpers/responseHelper');

/**
 * @swagger
 * /api/invoice/edit:
 *   post:
 *     tags:
 *       - Invoices
 *     summary: Create or update an invoice
 *     description: Creates a new invoice or updates an existing one (upsert by invoice number).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceEditRequest'
 *           example:
 *             number: INV-2024-001
 *             customer: "64a1b2c3d4e5f6a7b8c9d0e2"
 *             issued: "2024-01-15T00:00:00.000Z"
 *             due: "2024-02-15T00:00:00.000Z"
 *             items:
 *               - item: "64a1b2c3d4e5f6a7b8c9d0e3"
 *                 quantity: 2
 *                 subtotal: 300.00
 *             subtotal: 300.00
 *             discount: 15.00
 *             total: 285.00
 *             payment: null
 *     responses:
 *       200:
 *         description: Invoice saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Invoice'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/edit', authenticate, validate(editSchema), asyncHandler(async (req, res) => {
  const invoiceData = {
    number: req.body.number,
    customer: req.body.customer,
    issued: req.body.issued,
    due: req.body.due,
    items: req.body.items,
    subtotal: req.body.subtotal,
    discount: req.body.discount,
    total: req.body.total,
    payment: req.body.payment,
  };

  const result = await InvoiceService.createOrUpdate(invoiceData, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/invoice/all:
 *   get:
 *     tags:
 *       - Invoices
 *     summary: Get all invoices
 *     description: Returns all invoices for the authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
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
 *                         $ref: '#/components/schemas/Invoice'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/all', authenticate, asyncHandler(async (req, res) => {
  const result = await InvoiceService.getAll(req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/invoice/send:
 *   post:
 *     tags:
 *       - Invoices
 *     summary: Send an invoice by email
 *     description: Generates a PDF of the invoice and sends it to the customer's email address along with a payment link.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceSendRequest'
 *           example:
 *             payment: "64a1b2c3d4e5f6a7b8c9d0e4"
 *     responses:
 *       200:
 *         description: Invoice sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Invoice or payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/send', authenticate, asyncHandler(async (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;

  const result = await InvoiceService.sendByEmail(req.body.payment, req.user, baseUrl);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/invoice/statistics:
 *   get:
 *     tags:
 *       - Invoices
 *     summary: Get invoice statistics
 *     description: Returns aggregated statistics about the authenticated merchant's invoices (totals, outstanding amounts, etc.).
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
 *                           example: 15
 *                         totalAmount:
 *                           type: number
 *                           example: 4275.00
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics', authenticate, asyncHandler(async (req, res) => {
  const result = await InvoiceService.getStatistics(req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

module.exports = router;