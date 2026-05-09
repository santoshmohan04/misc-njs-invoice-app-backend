/**
 * HTTP Status Codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Response Messages
 */
const MESSAGES = {
  // Success Messages
  SUCCESS: 'Success',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  TOKEN_REFRESHED: 'Token refreshed successfully',

  // Error Messages
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already exists',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  ACCOUNT_LOCKED: 'Account is temporarily locked due to too many failed login attempts',

  // Business Logic Messages
  INVOICE_UPDATED: 'Invoice updated successfully',
  INVOICE_SENT: 'Invoice sent successfully',
  CUSTOMER_CREATED: 'Customer created successfully',
  ITEM_CREATED: 'Item created successfully',
  PAYMENT_PROCESSED: 'Payment processed successfully'
};

/**
 * Token Types
 */
const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  AUTH: 'auth'
};

/**
 * User Roles (for future extension)
 */
const USER_ROLES = {
  ADMIN: 'admin',
  MERCHANT: 'merchant',
  CUSTOMER: 'customer'
};

/**
 * Payment Status
 */
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Invoice Status
 */
const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

/**
 * Currency Codes
 */
const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  INR: 'INR',
  AUD: 'AUD',
  CAD: 'CAD'
};

module.exports = {
  HTTP_STATUS,
  MESSAGES,
  TOKEN_TYPES,
  USER_ROLES,
  PAYMENT_STATUS,
  INVOICE_STATUS,
  CURRENCIES,
  ...require('./api.constants')
};