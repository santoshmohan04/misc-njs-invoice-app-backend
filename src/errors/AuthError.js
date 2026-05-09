const AppError = require('./AppError');

class AuthError extends AppError {
  constructor(message = 'Unauthorized access', details = null) {
    super(message, 401, 'AUTH_ERROR', details, true);
    this.name = 'AuthError';
  }
}

module.exports = AuthError;
