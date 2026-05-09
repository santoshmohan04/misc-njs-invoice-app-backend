const AppError = require('./AppError');

class PaymentError extends AppError {
  constructor(message = 'Payment processing error', statusCode = 400, details = null) {
    super(message, statusCode, 'PAYMENT_ERROR', details, true);
    this.name = 'PaymentError';
  }
}

module.exports = PaymentError;
