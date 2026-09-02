# Error Handling & Logging

**Version:** 1.0
**Last Updated:** 2026-05-11
**Status:** Active

**MANDATORY: Every error must be (1) typed, (2) caught at a single boundary, (3) returned in the canonical envelope with a `SCREAMING_SNAKE_CASE` code, (4) logged with structured context, (5) covered by tests. Logs MUST NOT contain PII, secrets, or full auth/payment request bodies. Errors MUST NOT be silently swallowed.**

Complements `.claude/rules/stack-specific.md` (response envelope), `.claude/rules/enums-and-constants.md` (codes are enums), `.claude/rules/anonymization.md` (no PII in logs), `.claude/rules/api-documentation.md` (errors are documented), `.claude/rules/testing.md` (every error path tested).

---

## 1. Scope

Covers: HTTP handler errors, validation/auth/business failures, integration errors, unhandled exceptions, request/response logging. Does NOT cover: build errors, infra alerting, test-runner formatting.

## 2. Error Handling

### 2.1 Error Taxonomy

| Category         | HTTP status | `code` prefix    | Examples                            |
| ---------------- | ----------- | ---------------- | ----------------------------------- |
| Validation       | 400         | `VALIDATION_*`   | Zod parse failure, malformed JSON   |
| Authentication   | 401         | `AUTH_*`         | Missing/invalid session             |
| Authorization    | 403         | `FORBIDDEN_*`    | Valid session, insufficient role    |
| Not found        | 404         | `NOT_FOUND_*`    | Record absent, route unmatched      |
| Conflict         | 409         | `CONFLICT_*`     | Unique constraint, version mismatch |
| Rate limit       | 429         | `RATE_LIMITED_*` | Throttled                           |
| Business rule    | 422         | `BUSINESS_*`     | Valid input refused by domain rule  |
| Integration      | 502 / 503   | `INTEGRATION_*`  | Upstream API, DB unreachable        |
| System / unknown | 500         | `INTERNAL_ERROR` | Unhandled                           |

### 2.2 Response Envelope

Every error response follows the canonical envelope from `.claude/rules/stack-specific.md`:

```typescript
{ "success": false, "error": "<English summary>", "code": "VALIDATION_EMAIL_INVALID" }
```

- `code` is `SCREAMING_SNAKE_CASE` per `.claude/rules/enums-and-constants.md`; listed in the endpoint doc.
- `error` is English — UI translates via i18next keyed by `code`: `t(\`errors.${code}\`)`.
- Optional `details` array for field-level validation errors.
- NEVER include stack traces, internal IDs, file paths, or PII in the response body.

### 2.3 Custom Error Classes

One base + one subclass per category in `app/lib/errors.ts` (single source of truth). Each subclass owns its HTTP status:

```typescript
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = new.target.name
  }
}
export class ValidationError extends AppError {
  constructor(code: string, m: string, d?: unknown) {
    super(code, 400, m, d)
  }
}
export class NotFoundError extends AppError {
  constructor(code: string, m: string) {
    super(code, 404, m)
  }
}
// + AuthError (401), ForbiddenError (403), ConflictError (409), BusinessError (422), IntegrationError (502)
```

Handlers throw typed errors; the boundary (§2.4) translates to the envelope.

### 2.4 The Single Error Boundary

Every backend has exactly one error-handling boundary. In React Router 7, this is a server-side error mapper invoked from loaders/actions plus the route module's `ErrorBoundary` export for client rendering:

```typescript
// app/lib/error-response.ts
export function toErrorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    log.warn(
      { code: err.code, status: err.status, details: err.details },
      err.message
    )
    return Response.json(
      {
        success: false,
        error: err.message,
        code: err.code,
        details: err.details,
      },
      { status: err.status }
    )
  }
  if (err instanceof z.ZodError)
    return Response.json(
      {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_FAILED",
        details: err.issues,
      },
      { status: 400 }
    )
  if (err instanceof Prisma.PrismaClientKnownRequestError)
    return mapPrismaError(err) // P2002 → 409 CONFLICT_*, P2025 → 404, …
  log.error({ err }, "unhandled error")
  return Response.json(
    { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 }
  )
}
```

Handlers rarely contain `try/catch` — throw typed, let the boundary translate.

### 2.5 Never Swallow

```typescript
// ❌ catch (e) { /* silent */ }            — error lost
// ❌ catch (e) { log.error(e); }            — caller assumes success
// ✅ catch (e) { log.error({err:e}, '…'); throw e; }   — log + rethrow
// ✅ catch (e) { log.warn(…, 'fallback'); return fallback(); }   — recover visibly
```

### 2.6 Frontend

- Wrap routes in React Router's `ErrorBoundary` to catch loader/action/render throws.
- Display labels via i18next keyed by `code`: `t(\`errors.${error.code}\`, { defaultValue: t('errors.GENERIC') })`. Never show raw `error` text or stack traces to end users.
- Retryable errors (5xx, network): show retry button — never auto-retry indefinitely.
- Forward unhandled frontend errors to the error tracker (Sentry / equivalent), with PII redaction (§3.4).

## 3. Logging

### 3.1 Structured (JSON)

Use a structured logger (`pino` recommended for Node.js). Never concatenate free-text:

