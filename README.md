# Invoice App Backend

This is a Node/Express JS back-end app for issuing invoices by merchants of small businesses. The app handles registration for merchants and supports adding items and customers. Once there are items and customers, merchants can choose to generate invoices to save or send as email. Emails include a pdf of the invoice with a payment url which opens a payment portal. You can find front-end client for this app on [invoice-app-client](https://github.com/jKh98/invoice-app-client).

## Features

### Authentication System
- **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- **Password Security**: Bcrypt hashing with configurable salt rounds (default: 12)
- **Token Expiration**: Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Rate Limiting**: Login attempts limited to 5 per 15 minutes to prevent brute force
- **Account Locking**: Accounts locked for 2 hours after 5 failed login attempts
- **Multi-Device Support**: Users can be logged in on multiple devices
- **Logout All**: Ability to logout from all devices/sessions
- **Token Refresh**: Secure token renewal without re-authentication
- **Flexible Token Extraction**: Supports both `x-auth` header and `Authorization: Bearer` header

### Security Features
- Environment-based configuration for secrets
- Centralized error handling with consistent response format
- Input validation using Joi schemas
- MongoDB TTL indexes for automatic token cleanup
- CORS and security headers support

## Usage

* Clone or download repository
* Go into the main app directory
* Install dependencies by running `npm install`
* Configure environment variables in `.env` file
* Run the application using `npm run dev` or `npm start`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3333
MONGODB_URL=mongodb+srv://...

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Password Hashing
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX_REQUESTS=5

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Payment Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
```

## API Endpoints

### Authentication Routes

#### Register User
```http
POST /user/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "company": "ABC Corp",
  "phone": "+1234567890",
  "address": "123 Main St",
  "base_currency": "USD"
}
```

#### Login
```http
POST /user/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Refresh Token
```http
POST /user/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

#### Logout (Current Session)
```http
DELETE /user/logout
Authorization: Bearer your_access_token
```

#### Logout All Sessions
```http
DELETE /user/logout-all
Authorization: Bearer your_access_token
```

#### Verify Token
```http
POST /user/verify
Authorization: Bearer your_access_token
```

#### Get User Profile
```http
GET /user/user
Authorization: Bearer your_access_token
```

#### Update Profile
```http
POST /user/edit
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "company": "Updated Corp",
  "phone": "+1987654321",
  "address": "456 New St",
  "base_currency": "EUR"
}
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## Dependencies

* [Express JS](https://github.com/expressjs/express) for routing http requests
* [Nodemon](https://github.com/remy/nodemon) for automatically restarting server after editing
* [Mongoose](https://github.com/Automattic/mongoose) for modeling data and connecting to database
* [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) for generating and comparing password hashes
* [JsonWebToken](https://github.com/auth0/node-jsonwebtoken) for validating user requests with tokens
* [Joi](https://github.com/hapijs/joi) for input validation
* [Express Rate Limit](https://github.com/nfriedly/express-rate-limit) for rate limiting
* [NodeMailer](https://github.com/nodemailer/nodemailer) for sending invoice emails to customers
* [Stripe](https://github.com/stripe/stripe-node) for handling secure payments
* [node-pdf-invoice](https://github.com/Astrocoders/node-pdf-invoice) for generating pdf invoices from json
* [Lodash](https://github.com/lodash/lodash) for utility functions

## Project Structure

```
├── server.js                 # Main entry point
├── controllers/              # Route controllers
│   ├── userController.js
│   ├── customerController.js
│   ├── itemController.js
│   ├── invoiceController.js
│   └── paymentController.js
├── models/                   # Mongoose schemas
│   ├── user.js
│   ├── customer.js
│   ├── item.js
│   ├── invoice.js
│   └── payment.js
├── src/
│   ├── middlewares/          # Custom middleware
│   │   ├── authenticate.js
│   │   ├── validate.js
│   │   └── rateLimiter.js
│   ├── services/             # Business logic services
│   │   └── authService.js
│   ├── utils/                # Utility functions
│   │   └── authUtils.js
│   └── validations/          # Joi validation schemas
│       ├── userValidations.js
│       ├── customerValidations.js
│       ├── itemValidations.js
│       ├── invoiceValidations.js
│       └── paymentValidations.js
├── db/                       # Database configuration
│   └── db.js
├── views/                    # Static files for payments
├── middlewares/              # Legacy middleware (deprecated)
└── node_modules/
```

## Security Best Practices

1. **Password Security**: Passwords are hashed using bcrypt with 12 salt rounds
2. **JWT Tokens**: Separate secrets for access and refresh tokens
3. **Token Expiration**: Short-lived access tokens (15 minutes) with longer refresh tokens (7 days)
4. **Rate Limiting**: Login attempts limited to prevent brute force attacks
5. **Account Locking**: Automatic account locking after failed attempts
6. **Environment Variables**: All secrets stored in environment variables
7. **Input Validation**: All inputs validated using Joi schemas
8. **Error Handling**: Centralized error handling without exposing sensitive information
9. **Token Cleanup**: Automatic cleanup of expired tokens using MongoDB TTL indexes

## Development

### Available Scripts
- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests (if implemented)

### Code Style
- Uses CommonJS modules (`require`/`module.exports`)
- Async/await for asynchronous operations
- Consistent error response format
- Comprehensive comments for maintainability
- Modern Mongoose 8.x compatible syntax



