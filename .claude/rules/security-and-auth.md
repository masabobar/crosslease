# Security & Authentication

**Version:** 1.0
**Last Updated:** 2026-05-11
**Status:** Active

**MANDATORY: Every endpoint is protected by default; only explicitly-public routes skip auth. Authentication uses cookie-based sessions (HttpOnly + Secure + SameSite). Passwords are bcrypt-hashed. Authorization is enforced by middleware and resource-level checks. Secrets never enter git. Every protected endpoint has 401 + 403 tests.**

Complements `.claude/rules/stack-specific.md` (middleware), `.claude/rules/error-handling-and-logging.md` (auth errors + audit logs), `.claude/rules/anonymization.md` (no PII in logs), `.claude/rules/testing.md` (status-code matrix), `.claude/rules/database.md` (parameterized queries).

---

## 1. Scope

Covers: authentication, authorization, session/password management, input/output safety, transport security, secrets handling, audit logging for security events. Does NOT cover: application-level business permissions (those are domain logic), infrastructure hardening (network/firewall), or third-party security scanning service config.

## 2. Authentication (Default Stack: Cookie Sessions)

### 2.1 Session Storage

Use React Router's `createCookieSessionStorage` (per default stack — no JWT). Required cookie attributes:

```typescript
createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true, // not readable by JS — XSS-resistant
    secure: process.env.NODE_ENV === "production", // HTTPS-only in prod
    sameSite: "lax", // CSRF mitigation
    maxAge: 60 * 60 * 24 * 7, // 7 days (refresh on activity)
    path: "/",
    secrets: [env.SESSION_SECRET], // for signing; ≥ 32 chars (per stack-specific.md env schema)
  },
})
```

- `httpOnly: true` is non-negotiable — without it, XSS = session theft.
- `secure: true` in production — set conditionally so local HTTP dev still works.
- `sameSite: 'lax'` blocks most CSRF; use `'strict'` for the highest-risk flows (admin panels), accepting the UX cost.

### 2.2 Password Hashing

Use `bcryptjs` (per default stack). Required:

- Hash on signup and on password change: `await bcrypt.hash(password, 12)`. Cost factor 12 — adjust upward over years as hardware improves.
- Verify with `await bcrypt.compare(plaintext, hash)`. Never compare hashes via `===`.
- Minimum password length: 8 characters; recommend 12+. Enforce via Zod schema, never in the UI alone.
- NEVER log, store, or transmit plaintext passwords — including in error messages, request bodies (per `.claude/rules/error-handling-and-logging.md` §3.4), or test fixtures.
- On password change: invalidate all existing sessions for that user (§2.4).

### 2.3 Rate Limiting on Auth Endpoints

Auth endpoints are the highest-value attack surface. MUST be rate-limited:

- Login: max 5 failed attempts per username per 15 minutes → return `429 RATE_LIMITED_LOGIN` (per error taxonomy). After threshold, lock for 15 min OR require CAPTCHA.
- Password reset request: max 3 per email per hour.
- Signup: max 5 per IP per hour to throttle automated abuse.
- General API: per-route limits per `.claude/rules/stack-specific.md` "Rate limiting".

Failed attempts are logged as a security event (§7.1).

### 2.4 Session Lifecycle

- **Rotate** session ID on login (and on privilege change like role grant). Prevents session-fixation attacks.
- **Invalidate** all sessions for a user on: password change, account lock, explicit "log out all devices", admin revocation.
- **Idle expiration**: default 7 days; refresh on each authenticated request.
- **Absolute expiration**: default 30 days; user must re-authenticate.

---

## 3. Authorization

### 3.1 Two-Tier Middleware (Default Deny)

Every route is protected by default. Two middlewares per `.claude/rules/stack-specific.md`:

- `requireAuth` — verifies session, attaches `user` to request, throws `AuthError('AUTH_REQUIRED', 401)` on missing/invalid.
- `requireRole(role)` — verifies `user.role` ≥ required, throws `ForbiddenError('FORBIDDEN_INSUFFICIENT_ROLE', 403)`.

