# Invoice App Backend – Application Context

A comprehensive reference for product development covering architecture, features, APIs, authentication, security, data models, and packages.

---

## 1. Overview

**Invoice App Backend** is a multi-tenant REST API built with Node.js and Express. It allows small-business merchants to:

- Register and manage their own account (profile, currency, contact info)
- Maintain a catalogue of products/services (items)
- Manage their customer directory
- Create, store, and email invoices as PDFs
- Accept and track card payments via Stripe

Each merchant's data is fully isolated: all resources (customers, items, invoices, payments) are scoped to the authenticated merchant's ID, so one merchant can never see another merchant's data.

---

## 2. Architecture

```
server.js               Entry point, graceful shutdown, uncaught-exception handling
src/
  app.js                Express app factory (DB connect, middleware, routes, error handling)
  config/
    config.js           Centralised environment config + startup validation
    security.js         Helmet, CORS, rate-limit, compression, Morgan settings
    swagger.js          OpenAPI 3.0 spec built from JSDoc + swagger-ui-express setup
  routes/
    index.js            Route registration – /health, /api/*, legacy routes (no /api prefix)
  controllers/          Thin Express routers; delegate to services
  services/             Business logic (AuthService, CustomerService, ItemService,
                        InvoiceService, PaymentService)
  repositories/         Mongoose query layer (baseRepository + per-domain repos)
  middlewares/
    authenticate.js     JWT auth guard (authenticate, optionalAuthenticate, authenticateAdmin)
    validate.js         Joi schema validation middleware
    rateLimiter.js      Re-exports pre-built express-rate-limit instances
    errorHandler.js     Centralised error + 404 handlers; asyncHandler wrapper
  helpers/
    asyncHandler.js     Wraps async controllers to auto-propagate errors to Express
    responseHelper.js   sendSuccess / sendError / createSuccessResponse / createErrorResponse
  utils/
    authUtils.js        JWT generate/verify helpers, bcrypt hash/compare
    logger.js           Winston logger (console dev, file prod) + HTTP request logging
  validations/          Per-resource Joi schemas
  docs/
    API.md              Quick API reference
views/                  EJS templates for the payment portal static pages
attachments/            Runtime PDF output directory (invoice.pdf generated on demand)
controllers/ (root)     Legacy controllers (still in use via route registration)
models/ (root)          Legacy Mongoose models (User, Customer, Item, Invoice, Payment)
```

### Data flow
```
HTTP Request
  → Rate limiter (express-rate-limit)
  → Helmet / CORS / Compression / Morgan
  → Authenticate middleware (JWT verification, protected routes only)
  → Joi Validate middleware (routes with validation schemas)
  → Controller (router)
  → Service (business logic)
  → Repository (Mongoose queries)
  → MongoDB Atlas
  ← JSON response via responseHelper
```

---

## 3. Features

### 3.1 Authentication
| Feature | Detail |
|---|---|
| Registration | Creates merchant account, returns access + refresh token pair |
| Login | Email + password, returns token pair; brute-force protected |
| Token refresh | Issues a new access token from a valid refresh token (no re-login) |
| Logout (current) | Invalidates the current access token only |
| Logout all | Clears all stored tokens for the user (all devices) |
| Token verify | Validates a token and returns the associated user data |
| Get profile | Returns the authenticated merchant's public profile |
| Edit profile | Updates company, phone, address, base_currency |

### 3.2 Customer Management
| Feature | Detail |
|---|---|
| Create customer | Linked to the authenticated merchant |
| List all customers | Paginated (limit/skip/sort query params) |
| Get customer by ID | Ownership-checked |
| Update customer | Partial or full update |
| Delete customer | Permanent deletion |
| Customer statistics | Aggregated overview (total count, etc.) |

### 3.3 Item Catalogue
| Feature | Detail |
|---|---|
| Create item | Adds product/service with name, price, category, quantity |
| List all items | Paginated |
| Get item by ID | Ownership-checked |
| Update item | Partial or full update |
| Delete item | Permanent deletion |
| Search items | Full-text match on name, description, category |
| Filter by category | Returns items in a given category |

