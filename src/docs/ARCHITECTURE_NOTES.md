# Architecture Notes

## New Components
- `models/refreshToken.js`: secure refresh-session persistence and revocation.
- `models/auditLog.js`: append-only audit ledger.
- `models/processedWebhookEvent.js`: idempotency for Stripe webhooks.
- `src/auth/rbac.js`: role hierarchy and permission inference.
- `src/middlewares/authorization.js`: `authorizeRoles()` and `authorizePermissions()`.
- `src/contracts/*`: reusable response and DTO contracts.
- `src/errors/*`: custom error taxonomy.
- `src/jobs/cleanupJobs.js`: recurring cleanup architecture.

## Backward Compatibility Controls
- Auth middleware still validates access tokens against persisted token list.
- Existing service/controller signatures are retained where possible.
- Route aliases (`/api/*` and legacy `/`) preserved.

## Observability
- `x-correlation-id` injected on every request.
- Request completion timing logged with structured metadata.
- TODO: Add Sentry SDK integration hook in error middleware.
- TODO: Add OpenTelemetry spans around repositories/services.