Public routes are explicitly opted out (allowlist pattern), never the inverse. A new route that forgets the middleware is a closed-state failure (401), not an open data leak.

### 3.2 Resource-Level Checks (separate from auth)

Authentication says "you are logged in." Authorization says "you may access _this specific_ resource." Always check both:

```typescript
const order = await db.order.findUnique({ where: { id: params.id } })
if (!order) throw new NotFoundError("NOT_FOUND_ORDER", "Order not found")
if (order.userId !== user.id && user.role !== "ADMIN") {
  throw new ForbiddenError("FORBIDDEN_ORDER_ACCESS", "Cannot access this order")
}
```

Never trust client-supplied IDs without an ownership check. The single most common bug: route protected by `requireAuth`, but any authenticated user can read any record by changing the path param (IDOR).

### 3.3 Role Definition

Roles are an enum per `.claude/rules/enums-and-constants.md`: `enum UserRole { USER, STAFF, ADMIN }` in Prisma. Wire value `SCREAMING_SNAKE_CASE`. Granting / revoking a role is a security event (§7.1).

---

## 4. Input + Output Safety

- **Input validation:** all request bodies, params, query strings parsed through Zod at handler boundary — per `.claude/rules/api-documentation.md` §2.1 and `.claude/rules/stack-specific.md`. Failure → 400 `VALIDATION_*`.
- **SQL injection:** Prisma parameterized queries only — per `.claude/rules/database.md`. Never `$queryRaw` with string interpolation; if raw SQL is unavoidable, use `Prisma.sql` tagged templates.
- **XSS:** React auto-escapes JSX. `dangerouslySetInnerHTML` is forbidden unless content passes through DOMPurify (or equivalent) with an allowlist of tags/attrs. URL props (`href`, `src`) must validate scheme — reject `javascript:` and `data:` for user-supplied URLs.
- **SSRF:** any backend code that fetches a user-supplied URL MUST validate the host against an allowlist or block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, ::1, fc00::/7).
- **File uploads** (if applicable): validate MIME + extension + magic bytes; store outside web root or behind authenticated proxy; never execute uploaded content; cap size at the proxy layer.

---

## 5. Transport & Headers

- **HTTPS only** in production. Redirect HTTP → HTTPS at the proxy (Railway handles this). Set `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- **CORS:** allowlist origins from `env.ALLOWED_ORIGINS` (comma-separated, validated by Zod env schema). Never `Access-Control-Allow-Origin: *` for endpoints that read cookies or accept credentials.
- **Security headers** (set globally; React Router middleware or Railway-level config): `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'` (tighten per project) — `X-Frame-Options: DENY` — `X-Content-Type-Options: nosniff` — `Referrer-Policy: strict-origin-when-cross-origin` — `Permissions-Policy: camera=(), microphone=(), geolocation=()` (opt in features explicitly).
- **CSRF:** `SameSite=Lax` cookies block most cross-site form posts. For high-value state-changing operations from third-party origins, add an explicit anti-CSRF token (double-submit cookie pattern).

---

## 6. Secrets Management

- Never commit secrets. `.env*` (except `.env.example`) is in `.gitignore`.
- `.env.example` lists every required variable with placeholder values — used by `/init-project` and onboarding.
- Validate all secrets at startup with the Zod env schema from `.claude/rules/stack-specific.md`. App fails fast on missing/malformed.
- `SESSION_SECRET` ≥ 32 chars, generated with a CSPRNG (`openssl rand -base64 32`).
- Rotate on suspected leak: rotate secret → invalidate all sessions → notify users if scope warrants.
- Production secrets live in Railway env vars (or equivalent secret manager) — never in code, docker images, or build logs.

---

## 7. Audit Logging & Monitoring

### 7.1 Security Events (always logged at `info`+ with structured fields)

