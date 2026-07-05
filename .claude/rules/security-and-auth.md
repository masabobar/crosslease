# Security & Auth (Frontend)

**Version:** 2.0
**Last Updated:** 2026-07-05
**Status:** Active

**MANDATORY: Tokens live only in the auth store and never leak into logs, URLs, or server-state caches. Role gating uses the exact wire values. FE checks are presentation-layer UX — the security boundary is the backend. XSS-risk APIs are forbidden without sanitization. Secrets never enter git or `VITE_`-prefixed vars.**

> **FE-only repo.** Server-side auth (session handling, password hashing, rate limiting, resource-level checks) is implemented and ruled in `../refinext-api/`. This file covers what the frontend must do.

---

## 1. Token Handling (JWT Bearer)

- Access token expires in 30 minutes; refresh token in 7 days (see CLAUDE.md §API integration).
- Tokens are **client state** → Zustand auth store only. Never in React Query cache, never in component state beyond the store, never in URL params or `localStorage` unless the store's persistence layer explicitly owns it.
- The 401 → refresh → retry flow is handled **centrally** in the `@/lib/api` interceptor. Components and feature code never implement refresh logic or read tokens directly — they call `api.*` and get either data or an `ApiError`.
- Logout clears all tokens from the store (`clearTokens()` — covered by store tests per `.claude/rules/testing.md`).
- Never log a token, include one in an error message, or send one to any third-party service.

## 2. Role-Based Gating (RBAC)

- Role wire values (exact, from `project-rules.md`): `system_admin`, `support_user`, `auditor`, `front_office`, `back_office`, `leasing_company_user`.
- Reference roles via the Zod schema enum / shared constant — never freehand strings (`=== "system_admin"` inline is a review blocker; see `.claude/rules/code-review.md` §10).
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

- Auth API shapes have Zod schema tests; auth store transitions (set/clear tokens, session expiry) have store tests — per `.claude/rules/testing.md`.
- New role-gated UI: verify the gate uses the wire-value constant, not a string literal.

---

## Related

- `../refinext-api/` — server-side auth enforcement (source of truth for what a role can actually do)
- `.claude/rules/api-first.md` §Phase A.6 — auth model must match between screen and endpoint before FE work starts
- `.claude/rules/error-handling-and-logging.md` — `ApiError.code` handling for `UNAUTHORIZED` / `FORBIDDEN`
- `.claude/rules/code-review.md` §7 — security review checklist
- `.project-management/rules/project-rules.md` — role wire values, session rules, Four-Eyes constraints

---

**Status:** ✅ Active
