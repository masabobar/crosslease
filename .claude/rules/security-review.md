---
layer: shared
---

# Security Review — Universal Triage (Always Applied)

**Version:** 1.3
**Status:** Active

**MANDATORY: every story and bug passes a security triage. Security is NOT opt-in and NOT limited to auth work.** Before a unit is marked complete, scan the change for the risk triggers in §1; for each trigger that fires, the listed check is **required** and missing it is a blocker. This rule is **always-loaded** (every story/bug), unlike `security-and-auth.md` which is the auth-specific deep-dive this triage routes to.

**Why:** the most dangerous security bugs hide in stories that don't look security-related — a file upload, a new `fetch()` to a user-supplied URL, a raw SQL query, a new dependency. Gating security only on "auth touched" lets these slip. This triage catches them by inspecting *what the change actually does*, not what the story is labeled.

---

## 1. Risk-Trigger → Required-Check Map (the core)

Inspect the diff / `files_touched`. For each trigger present, the check is **required** (else blocker). Each maps to an OWASP Top 10 (2021) category (§2).

| Trigger in the change | OWASP | Required check (else blocker) |
|---|---|---|
| Route/handler with `/:id` or resource-by-id lookup | A01 | **IDOR:** resource-level ownership/role check after auth + a test that user A cannot read user B's resource (`security-and-auth.md` §3.2) |
| Any new/changed HTTP handler or route | A01/A05 | Default-deny auth (`requireAuth`/`requireRole` unless explicitly public), Zod validation of body/params/query, security headers present (`security-and-auth.md` §3,§4,§5); docs/spec/playground/debug (introspection) routes are never public in prod (`api-documentation.md` §7) |
| `$queryRaw` / `$executeRaw` / raw SQL / string-built query | A03 | **No string interpolation** — parameterized (`Prisma.sql` / `$1` placeholders) only (`database.md`) |
| `dangerouslySetInnerHTML`, `.innerHTML`, user-supplied `href`/`src` | A03 | DOMPurify allowlist for HTML; reject `javascript:`/`data:` schemes for user URLs (`security-and-auth.md` §4) |
| `fetch`/`axios`/HTTP client called with a user-supplied URL | A10 | **SSRF:** host allowlist OR block private IP ranges (10/8, 172.16/12, 192.168/16, 127/8, ::1, fc00::/7) (`security-and-auth.md` §4) |
| File upload (`multipart`, `req.file`, storage write of uploaded bytes) | A04/A08 | Validate MIME + extension + magic bytes; store outside web root; size cap; never execute uploaded content (`security-and-auth.md` §4) |
| `package.json` / lockfile changed (new/updated dependency) | A06 | **`npm audit` (or `pnpm audit`) clean — no `high`/`critical`. HARD gate (blocker), like the test gate.** |
| New env var / `process.env.X` / secret usage | A02/A05 | Validated by Zod env schema; added to `.env.example`; never committed or logged (`security-and-auth.md` §6) |
| Auth / session / password / role / login code | A01/A02/A07 | Full `security-and-auth.md` gate (sessions httpOnly/secure/sameSite, bcrypt cost 12, rate limits, 401/403/IDOR/rate-limit tests, audit events) |
| Logging a request/response body, or any user object | A09 | Redaction: no PII / passwords / tokens / secrets in logs (`error-handling-and-logging.md` §3.4) |
| State-changing endpoint (POST/PUT/PATCH/DELETE) | A01 | CSRF defense: `SameSite` cookie, or anti-CSRF token for cross-origin (`security-and-auth.md` §5) |
| Auth / session, file upload, state transition, or privilege/money-movement code | A04 | **Abuse-case AC:** the story carries ≥1 abuse-case acceptance criterion with a scenario tracing to it, or the story file carries `**Abuse-Case Exempt:** <reason>` (§1.1) |
| Read-modify-write on shared state (check-then-act: duplicate-check + insert, close + create version chain, counter/cap update, single-use token) | A04 | **TOCTOU:** invariant enforced at the DB level — unique/partial-unique constraint, row lock (`FOR UPDATE`), or atomic conditional update with affected-rows assertion — plus a concurrency test (`database.md` — Invariants Live in the Database; `test-construction.md` §4). **Cross-request cases:** a retried / money / external-side-effect write needs an **idempotency key**; a multi-writer editable record needs an **optimistic-lock version predicate** (`concurrency-control.md`) |

> **Default-deny mindset:** when unsure whether a trigger applies, treat it as applying and verify. A false positive costs a minute; a missed check ships a vulnerability.

### 1.1 Abuse-Case AC Mandate (A04 — normal features used as weapons)

The A04 trigger above is a **story-level** requirement, not only a code check: happy path + the documented error matrix never catch a legitimate feature turned against the system. A story that touches **auth/session, file upload, a state transition, or privilege/money movement** MUST carry at least one explicit **abuse-case acceptance criterion** — the feature used as a weapon. Canonical examples:

