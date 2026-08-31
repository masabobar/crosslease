# Security & Auth (Frontend)

**Version:** 2.0
**Last Updated:** 2026-07-05
**Status:** Active

**MANDATORY: Tokens are cookie-borne and never read, stored, or forwarded by frontend code. Role gating uses the exact wire values. FE checks are presentation-layer UX — the security boundary is the backend. XSS-risk APIs are forbidden without sanitization. Secrets never enter git or `VITE_`-prefixed vars.**

> **FE-only repo.** Server-side auth (session handling, password hashing, rate limiting, resource-level checks) is implemented and ruled in `../refinext-api/`. This file covers what the frontend must do.

---

## 1. Token Handling (cookie-borne JWT)

- Access token expires in 30 minutes; refresh token in 7 days (see CLAUDE.md §API integration).
- **Tokens live in cookies set by the backend — no token value ever exists in frontend state.** `api` is created with `withCredentials: true`; there is no request interceptor and no `Authorization` header anywhere in `src/lib/api.ts`. Never add one, and never copy a token into the store, the React Query cache, a URL param, or `localStorage`.
- `useAuthStore` persists exactly one field — `isAuthenticated` — to `localStorage`. It is a UI flag for route guards and for deciding whether a 401 means "attempt refresh", **not** a credential. `clearAuth()` resets it; the cookies themselves are cleared by the backend on logout.
- The 401 → refresh → retry flow is handled **centrally** in the `@/lib/api` interceptor. Components and feature code never implement refresh logic — they call `api.*` and get either data or an `ApiError`.
- A consequence worth knowing: because credentials are cookies, a top-level browser navigation to an API URL (`<a href>`, `window.open`) is authenticated. This is a legitimate pattern for endpoints that 302 to a presigned file URL — see `features/lc/api/lcPortalApi.ts`. It is also why an API URL must never be pasted anywhere it could leak to a third party.
- Never log a token, include one in an error message, or send one to any third-party service.

## 2. Role-Based Gating (RBAC)

- Role wire values (exact, from `project-rules.md`): `system_admin`, `support_user`, `auditor`, `bank_power_user`, `front_office`, `back_office`, `leasing_company_user`.
- Reference roles via the Zod schema enum / shared constant — never freehand strings (`=== "system_admin"` inline is a review blocker; see `.claude/rules/project/code-review.md` §10).
- Every FE gate must mirror an actual BE enforcement (verified during `api-first.md` Phase A §6). Hiding a button is UX, not security — never assume a hidden control protects data.
- LC Users (`leasing_company_user`) never see Financing, Risk, Audit, KYC, or Approval Workflow modules.

## 3. Route Protection

- Protected routes are the default; public routes (login, password reset, etc.) are the explicit exception — default-deny, allowlist pattern.
- Validate route and query params before use — no raw `params.id` passed into queries without a guard.

## 4. XSS & Injection Hygiene

- React auto-escapes JSX. `dangerouslySetInnerHTML` is forbidden unless the content passes through DOMPurify with an allowlist.
- User-supplied URLs rendered into `href` / `src` must validate the scheme — reject `javascript:` and `data:`.

## 5. Secrets & Environment

- Anything in a `VITE_`-prefixed var ships to every browser. **Never put a secret, API key, or token in one.**
- `.env` files (except `.env.example`) stay out of git. New vars are added to `.env.example` with placeholder values.
- No secrets, tokens, or PII in `console.*` (pre-commit blocks `console.log/warn/debug` anyway), comments, or test fixtures.

## 6. Dependency Hygiene

- `pnpm audit` clean before release; CI should fail on `high`/`critical`.
- `pnpm-lock.yaml` committed for reproducible installs.

## 7. Testing

- Auth API shapes have Zod schema tests; auth store transitions (set/clear tokens, session expiry) have store tests — per `.claude/rules/project/testing.md`.
- New role-gated UI: verify the gate uses the wire-value constant, not a string literal.

---

## Related

- `../refinext-api/` — server-side auth enforcement (source of truth for what a role can actually do)
- `.claude/rules/project/api-first.md` §Phase A.6 — auth model must match between screen and endpoint before FE work starts
- `.claude/rules/project/error-handling-and-logging.md` — `ApiError.code` handling for `UNAUTHORIZED` / `FORBIDDEN`
- `.claude/rules/project/code-review.md` §7 — security review checklist
- `.project-management/rules/project-rules.md` — role wire values, session rules, Four-Eyes constraints

---

**Status:** ✅ Active
