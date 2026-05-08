/**
 * Route Registration
 * Centralized route registration for the application
 */

const express = require('express');
const router = express.Router();

// Import controllers
const userController = require('../controllers/userController');
const customerController = require('../controllers/customerController');
const itemController = require('../controllers/itemController');
const invoiceController = require('../controllers/invoiceController');
const paymentController = require('../controllers/paymentController');

// Import middlewares
const { apiRateLimiter } = require('../middlewares/rateLimiter');

/**
 * Health check route
 * GET /health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

/**
 * API Routes
 * All API routes are prefixed with /api in the main app
 */

// Apply API rate limiting to all routes
router.use('/api/', apiRateLimiter);

// User routes
router.use('/api/user', userController);

// Customer routes
router.use('/api/customer', customerController);

// Item routes
router.use('/api/item', itemController);

// Invoice routes
router.use('/api/invoice', invoiceController);

// Payment routes
router.use('/api/payment', paymentController);

/**
 * Legacy route support (for backward compatibility)
 * These routes maintain the old URL structure
 */

// Legacy user routes (without /api prefix)
router.use('/user', userController);

// Legacy customer routes
router.use('/customer', customerController);

// Legacy item routes
router.use('/item', itemController);

// Legacy invoice routes
router.use('/invoice', invoiceController);

// Legacy payment routes
router.use('/payment', paymentController);

module.exports = router;