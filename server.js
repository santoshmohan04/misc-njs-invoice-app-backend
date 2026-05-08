/**
 * Server Entry Point
 * Starts the Express server with modular architecture
 */

require('dotenv').config();

const config = require('./src/config/config');
const Logger = require('./src/utils/logger');

/**
 * Start Server
 * Initializes the application and starts the server
 */
const startServer = async () => {
  try {
    Logger.info('Starting server...');

    // Initialize application
    const initializeApp = require('./src/app');
    const app = await initializeApp();

    // Server configuration
    const PORT = config.server.port;
    const HOST = config.server.host;

    // Start server
    const server = app.listen(PORT, HOST, () => {
      Logger.info('Server started successfully', {
        port: PORT,
        host: HOST,
        environment: config.server.env,
        nodeVersion: process.version
      });

      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`📝 Environment: ${config.server.env}`);
      console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      Logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        Logger.info('Server closed');

        // Close database connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();

        Logger.info('Database connection closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        Logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });

  } catch (error) {
    Logger.error('Failed to start server', { error: error.message });
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();