- a deactivated user's live session cannot act (revocation holds mid-session, not only at next login)
- a first-login-only / one-shot action rejects a caller who is already past that state
- a hostile upload within the size cap is still bounded (page count, processing time, spawned work)

Rules:

- Abuse-case ACs classify as `main-error` and produce **exactly 1 scenario each** (`test-scoping.md` §5), exercised by a **direct request** to the action/endpoint (`testing.md` — "Guard Parity & Direct Endpoint Testing"), never only through the UI that fronts it.
- The only waiver is an explicit story-file line `**Abuse-Case Exempt:** <reason>` (template: `documentation-templates.md` §1.1) — valid only when the story genuinely has no abusable surface.
- At triage (§3), a story in this trigger set with neither an abuse-case AC nor the exemption line is a fired, uncovered trigger → **Blocked**, not committed.

---

## 2. OWASP Top 10 (2021) — where each is enforced

| # | Category | Enforced by |
|---|---|---|
| A01 | Broken Access Control | §1 (IDOR, default-deny, CSRF) + `security-and-auth.md` §3 |
| A02 | Cryptographic Failures | `security-and-auth.md` §2.1–2.2 (bcrypt, cookie secure flags), §6 (secrets); TLS/HSTS §5 |
| A03 | Injection (SQL/XSS) | §1 (raw SQL → parameterized; `dangerouslySetInnerHTML` → DOMPurify) + `database.md` + `security-and-auth.md` §4 |
| A04 | Insecure Design | §1.1 abuse-case AC mandate (auth/session, upload, state transition, privilege/money movement) + §1 TOCTOU row (DB constraint/lock + concurrency test; cross-request → `concurrency-control.md`) + §1 file-upload + threat-think during plan mode |
| A05 | Security Misconfiguration | §1 security headers (CSP/HSTS/X-Frame/X-Content-Type), CORS allowlist (`security-and-auth.md` §5) + introspection surfaces not public in prod (`api-documentation.md` §7) |
| A06 | Vulnerable & Outdated Components | §1 dependency hard gate (`npm/pnpm audit`) |
| A07 | Identification & Auth Failures | `security-and-auth.md` §2 (sessions, rate-limit on login, session rotation) |
| A08 | Software & Data Integrity Failures | §1 file-upload (magic bytes); lockfile committed; verify webhook signatures |
| A09 | Security Logging & Monitoring Failures | `security-and-auth.md` §7 (audit events) + `error-handling-and-logging.md` (redaction, request_id) |
| A10 | Server-Side Request Forgery (SSRF) | §1 (user-supplied URL → allowlist / private-IP block) |

If a story touches an area mapped above, that category's check is required. A story that touches none is rare but valid (§4).

---

## 3. Triage Procedure

Applied in two places (same map, same blocking semantics):

1. **`/execute-work`** — a mandatory step before the forced test step (continuous §STEP 6.5 / paused §3.5.5). Scan `files_touched`; for each fired trigger, confirm the required check is implemented AND tested. Any uncovered trigger → status `blocked` (do not commit). Record the result for the JSON `security_triage` field.
2. **`/security-scan`** — standalone scan of a `git diff` / branch / working tree against this same map; produces an OWASP-categorized report. Run before opening a PR, or against existing code.

Output of a triage is always explicit: either the list of fired triggers + their coverage status, or "no security-relevant changes detected" (§4) — never silent.

---

## 4. When NOTHING is Security-Relevant

Some changes genuinely carry no security surface: a CSS/style tweak, a copy edit, a pure-internal refactor of a non-IO function, a doc change. In that case the triage explicitly records **"No security-relevant changes detected"** and passes. This must be a *conclusion of the scan*, not a skipped step — the scan always runs.

---

## 5. Relation to Other Rules

This triage is the **always-on front door**; it routes to the deep rules for the actual requirements:

- `.claude/rules/security-and-auth.md` — auth/session/password/IDOR/headers/SSRF/upload deep-dive (conditional, loaded when §1 routes here)
- `.claude/rules/database.md` — parameterized queries (A03 SQL injection)
- `.claude/rules/error-handling-and-logging.md` §3.4 — log redaction (A09)
- `.claude/rules/api-documentation.md` — Zod request validation at the boundary
- `.claude/rules/testing.md` — the 401/403/IDOR/rate-limit/redaction tests that prove a check works

---

## Related

- `.claude/rules/security-and-auth.md` — deep auth rule (this routes to it)
- `commands/security-scan.md` — the standalone `/security-scan` command
- `commands/modules/execute-work-quality-gates-domain.md` (Security Triage Gate) — where the triage gate is enforced
- `CLAUDE.md` §3 — listed under Always-load rules

---

**Status:** ✅ Active