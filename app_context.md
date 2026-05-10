# Invoice App Backend - Application Context

A current reference for the backend's runtime architecture, routes, security model, data shapes, and dependencies.

---

## 1. Overview

**Invoice App Backend** is a multi-tenant Node.js and Express REST API for small-business merchants. It supports:

- Merchant registration, login, profile updates, and session logout
- Customer, item, invoice, and payment management scoped to the authenticated merchant
- Invoice PDF generation and email delivery
- Stripe payment processing and Stripe webhook reconciliation
- Reporting and analytics for invoices, revenue, payments, and customers

Merchant data is isolated by ownership checks in the service and repository layers, so one merchant cannot read another merchant's records.

---

## 2. Architecture

```
server.js               Entry point, graceful shutdown, uncaught exception handling
src/
  app.js                Express app bootstrap (DB connect, middleware, routes, error handling)
  config/
    config.js           Environment config, validation, auth and security settings
    security.js         Helmet, CORS, rate limiting, compression, Morgan settings
    swagger.js          OpenAPI 3.0 spec built from JSDoc + swagger-ui-express
    storage.js          Attachment file helpers and temporary PDF cleanup helpers
  routes/
    index.js            Route registration for /health, /api/*, and legacy routes
    reporting.routes.js  Reporting route mount
    stripeWebhook.routes.js  Stripe webhook route mount
  controllers/          Thin Express routers that delegate to services
  services/             Business logic for auth, customers, items, invoices, payments, reporting, webhooks
  repositories/         Mongoose query layer plus base repository helpers
  middlewares/
    authenticate.js     Access-token auth, optional auth, and admin alias
    authorization.js    Role and permission guards
    validate.js         Joi validation middleware
    rateLimiter.js      Re-exports configured rate limiters
    errorHandler.js     Centralised 404 and error handling
    requestContext.js   Correlation ID and request timing context
  helpers/
    asyncHandler.js     Async route wrapper
    responseHelper.js   Success and error response helpers
  utils/
    authUtils.js        JWT helpers, bcrypt helpers, token extraction
    logger.js           Winston logging
  validations/          Joi schemas by resource
  auth/
    rbac.js             Role and permission checks
  docs/
    API.md              Human-readable API reference
views/                  EJS payment portal pages
attachments/            Generated invoice PDFs and cleanup targets
models/                 Current Mongoose models
controllers/            Legacy root controllers still present in the repo
```

### Data flow

```
HTTP request
  -> Rate limiter
  -> Helmet / CORS / Compression / Morgan
  -> requestContext
  -> Authentication middleware for protected routes
  -> Authorization middleware where permissions are required
  -> Joi validation middleware
  -> Controller
  -> Service
  -> Repository
  -> MongoDB, Stripe, Nodemailer, or pdf-invoice
  <- JSON response via responseHelper
```

---

## 3. Features

### 3.1 Authentication
| Feature | Detail |
|---|---|
| Registration | Creates a merchant account and returns access and refresh tokens |
| Login | Email and password login with brute-force protection |
| Token refresh | Issues a new access token from a valid refresh token |
| Logout current | Revokes the current access token and refresh token session when present |
| Logout all | Removes all stored tokens for the user and revokes refresh tokens |
| Token verify | Validates a token and returns the associated user payload |
| Get profile | Returns the authenticated merchant profile |
| Edit profile | Updates company, phone, address, and base_currency |
| Cookie auth support | Access and refresh tokens can be stored in httpOnly cookies for browser clients |

### 3.2 Customer Management
| Feature | Detail |
|---|---|
| Create customer | Linked to the authenticated merchant |
| List all customers | Paginated with limit, skip, and sort query params |
| Get customer by ID | Ownership checked |
| Update customer | Partial or full update |
| Delete customer | Permanent deletion |
| Customer statistics | Aggregated overview |

### 3.3 Item Catalogue
| Feature | Detail |
|---|---|
| Create item | Adds a product or service with name and price |
| List all items | Paginated |
| Get item by ID | Ownership checked |
| Update item | Partial or full update |
| Delete item | Permanent deletion |
| Search items | Search endpoint by query string |
| Filter by category | Returns items in a category |

### 3.4 Invoice Management
| Feature | Detail |
|---|---|
| Create or update invoice | Upsert by invoice number and validate customer ownership |
| List all invoices | Returns all invoices for the merchant |
| Invoice statistics | Totals and outstanding amounts |
| Send invoice by email | Generates a PDF, sends email, and includes a payment link |

