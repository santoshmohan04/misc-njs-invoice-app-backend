# Migration Notes

## Compatibility Strategy
- Existing request/response contracts remain unchanged: `success`, `message`, `data` envelope is preserved.
- Existing auth endpoints and headers remain valid: `x-auth`, `x-refresh-token`, and bearer tokens continue to work.
- Legacy routes without `/api` prefix are still enabled.

## Key Changes
- Refresh token persistence moved to dedicated collection: `refresh_tokens`.
- User schema now includes RBAC fields: `role`, `permissions`, `organizationId`.
- Added non-blocking audit log pipeline for auth/customer/invoice/payment/profile events.
- Added Stripe webhook handling with signature validation and duplicate-event guard.
- Added request correlation IDs and background cleanup jobs.

## Incremental Cutover Notes
- Legacy `user.tokens` refresh entries are still written temporarily during migration.
- Access token DB lookup behavior remains unchanged for frontend compatibility.
- TODO: Remove legacy refresh-token storage from `User.tokens` after all clients are migrated.

## Security Notes
- Introduced stricter CSP and user-aware rate limiting.
- Added inactivity timeout support and basic suspicious login signal.
- Added optional secure cookie auth strategy (`AUTH_STRATEGY=hybrid|cookie|header`).
