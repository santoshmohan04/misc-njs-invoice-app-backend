/**
 * Logger Utility
 * Centralized logging with different levels and transports
 */

const winston = require('winston');
const config = require('../config/config');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.colorize({ all: true })
);

// Define transports
const transports = [];

// Console transport
if (config.logging.enableConsole) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} ${level}: ${message} ${metaStr}`;
        })
      )
    })
  );
}

// File transport for production
if (config.logging.enableFile) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format,
  transports,
  exitOnError: false,
});

/**
 * Logger instance with custom methods
 */
class Logger {
  static error(message, meta = {}) {
    logger.error(message, meta);
  }

  static warn(message, meta = {}) {
    logger.warn(message, meta);
  }

  static info(message, meta = {}) {
    logger.info(message, meta);
  }

  static http(message, meta = {}) {
    logger.http(message, meta);
  }

  static debug(message, meta = {}) {
    logger.debug(message, meta);
  }

  /**
   * Log HTTP requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in ms
   */
  static logRequest(req, res, responseTime) {
    const { method, url, ip } = req;
    const { statusCode } = res;

    logger.http(`${method} ${url} ${statusCode} - ${responseTime}ms`, {
      method,
      url,
      statusCode,
      responseTime,
      ip,
      userAgent: req.get('User-Agent')
    });
  }

  /**
   * Log errors with stack trace
   * @param {Error} error - Error object
   * @param {Object} req - Express request object (optional)
   */
  static logError(error, req = null) {
    const meta = {
      message: error.message,
      stack: error.stack,
      name: error.name
    };

    if (req) {
      meta.url = req.url;
      meta.method = req.method;
      meta.ip = req.ip;
      meta.userId = req.user ? req.user._id : null;
    }

    logger.error('Application Error', meta);
  }
}

module.exports = Logger;