### 3.5 Payment Processing
| Feature | Detail |
|---|---|
| Create payment record | Linked to an invoice and usually starts in pending status |
| List all payments | Paginated |
| Get payment by ID | Ownership checked |
| Update payment status | Manual status change |
| Process payment | Charges via Stripe PaymentIntents |
| Payment statistics | Aggregated totals by status |
| Filter by status | Returns payments matching a status |
| Webhook reconciliation | Stripe webhooks update completed, failed, or refunded states |

### 3.6 Reporting
| Feature | Detail |
|---|---|
| Invoice aging | Aging buckets for invoices |
| Revenue | Revenue analytics |
| Payments | Payment status analytics |
| Top customers | Customer ranking by activity or value |
| Monthly trends | Time series trend data |
| Outstanding balances | Open balances summary |

### 3.7 Health Check
- `GET /health` returns server status, environment, version, and timestamp without authentication.

---

## 4. API Reference

**Base URL:** `http://localhost:3333` in development  
**Interactive docs:** `GET /api-docs`

Protected endpoints accept the access token through `x-auth`, `Authorization: Bearer <token>`, or browser cookies when cookie auth is enabled.

### Authentication - `/api/user`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/user/register` | Public | Create merchant account |
| POST | `/api/user/login` | Public, rate-limited | Login and receive token pair |
| POST | `/api/user/refresh` | Public | Refresh access token |
| POST | `/api/user/verify` | Public | Validate a token |
| GET | `/api/user/user` | Required | Get current user profile |
| POST | `/api/user/edit` | Required | Update profile |
| DELETE | `/api/user/logout` | Required | Logout current session |
| DELETE | `/api/user/logout-all` | Required | Logout all sessions |

### Customers - `/api/customer`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/customer/create` | Required | Create customer |
| GET | `/api/customer/all` | Required | List customers |
| GET | `/api/customer/:id` | Required | Get customer by ID |
| PUT | `/api/customer/:id` | Required | Update customer |
| DELETE | `/api/customer/:id` | Required | Delete customer |
| GET | `/api/customer/statistics/overview` | Required | Customer stats |

### Items - `/api/item`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/item/create` | Required | Create item |
| GET | `/api/item/all` | Required | List items |
| GET | `/api/item/search?q=<term>` | Required | Search items |
| GET | `/api/item/category/:category` | Required | Items by category |
| GET | `/api/item/:id` | Required | Get item by ID |
| PUT | `/api/item/:id` | Required | Update item |
| DELETE | `/api/item/:id` | Required | Delete item |

### Invoices - `/api/invoice`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/invoice/edit` | Required | Create or update invoice |
| GET | `/api/invoice/all` | Required | List invoices |
| POST | `/api/invoice/send` | Required | Email invoice PDF to customer |
| GET | `/api/invoice/statistics` | Required | Invoice statistics |

### Payments - `/api/payment`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payment/create` | Required | Create payment record |
| GET | `/api/payment/all` | Required | List payments |
| GET | `/api/payment/statistics/overview` | Required | Payment statistics |
| GET | `/api/payment/status/:status` | Required | Payments by status |
| GET | `/api/payment/:id` | Required | Get payment by ID |
| PUT | `/api/payment/:id/status` | Required | Update payment status |
| POST | `/api/payment/:id/process` | Required | Process payment via Stripe |

### Reporting - `/api/reports`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/reports/invoice-aging` | Required | Invoice aging analytics |
| GET | `/api/reports/revenue` | Required | Revenue analytics |
| GET | `/api/reports/payments` | Required | Payment analytics |
| GET | `/api/reports/top-customers` | Required | Top customers |
| GET | `/api/reports/monthly-trends` | Required | Monthly trends |
| GET | `/api/reports/outstanding-balances` | Required | Outstanding balances |

### Webhooks - `/api/webhooks`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/webhooks/stripe` | Stripe signature required | Process Stripe webhook events |

> Legacy routes without `/api` are also registered for backward compatibility, including `/user/*`, `/customer/*`, `/item/*`, `/invoice/*`, `/payment/*`, `/reports/*`, and `/webhooks/stripe`.

### Pagination
| Query param | Default | Description |
|---|---|---|
| `limit` | `50` | Maximum records to return |
| `skip` | `0` | Records to skip |
| `sort` | `-createdAt` | Sort field and direction |

