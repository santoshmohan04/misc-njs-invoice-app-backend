# Invoice Management API Documentation

## Overview
This API provides comprehensive invoice management functionality including user authentication, customer management, item catalog, invoice creation, and payment processing.

## Architecture
The API follows a modern layered architecture:
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Repositories**: Handle database operations
- **Models**: Define data schemas
- **Middlewares**: Handle authentication, validation, rate limiting

## Base URL
```
http://localhost:3333
```

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```
Or in custom headers for backward compatibility:
```
x-auth: <your_jwt_token>
```

## Response Format
All responses follow a consistent format:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": { ... } | null,
  "statusCode": 200
}
```

## Error Handling
Errors are returned with appropriate HTTP status codes and detailed messages:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "statusCode": 400
}
```

## Health Check
```
GET /health
```
Returns server health status and basic information.

## API Endpoints

### Authentication
- `POST /user/register` - Register new user
- `POST /user/login` - User login
- `POST /user/refresh` - Refresh access token
- `POST /user/edit` - Update user profile
- `DELETE /user/logout` - Logout single session
- `DELETE /user/logout-all` - Logout all sessions
- `GET /user/user` - Get user profile
- `POST /user/verify` - Verify token

### Customers
- `POST /customer/create` - Create customer
- `GET /customer/all` - Get all customers
- `GET /customer/:id` - Get customer by ID
- `PUT /customer/:id` - Update customer
- `DELETE /customer/:id` - Delete customer
- `GET /customer/statistics/overview` - Get customer statistics

### Items
- `POST /item/create` - Create item
- `GET /item/all` - Get all items
- `GET /item/:id` - Get item by ID
- `PUT /item/:id` - Update item
- `DELETE /item/:id` - Delete item
- `GET /item/search?q=searchTerm` - Search items
- `GET /item/category/:category` - Get items by category

### Invoices
- `POST /invoice/edit` - Create/update invoice
- `GET /invoice/all` - Get all invoices
- `POST /invoice/send` - Send invoice via email
- `GET /invoice/statistics` - Get invoice statistics

### Payments
- `POST /payment/create` - Create payment
- `GET /payment/all` - Get all payments
- `GET /payment/:id` - Get payment by ID
- `PUT /payment/:id/status` - Update payment status
- `POST /payment/:id/process` - Process payment with Stripe
- `GET /payment/statistics/overview` - Get payment statistics
- `GET /payment/status/:status` - Get payments by status

## Rate Limiting
- API routes are rate limited to 100 requests per 15 minutes per IP
- Login attempts are limited to 5 per 15 minutes per IP

## Data Validation
All endpoints use Joi validation schemas to ensure data integrity and provide meaningful error messages.

## File Upload
- Maximum file size: 5MB
- Supported formats: JPEG, PNG, GIF, PDF

## Environment Variables
Required environment variables:
- `MONGODB_URL` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `EMAIL_USER` - Email service username
- `EMAIL_PASS` - Email service password
- `STRIPE_SECRET_KEY` - Stripe secret key (for payments)

## Backward Compatibility
The API maintains backward compatibility with existing frontend integrations by supporting both new `/api/*` routes and legacy routes without the `/api` prefix.

## Production Ready Features
- Centralized error handling
- Request logging
- Graceful shutdown
- Environment-based configuration
- Input validation and sanitization
- Security headers
- CORS support (if needed)