### 3.4 Invoice Management
| Feature | Detail |
|---|---|
| Create / Update invoice | Upsert by invoice number; validates customer ownership |
| List all invoices | Returns all invoices for the merchant |
| Invoice statistics | Totals, outstanding amounts, etc. |
| Send invoice by email | Generates PDF via `pdf-invoice`, emails to customer with payment link |

### 3.5 Payment Processing
| Feature | Detail |
|---|---|
| Create payment record | Linked to an invoice; defaults to `pending` status |
| List all payments | Paginated |
| Get payment by ID | Ownership-checked |
| Update payment status | Manual status change (pending / completed / failed / cancelled) |
| Process payment (Stripe) | Charges card via Stripe PaymentIntents API |
| Payment statistics | Total collected, pending, failed amounts |
| Filter by status | Returns payments matching a given status |

### 3.6 Health Check
- `GET /health` – Returns server status, environment, version, timestamp. No authentication required.

---

## 4. API Reference

**Base URL:** `http://localhost:3333` (dev) | `https://api.invoiceapp.example.com` (prod)  
**Interactive docs:** `GET /api-docs` (Swagger UI)

All protected endpoints require:
```
Authorization: Bearer <access_token>
```
or the legacy header `x-auth: <access_token>`.

### Authentication – `/api/user`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/user/register` | Public | Create merchant account |
| POST | `/api/user/login` | Public (rate-limited) | Login, receive token pair |
| POST | `/api/user/refresh` | Public | Refresh access token |
| POST | `/api/user/verify` | Public | Validate a token |
| GET | `/api/user/user` | Required | Get current user profile |
| POST | `/api/user/edit` | Required | Update profile |
| DELETE | `/api/user/logout` | Required | Logout current session |
| DELETE | `/api/user/logout-all` | Required | Logout all sessions |

### Customers – `/api/customer`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/customer/create` | Required | Create customer |
| GET | `/api/customer/all` | Required | List all customers |
| GET | `/api/customer/:id` | Required | Get customer by ID |
| PUT | `/api/customer/:id` | Required | Update customer |
| DELETE | `/api/customer/:id` | Required | Delete customer |
| GET | `/api/customer/statistics/overview` | Required | Customer stats |

### Items – `/api/item`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/item/create` | Required | Create item |
| GET | `/api/item/all` | Required | List all items |
| GET | `/api/item/search?q=<term>` | Required | Search items |
| GET | `/api/item/category/:category` | Required | Items by category |
| GET | `/api/item/:id` | Required | Get item by ID |
| PUT | `/api/item/:id` | Required | Update item |
| DELETE | `/api/item/:id` | Required | Delete item |

### Invoices – `/api/invoice`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/invoice/edit` | Required | Create or update invoice |
| GET | `/api/invoice/all` | Required | List all invoices |
| POST | `/api/invoice/send` | Required | Email invoice PDF to customer |
| GET | `/api/invoice/statistics` | Required | Invoice statistics |

### Payments – `/api/payment`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payment/create` | Required | Create payment record |
| GET | `/api/payment/all` | Required | List all payments |
| GET | `/api/payment/statistics/overview` | Required | Payment statistics |
| GET | `/api/payment/status/:status` | Required | Payments by status |
| GET | `/api/payment/:id` | Required | Get payment by ID |
| PUT | `/api/payment/:id/status` | Required | Update payment status |
| POST | `/api/payment/:id/process` | Required | Process payment via Stripe |

> **Legacy routes** (without the `/api` prefix) are also registered for backward compatibility, e.g. `POST /user/register`, `GET /customer/all`, etc.

### Pagination (list endpoints)
| Query param | Default | Description |
|---|---|---|
| `limit` | `50` | Max records to return (1–200) |
| `skip` | `0` | Records to skip |
| `sort` | `-createdAt` | Field + direction (prefix `-` for desc) |

### Uniform response envelope
```json
// Success
{ "success": true, "message": "Operation successful", "data": { … } }

// Error
{ "success": false, "message": "Description", "errors": [ … ] }
```

---

## 5. Authentication & Token Flow

