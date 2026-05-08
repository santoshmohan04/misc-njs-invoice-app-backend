/**
 * Swagger / OpenAPI Configuration
 * Generates the OpenAPI 3.0 specification from JSDoc annotations
 * and exposes it through swagger-ui-express.
 */

'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// ---------------------------------------------------------------------------
// API metadata
// ---------------------------------------------------------------------------

const apiInfo = {
  title: 'Invoice App API',
  description:
    'REST API for the Invoice App backend. Supports merchant registration, ' +
    'customer management, item catalogue, invoice generation, and payment ' +
    'processing via Stripe. All protected endpoints require a JWT Bearer token.',
  version: '1.0.0',
  contact: {
    name: 'Invoice App Support',
    email: 'invoiceappserver@gmail.com',
  },
  license: {
    name: 'ISC',
  },
};

// ---------------------------------------------------------------------------
// Reusable schema components
// ---------------------------------------------------------------------------

const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Enter the JWT access token obtained from POST /api/user/login. ' +
        'Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`',
    },
  },
  schemas: {
    // -----------------------------------------------------------------------
    // Generic wrappers
    // -----------------------------------------------------------------------
    SuccessResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Operation successful' },
        data: { type: 'object' },
      },
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'An error occurred' },
      },
    },
    ValidationErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    // -----------------------------------------------------------------------
    // User / Auth
    // -----------------------------------------------------------------------
    UserRegisterRequest: {
      type: 'object',
      required: ['name', 'email', 'password', 'phone', 'address', 'base_currency'],
      properties: {
        name: { type: 'string', minLength: 4, example: 'John Doe' },
        email: { type: 'string', format: 'email', example: 'john@example.com' },
        password: { type: 'string', minLength: 8, example: 'SecurePass123' },
        company: { type: 'string', nullable: true, example: 'ABC Corp' },
        phone: { type: 'string', example: '+1234567890' },
        address: { type: 'string', example: '123 Main St, Springfield' },
        base_currency: { type: 'string', example: 'USD' },
      },
    },
    UserLoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'john@example.com' },
        password: { type: 'string', example: 'SecurePass123' },
      },
    },
    UserEditRequest: {
      type: 'object',
      required: ['phone', 'address', 'base_currency'],
      properties: {
        company: { type: 'string', nullable: true, example: 'Updated Corp' },
        phone: { type: 'string', example: '+1987654321' },
        address: { type: 'string', example: '456 New St, Springfield' },
        base_currency: { type: 'string', example: 'EUR' },
      },
    },
    TokenPair: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
    User: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john@example.com' },
        company: { type: 'string', example: 'ABC Corp' },
        phone: { type: 'string', example: '+1234567890' },
        address: { type: 'string', example: '123 Main St' },
        base_currency: { type: 'string', example: 'USD' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    // -----------------------------------------------------------------------
    // Customer
    // -----------------------------------------------------------------------
    CustomerCreateRequest: {
      type: 'object',
      required: ['name', 'email', 'phone', 'address'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Acme Inc' },
        email: { type: 'string', format: 'email', example: 'billing@acme.com' },
        phone: { type: 'string', minLength: 8, maxLength: 20, example: '+1-800-555-0100' },
        address: { type: 'string', minLength: 10, maxLength: 500, example: '100 Business Ave, New York, NY 10001' },
      },
    },
    CustomerUpdateRequest: {
      type: 'object',
      minProperties: 1,
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Acme Inc' },
        email: { type: 'string', format: 'email', example: 'billing@acme.com' },
        phone: { type: 'string', minLength: 8, maxLength: 20, example: '+1-800-555-0100' },
        address: { type: 'string', minLength: 10, maxLength: 500, example: '100 Business Ave, New York, NY 10001' },
      },
    },
    Customer: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e2' },
        name: { type: 'string', example: 'Acme Inc' },
        email: { type: 'string', example: 'billing@acme.com' },
        phone: { type: 'string', example: '+1-800-555-0100' },
        address: { type: 'string', example: '100 Business Ave' },
        merchant: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    // -----------------------------------------------------------------------
    // Item
    // -----------------------------------------------------------------------
    ItemCreateRequest: {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Web Design Service' },
        description: { type: 'string', maxLength: 500, example: 'Professional web design and development' },
        price: { type: 'number', minimum: 0, example: 150.00 },
        category: { type: 'string', minLength: 2, maxLength: 50, example: 'Services' },
        quantity: { type: 'integer', minimum: 0, default: 0, example: 10 },
      },
    },
    ItemUpdateRequest: {
      type: 'object',
      minProperties: 1,
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Web Design Service' },
        description: { type: 'string', maxLength: 500, example: 'Professional web design and development' },
        price: { type: 'number', minimum: 0, example: 150.00 },
        category: { type: 'string', minLength: 2, maxLength: 50, example: 'Services' },
        quantity: { type: 'integer', minimum: 0, example: 10 },
      },
    },
    Item: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e3' },
        name: { type: 'string', example: 'Web Design Service' },
        description: { type: 'string', example: 'Professional web design' },
        price: { type: 'number', example: 150.00 },
        category: { type: 'string', example: 'Services' },
        quantity: { type: 'integer', example: 10 },
        merchant: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    // -----------------------------------------------------------------------
    // Invoice
    // -----------------------------------------------------------------------
    InvoiceItem: {
      type: 'object',
      required: ['item', 'quantity', 'subtotal'],
      properties: {
        item: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e3' },
        quantity: { type: 'integer', minimum: 0, example: 2 },
        subtotal: { type: 'number', minimum: 0, example: 300.00 },
      },
    },
    InvoiceEditRequest: {
      type: 'object',
      required: ['number', 'customer', 'issued', 'due', 'items', 'subtotal', 'discount', 'total'],
      properties: {
        number: { type: 'string', minLength: 8, example: 'INV-2024-001' },
        customer: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e2' },
        issued: { type: 'string', format: 'date-time', example: '2024-01-15T00:00:00.000Z' },
        due: { type: 'string', format: 'date-time', example: '2024-02-15T00:00:00.000Z' },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/InvoiceItem' },
        },
        subtotal: { type: 'number', minimum: 0, example: 300.00 },
        discount: { type: 'number', minimum: 0, example: 15.00 },
        total: { type: 'number', minimum: 0, example: 285.00 },
        payment: { type: 'string', nullable: true, example: '64a1b2c3d4e5f6a7b8c9d0e4' },
      },
    },
    InvoiceSendRequest: {
      type: 'object',
      required: ['payment'],
      properties: {
        payment: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e4' },
      },
    },
    Invoice: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e5' },
        number: { type: 'string', example: 'INV-2024-001' },
        customer: { $ref: '#/components/schemas/Customer' },
        issued: { type: 'string', format: 'date-time' },
        due: { type: 'string', format: 'date-time' },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/InvoiceItem' },
        },
        subtotal: { type: 'number', example: 300.00 },
        discount: { type: 'number', example: 15.00 },
        total: { type: 'number', example: 285.00 },
        merchant: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    // -----------------------------------------------------------------------
    // Payment
    // -----------------------------------------------------------------------
    PaymentCreateRequest: {
      type: 'object',
      required: ['invoice', 'amount'],
      properties: {
        invoice: { type: 'string', minLength: 24, maxLength: 24, example: '64a1b2c3d4e5f6a7b8c9d0e5' },
        amount: { type: 'number', minimum: 0.01, example: 285.00 },
        currency: { type: 'string', minLength: 3, maxLength: 3, default: 'USD', example: 'USD' },
        method: {
          type: 'string',
          enum: ['card', 'bank_transfer', 'cash', 'check'],
          default: 'card',
          example: 'card',
        },
        status: {
          type: 'string',
          enum: ['pending', 'completed', 'failed', 'cancelled'],
          default: 'pending',
          example: 'pending',
        },
      },
    },
    PaymentProcessRequest: {
      type: 'object',
      required: ['paymentMethodId'],
      properties: {
        paymentMethodId: { type: 'string', example: 'pm_1OqFCd2eZvKYlo2C4XXXXX' },
        type: {
          type: 'string',
          enum: ['card', 'bank_account'],
          default: 'card',
          example: 'card',
        },
      },
    },
    PaymentStatusUpdateRequest: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'completed', 'failed', 'cancelled'],
          example: 'completed',
        },
      },
    },
    Payment: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e4' },
        invoice: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e5' },
        amount: { type: 'number', example: 285.00 },
        currency: { type: 'string', example: 'USD' },
        method: { type: 'string', example: 'card' },
        status: { type: 'string', example: 'pending' },
        merchant: { type: 'string', example: '64a1b2c3d4e5f6a7b8c9d0e1' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
  // Common query-parameter schemas
  parameters: {
    limitParam: {
      in: 'query',
      name: 'limit',
      schema: { type: 'integer', default: 50, minimum: 1, maximum: 200 },
      description: 'Maximum number of records to return',
    },
    skipParam: {
      in: 'query',
      name: 'skip',
      schema: { type: 'integer', default: 0, minimum: 0 },
      description: 'Number of records to skip for pagination',
    },
    sortParam: {
      in: 'query',
      name: 'sort',
      schema: { type: 'string', default: '-createdAt' },
      description: 'Sort field and direction (prefix with `-` for descending)',
    },
    mongoIdParam: {
      in: 'path',
      name: 'id',
      required: true,
      schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
      description: 'MongoDB ObjectId',
    },
  },
  // Common response definitions
  responses: {
    UnauthorizedError: {
      description: 'Authentication token is missing or invalid',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: { success: false, message: 'Authentication required' },
        },
      },
    },
    NotFoundError: {
      description: 'Requested resource was not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: { success: false, message: 'Resource not found' },
        },
      },
    },
    ValidationError: {
      description: 'Request body or parameters failed validation',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
        },
      },
    },
    ServerError: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: { success: false, message: 'Internal server error' },
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// swagger-jsdoc options
// ---------------------------------------------------------------------------

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: apiInfo,
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3333}`,
        description: 'Local development server',
      },
      {
        url: 'https://api.invoiceapp.example.com',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Server health check' },
      { name: 'Authentication', description: 'User registration and login endpoints' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Items', description: 'Item / product catalogue' },
      { name: 'Invoices', description: 'Invoice creation and management' },
      { name: 'Payments', description: 'Payment processing and tracking' },
    ],
    components,
    // Apply bearer authentication globally to all secured endpoints
    security: [{ bearerAuth: [] }],
  },
  // Glob patterns pointing at the files that contain @swagger JSDoc blocks
  apis: [
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../routes/index.js'),
  ],
};

// Build spec once at startup
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ---------------------------------------------------------------------------
// Swagger UI options
// ---------------------------------------------------------------------------

const swaggerUiOptions = {
  // Persist auth token across page reloads
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
  customSiteTitle: 'Invoice App – API Docs',
};

module.exports = { swaggerSpec, swaggerUiOptions };
