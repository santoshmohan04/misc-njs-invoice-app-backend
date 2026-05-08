/**
 * Item Controller
 * Thin controllers that delegate business logic to services
 */

const express = require('express');
const router = express.Router();

// Services
const ItemService = require('../services/itemService');

// Middlewares
const { authenticate } = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const asyncHandler = require('../helpers/asyncHandler');

// Validation schemas
const { createSchema, updateSchema } = require('../validations/itemValidations');

// Response helpers
const { sendSuccess, sendError } = require('../helpers/responseHelper');

/**
 * Create item
 * POST /item/create
 */
router.post('/create', authenticate, validate(createSchema), asyncHandler(async (req, res) => {
  const itemData = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    quantity: req.body.quantity,
  };

  const result = await ItemService.create(itemData, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message, 201);
}));

/**
 * Get all items
 * GET /item/all
 */
router.get('/all', authenticate, asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit) || 50,
    skip: parseInt(req.query.skip) || 0,
    sort: req.query.sort || '-createdAt'
  };

  const result = await ItemService.getAll(req.user._id, options);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Get item by ID
 * GET /item/:id
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await ItemService.getById(req.params.id, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Update item
 * PUT /item/:id
 */
router.put('/:id', authenticate, validate(updateSchema), asyncHandler(async (req, res) => {
  const updateData = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    quantity: req.body.quantity,
  };

  const result = await ItemService.update(req.params.id, updateData, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Delete item
 * DELETE /item/:id
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await ItemService.delete(req.params.id, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Search items
 * GET /item/search?q=searchTerm
 */
router.get('/search', authenticate, asyncHandler(async (req, res) => {
  const { q: searchTerm } = req.query;

  if (!searchTerm) {
    return sendError(res, 'Search term is required', 400);
  }

  const options = {
    limit: parseInt(req.query.limit) || 20,
    skip: parseInt(req.query.skip) || 0
  };

  const result = await ItemService.search(searchTerm, req.user._id, options);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * Get items by category
 * GET /item/category/:category
 */
router.get('/category/:category', authenticate, asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit) || 50,
    skip: parseInt(req.query.skip) || 0,
    sort: req.query.sort || '-createdAt'
  };

  const result = await ItemService.getByCategory(req.params.category, req.user._id, options);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

module.exports = router;