### Uniform response envelope

Responses include `success`, `message`, `data` when present, `statusCode`, and `meta` with a timestamp and correlation ID. Error responses also include `errors` when validation or downstream failures provide details.

---

## 5. Authentication and Token Flow

```
POST /api/user/register -> accessToken + refreshToken
POST /api/user/login    -> accessToken + refreshToken
POST /api/user/refresh  -> new accessToken
```

Tokens are returned in the JSON body and also written to `x-auth` and `x-refresh-token` headers. The controller also sets `accessToken` and `refreshToken` httpOnly cookies for browser clients when cookie auth is enabled.

Token extraction order in the active middleware is:

1. `accessToken` cookie when cookie or hybrid auth is enabled
2. `x-auth` header when header or hybrid auth is enabled
3. `Authorization: Bearer <token>` header

Refresh token extraction order is:

1. `refreshToken` cookie when cookie or hybrid auth is enabled
2. Request body `refreshToken`
3. `x-refresh-token` header

Access tokens are persisted in the `User.tokens` array for backward-compatible auth checks. Refresh tokens are stored in the dedicated `refresh_tokens` collection and are also mirrored into the user document during the migration period. Logout revokes the current refresh token when available, and logout-all revokes all refresh tokens for the user.

The default inactivity timeout is 30 minutes. After that, authenticated requests are rejected even if the JWT is still valid.

Login lockout is enforced after 5 failed attempts and lasts 2 hours. Successful login resets the counter and clears the lock.

---

## 6. Security

| Layer | Implementation |
|---|---|
| HTTP security headers | Helmet with CSP, HSTS, frameguard, noSniff, referrer policy, hidePoweredBy |
| CORS | Allowlist from `FRONTEND_URL` and `CORS_ORIGINS`; localhost origins are allowed in development; credentials are enabled; custom auth headers are allowed |
| Rate limiting | 100 requests per 15 minutes for `/api/*`, 5 login attempts per 15 minutes, and a user-scoped limiter for authenticated requests |
| Password hashing | bcrypt with 12 salt rounds by default |
| JWT access tokens | HS256 signed with `JWT_SECRET` |
| JWT refresh tokens | HS256 signed with `JWT_REFRESH_SECRET` |
| Auth strategy | `header`, `cookie`, or `hybrid` via `AUTH_STRATEGY` |
| Session timeout | Controlled by `AUTH_INACTIVITY_TIMEOUT_MS` |
| Input validation | Joi schemas on mutating endpoints |
| Error handling | Centralised error handler with generic production fallback |
| Proxy trust | Controlled by `TRUST_PROXY` and production defaults |
| X-Powered-By | Disabled in Express and Helmet |
| Swagger CSP | Relaxed only for `/api-docs` |
| Webhook verification | Stripe webhook signatures are required on `/api/webhooks/stripe` |
| Refresh token cleanup | Separate TTL-backed `refresh_tokens` collection plus scheduled cleanup jobs |

The config file also defines upload limits, but no active upload route exists yet.

---

## 7. Data Models

### User
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `name` | String | Required, min length 4 |
| `email` | String | Unique, required |
| `password` | String | Hashed with bcrypt |
| `company` | String | Optional |
| `phone` | String | Required |
| `address` | String | Required |
| `base_currency` | String | Required |
| `tokens` | Array | Stores auth and refresh token entries |
| `role` | String | owner, admin, accountant, staff, or viewer |
| `permissions` | Array | Fine-grained permission strings |
| `organizationId` | ObjectId | Optional tenant grouping |
| `lastLogin` | Date | Updated on login |
| `lastActivityAt` | Date | Updated on authenticated requests |
| `lastLoginIp` | String | Last seen IP |
| `lastUserAgent` | String | Last seen user agent |
| `loginAttempts` | Number | Failed login counter |
| `lockUntil` | Date | Account lockout timestamp |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### Customer
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `name` | String | Required |
| `company` | String | Optional |
| `email` | String | Unique, required |
| `phone` | String | Required |
| `mobile` | String | Optional |
| `addresses` | Array | Address strings |
| `merchant` | ObjectId | Ref to User |
| `number_invoices` | Number | Counter used for reporting |
| `total` | Number | Aggregate total used for reporting |

### Item
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `name` | String | Unique, required |
| `price` | Number | Required |
| `description` | String | Optional |
| `merchant` | ObjectId | Ref to User |

