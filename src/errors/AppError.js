class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR', details = null, expose = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.expose = expose;
  }
}

module.exports = AppError;