- `auth.login.success` — `user_id`, `ip`, `user_agent`, `request_id`
- `auth.login.failure` — `username` (NOT password), `ip`, `reason` (`USER_NOT_FOUND` / `BAD_PASSWORD` / `LOCKED`), `request_id`
- `auth.logout` — `user_id`, `session_id`
- `auth.password_reset.request` / `.complete`
- `auth.session.invalidated_all` (e.g., on password change)
- `authz.role.granted` / `.revoked` — `target_user_id`, `actor_user_id`, `from_role`, `to_role`
- `authz.permission.denied` — `user_id`, `resource`, `action`, `request_id`

All security events MUST be greppable by `request_id` and reconstructable into a user-action timeline. PII redaction from `.claude/rules/error-handling-and-logging.md` §3.4 still applies (no plaintext passwords, no full tokens).

### 7.2 Dependency Scanning

- `npm audit` (or `pnpm audit`) clean before every release; CI fails on `high`/`critical`.
- Snyk / Dependabot enabled on the repo to surface CVEs.
- Lockfile committed (`package-lock.json` / `pnpm-lock.yaml`) for reproducible installs.

### 7.3 Error Tracker

Errors forwarded to Sentry (or equivalent) per `.claude/rules/error-handling-and-logging.md` §3.6 with PII scrubbed. Auth failures are NOT sent as errors (they are expected) — only as audit log events.

---

## 8. Testing Requirements

For every endpoint (per `.claude/rules/testing.md` matrix and `.claude/rules/api-versioning.md` §5.3):

- **401 test:** request without session → 401 `AUTH_REQUIRED`
- **403 test:** authenticated user without required role / not the resource owner → 403 `FORBIDDEN_*`
- **Resource-level test (IDOR):** authenticated user A cannot access user B's resources
- **Rate-limit test** on auth routes: 6th failed login → 429 `RATE_LIMITED_LOGIN`
- **CSRF test:** state-changing request with a third-party origin / no SameSite cookie → rejected
- **Password test:** signup with < 8-char password → 400; password never appears in any log output
- **Redaction test (per error-handling rule §3.4):** payload with `password` / `token` / cookie → not present in serialized logs

---

## 9. PR Checklist (paste-in)

- [ ] New route uses `requireAuth` (and `requireRole` if applicable), unless explicitly public-allowlisted
- [ ] Resource-level ownership/role check present where path/body refers to a resource
- [ ] No plaintext password, token, or session value in logs, error responses, or test fixtures
- [ ] Zod validates body / params / query at handler boundary
- [ ] Cookie config: `httpOnly: true`, `secure` in prod, `sameSite` set, `maxAge` set, `secrets: [env.SESSION_SECRET]`
- [ ] Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) present
- [ ] New env vars validated by Zod env schema and added to `.env.example`
- [ ] Tests: 401, 403, resource-level (IDOR), rate-limit (for auth routes)
- [ ] `npm audit` clean; no new `high`/`critical` advisories
- [ ] Security events emitted to audit log (§7.1) for any auth/authz change

---

## Related

- `.claude/rules/stack-specific.md` — `requireAuth` / `requireAdmin` middleware, Zod env schema, response envelope, rate-limit middleware
- `.claude/rules/error-handling-and-logging.md` — AUTH*\* / FORBIDDEN*\* error taxonomy, log redaction, audit log conventions
- `.claude/rules/anonymization.md` — no personal info in logs (applies to security events too)
- `.claude/rules/enums-and-constants.md` — `UserRole` and error `code` values are `SCREAMING_SNAKE_CASE` enums
- `.claude/rules/api-documentation.md` — auth requirements MUST be listed in every endpoint doc
- `.claude/rules/api-versioning.md` — changes to auth requirements follow the change-propagation gate
- `.claude/rules/testing.md` — 401/403 are mandatory test rows
- `.claude/rules/database.md` — parameterized queries only

---

**Status:** ✅ Active