### Invoice
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `number` | String | Unique, required |
| `merchant` | ObjectId | Ref to User |
| `customer` | ObjectId | Ref to Customer |
| `issued` | Date | Required |
| `due` | Date | Required |
| `items` | Array | Invoice line items with item, quantity, subtotal |
| `subtotal` | Number | Required |
| `discount` | Number | Required |
| `total` | Number | Required |
| `payment` | ObjectId | Optional ref to Payment |

### Payment
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `merchant` | ObjectId | Ref to User |
| `invoice` | ObjectId | Unique ref to Invoice |
| `status` | String | pending, completed, failed, cancelled, refunded in webhook flow |
| `amount` | Number | Optional input amount |
| `currency` | String | Defaults to `usd` |
| `method` | String | Defaults to `card` |
| `paid_on` | Date | Payment timestamp |
| `amount_paid` | Number | Required in the schema |
| `amount_due` | Number | Required in the schema |
| `stripePaymentIntentId` | String | Stripe intent reference |
| `lastWebhookEventId` | String | Last processed Stripe event |
| `processedAt` | Date | Processing timestamp |
| `refundedAt` | Date | Refund timestamp |

### RefreshToken
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref to User |
| `token` | String | Unique refresh token |
| `expiresAt` | Date | TTL expiration |
| `revoked` | Boolean | Revocation flag |
| `deviceInfo` | String | Optional session metadata |
| `ipAddress` | String | Optional session metadata |
| `fingerprint` | String | Optional session metadata |
| `lastUsedAt` | Date | Updated on refresh |

### ProcessedWebhookEvent
| Field | Type | Notes |
|---|---|---|
| `eventId` | String | Unique Stripe event ID |
| `type` | String | Stripe event type |
| `processedAt` | Date | TTL-managed cleanup timestamp |
| `payload` | Mixed | Minimal stored payload |

---

## 8. Email and PDF Generation

When a merchant calls `POST /api/invoice/send`:

1. `pdf-invoice` renders the invoice into a PDF and writes it to a unique file under `attachments/`.
2. `nodemailer` sends that PDF to the customer's email address.
3. The email body includes a payment link in the legacy portal format: `<baseUrl>/payment/id/<paymentId>`.
4. The temporary PDF is deleted after the email is sent, and stale PDFs are also cleaned up by a scheduled job.

Required environment variables: `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SERVICE`, and `EMAIL_FROM`.

---

## 9. Payment Processing (Stripe)

When `POST /api/payment/:id/process` is called:

1. The payment is validated and loaded for the authenticated merchant.
2. A Stripe PaymentIntent is created and confirmed.
3. The payment record is updated with Stripe identifiers and processing timestamps.
4. The payment status is set based on the Stripe result.
5. Stripe webhooks can later reconcile succeeded, failed, or refunded events.

Required environment variables: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for webhook verification.

---

## 10. Logging

| Level | Used for |
|---|---|
| `error` | Exceptions and failed operations |
| `warn` | 404s and suspicious or non-critical issues |
| `info` | Service-level operations and startup events |
| `http` | HTTP request logging through Morgan |
| `debug` | Diagnostic details |

The app uses Morgan for request logs and Winston for application logging. Request context also carries correlation IDs into the response envelope.

---

## 11. Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `3333` | HTTP server port |
| `HOST` | No | `localhost` | Bind address |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGODB_URL` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Access token secret |
| `JWT_REFRESH_SECRET` | Yes | - | Refresh token secret |
| `JWT_ACCESS_EXPIRATION` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | No | `7d` | Refresh token TTL |
| `BCRYPT_SALT_ROUNDS` | No | `12` | bcrypt work factor |
| `EMAIL_USER` | Yes | - | SMTP username |
| `EMAIL_PASS` | Yes | - | SMTP password or app password |
| `EMAIL_SERVICE` | No | `gmail` | Nodemailer service |
| `EMAIL_FROM` | No | `invoiceappserver@gmail.com` | Sender address |
| `STRIPE_SECRET_KEY` | Yes for payments | - | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes for webhooks | - | Stripe webhook signature secret |
| `FRONTEND_URL` | No | `http://localhost:3000` | Primary CORS origin |
| `CORS_ORIGINS` | No | - | Comma-separated extra CORS origins |
| `TRUST_PROXY` | No | `false` | Reverse proxy trust flag |
| `AUTH_STRATEGY` | No | `hybrid` | `header`, `cookie`, or `hybrid` |
| `AUTH_INACTIVITY_TIMEOUT_MS` | No | `1800000` | Session inactivity timeout |
| `COOKIE_SECURE` | No | `false` | Secure cookie flag |
| `COOKIE_SAME_SITE` | No | `lax` | Cookie same-site policy |
| `COOKIE_DOMAIN` | No | - | Cookie domain |
| `LOG_LEVEL` | No | `info` | Winston log level |
| `API_RATE_LIMIT_WINDOW_MS` | No | `900000` | General API rate window |
| `API_RATE_LIMIT_MAX_REQUESTS` | No | `100` | General API max requests |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | No | `900000` | Login rate window |
| `LOGIN_RATE_LIMIT_MAX_REQUESTS` | No | `5` | Login max requests |
| `USER_RATE_LIMIT_MAX_REQUESTS` | No | `60` | Per-user limiter max requests |

