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
 * @swagger
 * /api/item/create:
 *   post:
 *     tags:
 *       - Items
 *     summary: Create a new item
 *     description: Adds a new product or service to the authenticated merchant's catalogue.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemCreateRequest'
 *           example:
 *             name: Web Design Service
 *             description: Professional web design and development
 *             price: 150.00
 *             category: Services
 *             quantity: 10
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/item/all:
 *   get:
 *     tags:
 *       - Items
 *     summary: Get all items
 *     description: Returns a paginated list of all items in the authenticated merchant's catalogue.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/sortParam'
 *     responses:
 *       200:
 *         description: Items retrieved successfully
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
 *                         $ref: '#/components/schemas/Item'
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

  const result = await ItemService.getAll(req.user._id, options);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/item/{id}:
 *   get:
 *     tags:
 *       - Items
 *     summary: Get an item by ID
 *     description: Returns a single item from the authenticated merchant's catalogue.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoIdParam'
 *     responses:
 *       200:
 *         description: Item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Item'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await ItemService.getById(req.params.id, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/item/{id}:
 *   put:
 *     tags:
 *       - Items
 *     summary: Update an item
 *     description: Partially or fully updates an item in the authenticated merchant's catalogue.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemUpdateRequest'
 *     responses:
 *       200:
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/item/{id}:
 *   delete:
 *     tags:
 *       - Items
 *     summary: Delete an item
 *     description: Permanently removes an item from the authenticated merchant's catalogue.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoIdParam'
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await ItemService.delete(req.params.id, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/item/search:
 *   get:
 *     tags:
 *       - Items
 *     summary: Search items
 *     description: Full-text search across the authenticated merchant's item catalogue.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (matches name, description, category)
 *         example: design
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/skipParam'
 *     responses:
 *       200:
 *         description: Search results returned
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
 *                         $ref: '#/components/schemas/Item'
 *       400:
 *         description: Search term missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/item/category/{category}:
 *   get:
 *     tags:
 *       - Items
 *     summary: Get items by category
 *     description: Returns all items in the specified category for the authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Category name
 *         example: Services
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/sortParam'
 *     responses:
 *       200:
 *         description: Items retrieved successfully
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
 *                         $ref: '#/components/schemas/Item'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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