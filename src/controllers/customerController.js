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
 * @swagger
 * /api/customer/create:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Create a new customer
 *     description: Creates a new customer record linked to the authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerCreateRequest'
 *           example:
 *             name: Acme Inc
 *             email: billing@acme.com
 *             phone: "+1-800-555-0100"
 *             address: "100 Business Ave, New York, NY 10001"
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Customer'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/customer/all:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get all customers
 *     description: Returns a paginated list of all customers belonging to the authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/sortParam'
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
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
 *                         $ref: '#/components/schemas/Customer'
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

  const result = await CustomerService.getAll(req.user._id, options);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/customer/{id}:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get a customer by ID
 *     description: Returns a single customer record owned by the authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoIdParam'
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Customer'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const result = await CustomerService.getById(req.params.id, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/customer/{id}:
 *   put:
 *     tags:
 *       - Customers
 *     summary: Update a customer
 *     description: Partially or fully updates a customer record. At least one field must be provided.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerUpdateRequest'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Customer'
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
 * @swagger
 * /api/customer/{id}:
 *   delete:
 *     tags:
 *       - Customers
 *     summary: Delete a customer
 *     description: Permanently deletes a customer record owned by the authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/mongoIdParam'
 *     responses:
 *       200:
 *         description: Customer deleted successfully
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
  const result = await CustomerService.delete(req.params.id, req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/customer/statistics/overview:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get customer statistics
 *     description: Returns aggregated statistics about the authenticated merchant's customers (total count, recent additions, etc.).
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
 *                           example: 42
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics/overview', authenticate, asyncHandler(async (req, res) => {
  const result = await CustomerService.getStatistics(req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

module.exports = router;