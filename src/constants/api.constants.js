const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

const ROUTES = {
  API_PREFIX: '/api',
  HEALTH: '/health',
  AUTH: {
    BASE: '/user',
    LOGIN: '/login',
    REGISTER: '/register',
    REFRESH: '/refresh',
    LOGOUT: '/logout',
    LOGOUT_ALL: '/logout-all',
  },
  WEBHOOKS: {
    STRIPE: '/api/webhooks/stripe',
  },
};

const RESPONSE_MESSAGES = {
  SUCCESS: 'Success',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'User registered successfully',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  LOGOUT_ALL_SUCCESS: 'Logged out from all devices successfully',
};

const AUTH_CONSTANTS = {
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
  },
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    ACCOUNTANT: 'accountant',
    STAFF: 'staff',
    VIEWER: 'viewer',
  },
};

module.exports = {
  STATUS_CODES,
  ROUTES,
  RESPONSE_MESSAGES,
  AUTH_CONSTANTS,
};