---

## 12. NPM Packages

### Production Dependencies
| Package | Version | Purpose |
|---|---|---|
| `express` | `^4.21.2` | HTTP server and routing |
| `mongoose` | `^8.15.1` | MongoDB ODM |
| `dotenv` | `^17.4.2` | Environment variable loading |
| `bcrypt` | `^5.1.1` | Password hashing |
| `jsonwebtoken` | `^9.0.2` | JWT sign and verify |
| `joi` | `^18.2.1` | Request validation |
| `helmet` | `^8.1.0` | HTTP security headers |
| `cors` | `^2.8.6` | CORS middleware |
| `express-rate-limit` | `^8.5.1` | Rate limiting |
| `compression` | `^1.8.1` | Response compression |
| `morgan` | `^1.10.1` | HTTP request logging |
| `winston` | `^3.19.0` | Application logging |
| `swagger-jsdoc` | `^6.2.8` | OpenAPI generation from JSDoc |
| `swagger-ui-express` | `^5.0.1` | Swagger UI |
| `stripe` | `^18.1.1` | Stripe SDK |
| `pdf-invoice` | `^1.0.2` | PDF invoice generation |
| `lodash` | `^4.17.21` | Utility helpers |
| `cookie-parser` | `^1.4.7` | Cookie parsing for browser auth |
| `node-cron` | `^3.0.3` | Scheduled cleanup jobs |
| `nodemailer` | `^6.10.1` | SMTP email delivery |

### Dev Dependencies
| Package | Version | Purpose |
|---|---|---|
| `ejs` | `^3.1.10` | Payment portal templates |
| `jest` | `^29.7.0` | Test runner |
| `mongodb-memory-server` | `^10.4.3` | In-memory MongoDB for tests |
| `nodemon` | `^3.1.10` | Development auto-reload |
| `supertest` | `^7.2.2` | HTTP endpoint testing |

---

## 13. Scripts

| Command | Description |
|---|---|
| `npm start` | Start the server with `node server.js` |
| `npm run dev` | Start the server with `nodemon server.js` |
| `npm run seed:dummy` | Seed dummy data via `scripts/seedDummyData.js 30` |
| `npm test` | Run Jest in-band |
| `npm run test:watch` | Run Jest in watch mode |

---

## 14. API Documentation (Swagger)

- Available at `GET /api-docs`
- Generated from JSDoc annotations in `src/controllers/*.js`, `src/routes/*.js`, and related route modules
- Uses OpenAPI 3.0.3 through `swagger-jsdoc` and `swagger-ui-express`
- Accepts the JWT access token via the Swagger Authorize button

---

## 15. Accessibility and Frontend Notes

This is a JSON-first REST API. It does not ship a full frontend application of its own, but it does serve EJS-based payment portal pages from `views/`.

- All core API responses are JSON.
- Token transport supports headers and browser cookies.
- CORS is configurable through environment variables.
- Auth-related custom headers are explicitly allowed in CORS preflight.
- The Swagger UI can be used directly for manual testing and integration checks.

---

## 16. Known Limitations and Future Work

- The upload configuration exists, but there is no active upload route yet.
- Some legacy root controllers and models remain in the repository for compatibility and historical reference.
- The API docs and runtime route surface should continue to be kept in sync as the codebase evolves.
- Stripe webhook processing exists, but any new event types still need explicit handler logic before they affect business state.