```typescript
// ❌ console.log(`User ${userId} did ${action}`);
// ✅ log.info({ userId, action }, 'user action');
```

### 3.2 Levels

| Level   | When                                                                             |
| ------- | -------------------------------------------------------------------------------- |
| `error` | Unexpected failure; system needs attention. Includes the error object.           |
| `warn`  | Expected-but-notable: validation rejections, business denials, fallback engaged. |
| `info`  | Business events worth keeping (signup, order placed). Request entry/exit.        |
| `debug` | Diagnostic flow in development; off in prod by default.                          |
| `trace` | Very fine-grained; almost never enabled in prod.                                 |

Production default: `info`. Configure via env var `LOG_LEVEL`.

### 3.3 What to Log

- Every HTTP request entry + exit: `method`, `path`, `status`, `duration_ms`, `request_id`, `user_id` (if authenticated).
- Every error caught at the boundary: `code`, `status`, `stack` (server-only — never in client response), `request_id`, `user_id`.
- Business events that you'd want to reconstruct user activity from.
- Slow operations (DB queries > 100ms, external API calls): `duration_ms` + resource identifier.

### 3.4 What NEVER to Log

- Personal info (names, emails, phones) per `.claude/rules/anonymization.md`. Use opaque `user_id` instead.
- Passwords / password hashes / session tokens / JWTs / API keys / OAuth tokens / refresh tokens — under any field name.
- Full request bodies for auth/payment endpoints. Log field NAMES present, not values.
- Credit-card numbers, CVVs, SSNs, regulated PII.
- Stack traces in client-facing responses (server logs only).

Configure logger redaction for known sensitive keys:

```typescript
const log = pino({
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "*.password",
    "*.token",
    "*.creditCard",
    "*.cvv",
  ],
})
```

### 3.5 Correlation IDs

Generate (or accept from `X-Request-Id` header) a `request_id` UUID at request entry. Attach to the logger context, propagate through async boundaries, include in every log line for that request, AND return it in the response `X-Request-Id` header. Bug reports include the ID; you grep logs by it.

### 3.6 Log Once + Error Tracker

When catching, decide: recover or propagate? If propagate, log at `error` level **once at the boundary** (not at every layer) and rethrow — avoid duplicate logging across nested catches. Production projects MUST integrate an error tracker (Sentry or equivalent); the boundary forwards unhandled / 5xx errors with PII scrubbed (same redaction as §3.4). Tracker is for alerting/aggregation, logs for reconstruction — keep both.

## 4. Anti-Patterns

| ❌                                 | Why it breaks                       | ✅                                               |
| ---------------------------------- | ----------------------------------- | ------------------------------------------------ |
| `catch(e){}`                       | Silent data loss                    | Log + rethrow, or visible fallback               |
| `console.log` in prod              | Unstructured, unredacted            | `pino` with redaction                            |
| Logging `req.body` on login        | Leaks password                      | Log field names only                             |
| `throw new Error('not found')`     | Boundary can't map status           | `throw new NotFoundError('USER_NOT_FOUND', '…')` |
| Localized error message from API   | Forces server-side locale detection | English server-side; UI i18n by `code`           |
| Stack trace in client response     | Info disclosure                     | Stack to logs only                               |
| Per-handler `try/catch` everywhere | Boilerplate; envelope drift         | Throw typed; single boundary                     |
| Same error logged at 3 layers      | Log spam                            | Log once at the boundary                         |

---

## 5. Testing & PR Checklist

**Testing (per `.claude/rules/testing.md`):**

- Every error path in §2.1 the handler can produce has a test asserting status, `code`, and envelope shape.
- Every `code` listed in the endpoint doc (per `.claude/rules/api-documentation.md`) has a corresponding test.
- Logger is injected (Dependency Inversion per `.claude/rules/code-quality.md`); tests assert error-level log fires at the boundary.
- Redaction config has a test: log a payload with `password`/`token`/`creditCard`, assert serialized output does not contain the value.

**PR checklist (paste into PR description):**

- [ ] All thrown errors are `AppError` subclasses (or known library errors mapped at the boundary)
- [ ] Error responses follow the canonical envelope (`success`, `error`, `code`)
- [ ] Every new `code` is `SCREAMING_SNAKE_CASE` and listed in the endpoint doc
- [ ] No `catch` block silently swallows; either recovers visibly or rethrows
- [ ] Structured logger used; no `console.log` in production paths
- [ ] No PII / secrets / full auth bodies logged; redaction covers any new sensitive keys
- [ ] `request_id` propagated and returned in `X-Request-Id`
- [ ] Tests cover every error path produced by this change

---

## Related

- `.claude/rules/stack-specific.md` — canonical response envelope
- `.claude/rules/enums-and-constants.md` — error `code` values are `SCREAMING_SNAKE_CASE` enums
- `.claude/rules/anonymization.md` — no personal info in logs
- `.claude/rules/api-documentation.md` — every error response MUST be documented per endpoint
- `.claude/rules/api-versioning.md` — adding/removing error codes follows the change-propagation gate
- `.claude/rules/testing.md` — status-code matrix; every error path tested
- `.claude/rules/code-quality.md` (Dependency Inversion — inject the logger) — `.claude/rules/security-and-auth.md` (security event audit log: login, role change, permission denial)

---

**Status:** ✅ Active
