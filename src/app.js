/**
 * Application Configuration
 * Main application setup and configuration
 */

const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/config');
const Logger = require('./utils/logger');
const { swaggerSpec, swaggerUiOptions } = require('./config/swagger');
const {
  helmetOptions,
  corsOptions,
  compressionOptions,
  morganFormat,
} = require('./config/security');

// Create Express application
const app = express();

// -----------------------------------------------------------------------
// Trust proxy – must be set before any middleware that reads req.ip so that
// express-rate-limit, secure cookies, and logging all receive the real
// client IP when the app sits behind a reverse proxy (nginx, load balancer).
// -----------------------------------------------------------------------
if (config.security.trustProxy) {
  app.set('trust proxy', 1);
}

// Disable the X-Powered-By header to avoid advertising the server stack.
app.disable('x-powered-by');

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
 * Sets up all application middleware in the recommended order:
 *   security → cors → compression → logging → body parsing → view engine
 */
const configureMiddleware = () => {
  // -----------------------------------------------------------------------
  // Helmet – sets secure HTTP response headers (CSP, HSTS, X-Frame-Options …)
  // -----------------------------------------------------------------------
  app.use(helmet(helmetOptions));

  // -----------------------------------------------------------------------
  // CORS – validates the Origin header against the environment-based allow-list
  // and injects the appropriate Access-Control-* response headers.
  // -----------------------------------------------------------------------
  app.use(cors(corsOptions));

  // Handle pre-flight OPTIONS requests for all routes
  app.options('*', cors(corsOptions));

  // -----------------------------------------------------------------------
  // Compression – gzip / deflate responses to reduce payload size.
  // Applied after security headers so the Content-Encoding header is correct.
  // -----------------------------------------------------------------------
  app.use(compression(compressionOptions));

  // -----------------------------------------------------------------------
  // Morgan – structured HTTP request logging.
  // Uses 'combined' format in production (includes IP, user-agent) and
  // 'dev' format in development (concise, coloured output).
  // -----------------------------------------------------------------------
  app.use(
    morgan(morganFormat, {
      stream: {
        // Route morgan output through the existing Winston logger
        write: (message) => Logger.http(message.trim()),
      },
    })
  );

  // Body parsing middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: '10mb' }));

  // View Engine
  app.engine('html', require('ejs').renderFile);

  // Response-time logging (complements morgan with Winston-level detail)
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
 * Swagger UI Route Configuration
 * Mounts the API documentation UI at /api-docs.
 * A relaxed Content-Security-Policy is applied only to this path so that
 * Swagger UI's inline scripts and styles can execute, while the rest of the
 * application keeps the strict production CSP defined in security.js.
 */
const configureSwagger = () => {
  // Helmet override for /api-docs – allow inline scripts/styles required by Swagger UI
  const swaggerCsp = {
    ...helmetOptions,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  };

  app.use('/api-docs', helmet(swaggerCsp));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  Logger.info('Swagger UI available at /api-docs');
};

/**
 * Route Configuration
 * Sets up all application routes
 */
const configureRoutes = () => {
  const routes = require('./routes');

  // API documentation (mounted before other routes so it is never caught by
  // the rate limiter or the 404 handler)
  configureSwagger();

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