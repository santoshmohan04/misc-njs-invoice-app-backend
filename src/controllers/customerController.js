/**
 * Customer Controller
 * Thin controllers that delegate business logic to services
 */

const express = require('express');
const router = express.Router();

// Services
const CustomerService = require('../services/customerService');

// Middlewares
const { authenticate } = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const asyncHandler = require('../helpers/asyncHandler');

// Validation schemas
const { createSchema, updateSchema } = require('../validations/customerValidations');

// Response helpers
const { sendSuccess, sendError } = require('../helpers/responseHelper');

/**
 * Create customer
 * POST /customer/create
 */
router.post('/create', authenticate, validate(createSchema), asyncHandler(async (req, res) => {
  const customerData = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
  };

  const result = await CustomerService.create(customerData, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message, 201);
}));

/**
 * Get all customers
 * GET /customer/all
 */
router.get('/all', authenticate, asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit) || 50,
    skip: parseInt(req.query.skip) || 0,
    sort: req.query.sort || '-createdAt'
  };

  const result = await CustomerService.getAll(req.user._id, options);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Get customer by ID
 * GET /customer/:id
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await CustomerService.getById(req.params.id, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Update customer
 * PUT /customer/:id
 */
router.put('/:id', authenticate, validate(updateSchema), asyncHandler(async (req, res) => {
  const updateData = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
  };

  const result = await CustomerService.update(req.params.id, updateData, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Delete customer
 * DELETE /customer/:id
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await CustomerService.delete(req.params.id, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Get customer statistics
 * GET /customer/statistics
 */
router.get('/statistics/overview', authenticate, asyncHandler(async (req, res) => {
  const result = await CustomerService.getStatistics(req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

module.exports = router;