```
POST /api/user/register  ──→  accessToken (15 min) + refreshToken (7 days)
POST /api/user/login     ──→  accessToken (15 min) + refreshToken (7 days)

Tokens returned:
  - Response body: { data: { accessToken, refreshToken } }
  - Response headers: x-auth, x-refresh-token (backward compat.)

Protected request:
  Authorization: Bearer <accessToken>
  or
  x-auth: <accessToken>

Token refresh (before access token expires):
  POST /api/user/refresh  body: { refreshToken }
  or header: x-refresh-token: <refreshToken>
  ──→ new accessToken returned in body + x-auth header

Header precedence (important):
  Protected routes read x-auth first, then Authorization: Bearer <accessToken>.
  If both are present with different values, x-auth is used.
```

**Token storage in MongoDB** – Both access and refresh tokens are stored inside the `User.tokens` array. This enables server-side invalidation (logout, logout-all) and prevents token reuse after logout.

**Account lock** – After 5 consecutive failed login attempts the account is locked for 2 hours (`lockUntil`). The lock is cleared automatically on the next successful login.

---

## 6. Security

| Layer | Implementation |
|---|---|
| HTTP security headers | `helmet` – CSP, HSTS (1 yr), X-Frame-Options, noSniff, XSS filter, Referrer-Policy, hidePoweredBy |
| CORS | Allowlist via `FRONTEND_URL` + `CORS_ORIGINS`; in non-production also allows `localhost` / `127.0.0.1` origins on any port; credentials allowed; pre-flight cached 10 min |
| Rate limiting (general) | 100 req / 15 min / IP on all `/api/*` routes via `express-rate-limit` |
| Rate limiting (login) | 5 attempts / 15 min / IP on `POST /api/user/login` |
| Password hashing | bcrypt, 12 salt rounds (configurable via `BCRYPT_SALT_ROUNDS`) |
| JWT access tokens | HS256, `JWT_SECRET`, expires in 15 min (configurable) |
| JWT refresh tokens | HS256, `JWT_REFRESH_SECRET` (separate secret), expires in 7 days |
| Auth headers | Protected routes accept `Authorization: Bearer <token>` and legacy `x-auth`; refresh accepts request-body token or `x-refresh-token` |
| Input validation | Joi schemas on all mutating endpoints, `abortEarly: false` |
| Error handling | Centralised handler; production mode returns generic messages (no stack traces leaked) |
| Token TTL cleanup | MongoDB TTL index on `tokens.expiresAt` – expired refresh tokens auto-removed |
| Sensitive data | `toJSON()` strips password and tokens array from all user objects |
| Proxy trust | `trust proxy: 1` enabled when `TRUST_PROXY=true` or `NODE_ENV=production` |
| X-Powered-By | Disabled (both via `app.disable` and Helmet's `hidePoweredBy`) |
| Swagger CSP | `/api-docs` uses a relaxed CSP (inline scripts/styles) scoped only to that path |

---

## 7. Data Models

### User (merchant)
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `name` | String | min 4 chars, required |
| `email` | String | unique, required |
| `password` | String | bcrypt hash, never returned in API responses |
| `company` | String | optional |
| `phone` | String | required |
| `address` | String | required |
| `base_currency` | String | e.g. `USD` |
| `tokens` | Array | `{ access: 'auth'|'refresh', token, createdAt, expiresAt }` |
| `lastLogin` | Date | Updated on each successful login |
| `loginAttempts` | Number | Reset after successful login |
| `lockUntil` | Date | Set to +2 h after 5 failed attempts |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### Customer
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `name` | String | 2–100 chars |
| `email` | String | |
| `phone` | String | 8–20 chars |
| `address` | String | 10–500 chars |
| `merchant` | ObjectId | Ref → User |

### Item
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `name` | String | 2–100 chars |
| `description` | String | optional, max 500 chars |
| `price` | Number | ≥ 0 |
| `category` | String | optional, 2–50 chars |
| `quantity` | Integer | ≥ 0, default 0 |
| `merchant` | ObjectId | Ref → User |

### Invoice
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `number` | String | unique, min 8 chars |
| `merchant` | ObjectId | Ref → User |
| `customer` | ObjectId | Ref → Customer |
| `issued` | Date | Issue date |
| `due` | Date | Due date |
| `items` | Array | `{ item: ObjectId, quantity, subtotal }` |
| `subtotal` | Number | Before discount |
| `discount` | Number | |
| `total` | Number | Final amount |

### Payment
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `invoice` | ObjectId | Ref → Invoice (1-to-1) |
| `amount` | Number | ≥ 0.01 |
| `currency` | String | 3-char code, default `USD` |
| `method` | Enum | `card` | `bank_transfer` | `cash` | `check` |
| `status` | Enum | `pending` | `completed` | `failed` | `cancelled` |
| `merchant` | ObjectId | Ref → User |
| `stripePaymentIntentId` | String | Set after Stripe processing |
| `processedAt` | Date | Set after Stripe processing |

---

## 8. Email & PDF Generation

When a merchant calls `POST /api/invoice/send`:

1. **PDF generation** – `pdf-invoice` library builds an invoice PDF from invoice + merchant + customer data and writes it to `attachments/invoice.pdf`.
2. **Email dispatch** – `nodemailer` sends the PDF as an attachment to the customer's email address. The email body contains a payment link: `<baseUrl>/payment/id/<paymentId>`.
3. The payment portal is served as an EJS-rendered HTML page from the `views/` directory.

**Required env vars:** `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SERVICE` (default: `gmail`), `EMAIL_FROM`.

---

## 9. Payment Processing (Stripe)

When `POST /api/payment/:id/process` is called:

1. Validates the payment record exists and is not already `completed`.
2. Creates a `stripe.paymentIntents.create` with the amount (converted to cents), currency, and provided `paymentMethodId`.
3. Confirms the intent immediately (`confirm: true`).
4. Stores `stripePaymentIntentId` and `processedAt` on the payment record.
5. Sets status to `completed` or `failed` based on Stripe's response.

**Required env var:** `STRIPE_SECRET_KEY`.

---

## 10. Logging

| Level | Used for |
|---|---|
| `error` | Exceptions, failed operations |
| `warn` | 404s, non-critical issues |
| `info` | Service-level operations (register, login, CRUD) |
| `http` | Every HTTP request/response (via Morgan + custom response-time middleware) |
| `debug` | Token verification, diagnostic details |

- **Development** – coloured console output via Winston + Morgan `dev` format.
- **Production** – Morgan `combined` format; Winston also writes to `logs/error.log` and `logs/combined.log` (file transport enabled when `NODE_ENV=production`).

---

## 11. Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `3333` | HTTP server port |
| `HOST` | No | `localhost` | Bind address |
| `NODE_ENV` | No | `development` | Environment mode |
| `MONGODB_URL` | **Yes** | – | MongoDB connection string |
| `JWT_SECRET` | **Yes** | – | HMAC secret for access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | – | HMAC secret for refresh tokens |
| `JWT_ACCESS_EXPIRATION` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | No | `7d` | Refresh token TTL |
| `BCRYPT_SALT_ROUNDS` | No | `12` | bcrypt work factor |
| `EMAIL_USER` | **Yes** | – | SMTP username |
| `EMAIL_PASS` | **Yes** | – | SMTP password / app password |
| `EMAIL_SERVICE` | No | `gmail` | Nodemailer service |
| `EMAIL_FROM` | No | `invoiceappserver@gmail.com` | Sender address |
| `STRIPE_SECRET_KEY` | No* | – | Stripe secret key (*required for payment processing) |
| `FRONTEND_URL` | No | `http://localhost:3000` | Primary CORS allowed origin |
| `CORS_ORIGINS` | No | – | Comma-separated extra CORS origins |
| `TRUST_PROXY` | No | auto in prod | Set `true` when behind reverse proxy |
| `LOG_LEVEL` | No | `info` | Winston log level |
| `API_RATE_LIMIT_WINDOW_MS` | No | `900000` | API rate-limit window (ms) |
| `API_RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | No | `900000` | Login rate-limit window (ms) |
| `LOGIN_RATE_LIMIT_MAX_REQUESTS` | No | `5` | Max login attempts per window |

---

## 12. NPM Packages

### Production Dependencies
| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.21.2 | HTTP server & routing framework |
| `mongoose` | ^8.15.1 | MongoDB ODM |
| `dotenv` | ^17.4.2 | `.env` file loader |
| `bcrypt` | ^5.1.1 | Password hashing |
| `jsonwebtoken` | ^9.0.2 | JWT sign & verify |
| `joi` | ^18.2.1 | Request body validation |
| `helmet` | ^8.1.0 | HTTP security headers |
| `cors` | ^2.8.6 | CORS middleware |
| `express-rate-limit` | ^8.5.1 | Rate limiting |
| `compression` | ^1.8.1 | gzip/deflate response compression |
| `morgan` | ^1.10.1 | HTTP request logging |
| `winston` | ^3.19.0 | Structured application logging |
| `swagger-jsdoc` | ^6.2.8 | OpenAPI spec from JSDoc annotations |
| `swagger-ui-express` | ^5.0.1 | Serves Swagger UI at `/api-docs` |
| `stripe` | ^18.1.1 | Stripe payment processing SDK |
| `pdf-invoice` | ^1.0.2 | PDF invoice generation |
| `lodash` | ^4.17.21 | Utility functions |

### Dev Dependencies
| Package | Version | Purpose |
|---|---|---|
| `nodemon` | ^3.1.10 | Auto-restart on file change |
| `ejs` | ^3.1.10 | HTML template engine (payment portal views) |
| `nodemailer` | ^6.10.1 | SMTP email sending |

---

## 13. Scripts

| Command | Description |
|---|---|
| `npm start` | Start production server (`node server.js`) |
| `npm run dev` | Start development server with auto-reload (`nodemon server.js`) |

---

## 14. API Documentation (Swagger)

- Available at: `GET /api-docs`
- Spec: OpenAPI 3.0.3, built at startup from JSDoc `@swagger` blocks in `src/controllers/*.js` and `src/routes/index.js`
- Auth: Click **Authorize 🔓**, enter the `accessToken` from login (Swagger prepends `Bearer` automatically)
- Features: persistent auth, request duration display, filtering, try-it-out enabled

---

## 15. Accessibility & Frontend Notes

This is a **pure REST API** – it has no frontend of its own. The companion frontend is [invoice-app-client](https://github.com/jKh98/invoice-app-client).

- All responses are JSON (except the EJS-rendered payment portal pages).
- Tokens are exposed in both response body and response headers (`x-auth`, `x-refresh-token`) for flexible client integration.
- CORS is configurable to support any frontend origin via `FRONTEND_URL` / `CORS_ORIGINS`.
- CORS allows auth-related custom headers (`x-auth`, `x-refresh-token`) in preflight for browser clients.
- `credentials: true` is set in CORS options, so cookie-based auth from a browser is supported.
- Pagination on all list endpoints (limit/skip/sort) keeps payloads small for mobile clients.
- The Swagger UI (`/api-docs`) can be used directly by frontend developers to explore and test endpoints without a separate tool.

---

## 16. Known Limitations / Areas for Future Development

- No role-based access control (RBAC) – `authenticateAdmin` is currently identical to `authenticate` (placeholder for future admin roles).
- No unit or integration test suite is wired up (`npm test` exits with an error).
- Invoice `send` endpoint generates a PDF to a single shared path (`attachments/invoice.pdf`), which creates a race condition under concurrent requests.
- Payment portal pages (`views/`) are served as static EJS templates but there is no dedicated route file documenting their URL structure in Swagger.
- No file-upload endpoint despite `upload` config (max 5 MB, allowed types: JPEG, PNG, GIF, PDF) defined in `config.js`.
- Stripe webhook handling is not implemented; payment status updates must be triggered manually.
- User schema defines email indexing twice (`unique: true` and explicit `schema.index({ email: 1 })`), causing a duplicate-index warning at runtime.
- Refresh-token TTL is implemented with a document-level MongoDB TTL index on `tokens.expiresAt`, which can delete whole user documents when a token expires and should be redesigned.
