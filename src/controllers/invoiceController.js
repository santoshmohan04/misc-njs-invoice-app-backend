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
 * Edit invoice information
 * POST /invoice/edit
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
 * Get all invoices for the authenticated merchant
 * GET /invoice/all
 */
router.get('/all', authenticate, asyncHandler(async (req, res) => {
  const result = await InvoiceService.getAll(req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Send invoice via email
 * POST /invoice/send
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
 * Get invoice statistics
 * GET /invoice/statistics
 */
router.get('/statistics', authenticate, asyncHandler(async (req, res) => {
  const result = await InvoiceService.getStatistics(req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

module.exports = router;