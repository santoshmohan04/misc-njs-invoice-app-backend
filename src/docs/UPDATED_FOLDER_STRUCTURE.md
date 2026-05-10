# Updated Folder Structure (Incremental)

```
models/
  refreshToken.js
  auditLog.js
  processedWebhookEvent.js

src/
  auth/
    rbac.js
  contracts/
    response.contract.js
    dto.schemas.js
  errors/
    AppError.js
    ValidationError.js
    AuthError.js
    NotFoundError.js
    PaymentError.js
    index.js
  jobs/
    cleanupJobs.js
  middlewares/
    authorization.js
    requestContext.js
    objectId.js
  routes/
    stripeWebhook.routes.js
    reporting.routes.js
  services/
    auditService.js
    sessionService.js
    stripeWebhookService.js
    reportingService.js
  config/
    env.validation.js
    storage.js
```

## TODO Markers
- TODO: Introduce BullMQ queue workers for email retries and reminders.
- TODO: Add migration script to backfill RBAC defaults for all legacy users.
- TODO: Extend audit logging to item-level changes.
