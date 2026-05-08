/**
 * Application Configuration
 * Main application setup and configuration
 */

const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/config');
const Logger = require('./utils/logger');

// Create Express application
const app = express();

/**
 * Database Connection
 * Establishes connection to MongoDB
 */
const connectDatabase = async () => {
  try {
    await mongoose.connect(config.database.url, config.database.options);
    Logger.info('MongoDB Connected', { url: config.database.url });
  } catch (error) {
    Logger.error('MongoDB Connection Error', { error: error.message });
    process.exit(1);
  }
};

/**
 * Middleware Configuration
 * Sets up all application middleware
 */
const configureMiddleware = () => {
  // Body parsing middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: '10mb' }));

  // View Engine
  app.engine('html', require('ejs').renderFile);

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      Logger.logRequest(req, res, duration);
    });

    next();
  });

  Logger.info('Middleware configured');
};

/**
 * Route Configuration
 * Sets up all application routes
 */
const configureRoutes = () => {
  const routes = require('./routes');

  // Mount routes
  app.use('/', routes);

  Logger.info('Routes configured');
};

/**
 * Error Handling Configuration
 * Sets up centralized error handling
 */
const configureErrorHandling = () => {
  const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  Logger.info('Error handling configured');
};

/**
 * Initialize Application
 * Sets up the entire application
 */
const initializeApp = async () => {
  try {
    Logger.info('Initializing application...');

    // Connect to database
    await connectDatabase();

    // Configure middleware
    configureMiddleware();

    // Configure routes
    configureRoutes();

    // Configure error handling
    configureErrorHandling();

    Logger.info('Application initialized successfully');

    return app;

  } catch (error) {
    Logger.error('Application initialization failed', { error: error.message });
    throw error;
  }
};

module.exports = initializeApp;