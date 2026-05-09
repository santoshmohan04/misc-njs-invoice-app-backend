const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details, true);
    this.name = 'ValidationError';
  }
}

module.exports = ValidationError;
