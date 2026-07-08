---
name: project-prd1042-43
description: PRD1042-43 US 28.1 User Login — DoR PASS, 17 ACs, full pipeline Stages 1–4 complete with Figma design data, Stage 3 WARNINGS, 10 active scenarios (7-role Outline after Bank Admin added 2026-07-08) + 4 pending stubs
metadata:
  type: project
---

**Story:** PRD1042-43 — "US 28.1 | USER MANAGEMENT | User Login"
**Status:** UAT ready (2026-07-08)
**Epic:** PRD1042-39 (Epic 28: User Management & Authentication)
**DoR:** PASS — title present, 17 ACs found, stakeholder-reviewed
**Figma design:** Node 319:163, file 18XTZEeaxrGDhi4DzZ2QnJ — Screen "Sign in" — Stage 2 COMPLETE (2026-05-25)

---

## Key implementation decisions (non-obvious, load-bearing for test authoring)

1. **JWT validation flags were explicitly added after a security review** (Philipp Maute, 2026-05-07). Prior Refinext build had JWT validation left at framework defaults — tokens effectively trusted regardless of signature or expiry. AC-15 and AC-16 are specifically hardening corrections from that incident. Tests for expired/tampered/wrong-issuer/wrong-audience tokens are mandatory (not optional hardening).

2. **"Signing key per service" re-calibrated for Modular Monolith** (Philipp, 2026-05-15): One centralised JWT issuing function, one signing key, externally managed (vault/secret manager), rotatable without redeployment. All modules validate against same key. Do NOT interpret as microservice-per-service key pattern.

3. **"Exactly one valid role" — primary role only for Sprint 1.** FO/BO separation is MaRisk-hard and cannot be relaxed. Overlay concept (delegated/temporary/engagement-windowed access) is deferred to PRD1042-341 (Four-Eyes Governance Workflow Engine). AC-11 is strict for Sprint 1: hybrid or unsupported role combinations must be rejected.

4. **Session timeout default is 30-minute idle / 8-hour absolute (AC-17).** 15-min idle default was discussed and rejected by Philipp. Tenant policy can loosen. The 30-minute value in the AC is the mandated behaviour to test against.

5. **AC numbering quirk:** Both "JWT Validation Enforcement" and "Session Timeout Enforcement" were originally labelled AC-15; latter renumbered to AC-17 during implementation write-up. Story as in Jira has AC-15 and AC-17 correctly.

6. **JWT key management overlap:** The "signing key externally managed" bullet in AC-13 overlaps with AC-15. For test traceability, trace JWT key management tests to AC-15, not AC-13.

7. **Clock-skew tolerance <= 60s** added to AC-16 per Philipp (Vesna confirmed). Enforced across all services. Must be asserted when D17 is resolved.

---

## Pipeline completion status

| Stage                            | Status                | Notes                                                              |
| -------------------------------- | --------------------- | ------------------------------------------------------------------ |
| Stage 1 — Jira extraction        | COMPLETE              | 17 ACs, DoR PASS                                                   |
| Stage 2 — Figma extraction       | COMPLETE (2026-05-25) | Node 319:163, file 18XTZEeaxrGDhi4DzZ2QnJ; happy-path frame only   |
| Stage 3 — Requirements vs Design | COMPLETE (2026-05-25) | Status: WARNINGS — 4 MAJOR, 3 MINOR findings; no CRITICAL blockers |
| Stage 4 — BDD test suite         | COMPLETE (2026-05-25) | 10 active scenarios + 4 pending stubs                              |

Test suite file: `src/e2e/tests/PRD1042-43 User Login.md`

---

## Stage 3 comparison summary (WARNINGS — not BLOCKED)

**MAJOR findings:**

- Email-only field in design vs "Email/Username" dual-mode in story description — PO confirmation required
- No error state frame for AC-08 (invalid credentials) — designer must add
- No MFA challenge frame for AC-04 — designer + auth provider decision (R1)
- No blocked-account state frame for AC-09 — designer must add

**MINOR findings:**

- Button label: design uses "Sign in", story uses "Login button" — use design label in POM
- Email field label: "Email address" not specified in story — use design label in POM
- Button subtitle "Secure access to your institution" is decorative, no AC coverage

**No CRITICAL findings** — story proceeds to Stage 4.

**Design convention confirmed:** RefiNext Figma login frame provides happy-path state only. Error states (invalid credentials, account locked, account suspended) require separate frames. MFA steps require a separate frame/flow. This is a recurring pattern — see [[feedback-figma-design-convention]].

---

## Stage 4 scope filter outcome (2026-05-25 run)

| Classification          | ACs                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| happy-path              | AC-03, AC-06, AC-07 (collapsed into 1 Scenario Outline, 6 roles)                                              |
| main-error              | AC-01 (empty form), AC-08 (invalid credentials), AC-09 (blocked accounts — Outline, 4 statuses)               |
| edge-case (active)      | AC-04 (MFA conditional), AC-05 (unauthenticated redirect), AC-11 (no-role block), AC-12 (invalid scope block) |
| Blocked                 | AC-10 (D18), AC-15 (D17), AC-16 (D17), AC-17 (D16)                                                            |
| separate-feature        | AC-13 (permission enforcement — auth-guard specs), AC-14 (audit logging — backend integration)                |
| edge-case (no scenario) | AC-02 (email format — unit test)                                                                              |

**Total:** 10 active scenarios (1 Outline × 6 roles + 1 Outline × 4 statuses + 5 standalone) + 4 pending stubs.

---

## Role-to-landing-page mapping (updated 2026-07-08)

| Role                 | Landing page     | Status                                                                                                             |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| system_admin         | /dashboard       | Confirmed — but now PLATFORM-ONLY per PRD1042-48 (2026-07-06); no longer manages bank users                        |
| bank_admin           | /dashboard/admin | **UNVERIFIED** — placeholder; design has not confirmed the route; only role that can assign/change bank user roles |
| front_office         | /dashboard       | Confirmed                                                                                                          |
| back_office_risk     | /dashboard       | Confirmed                                                                                                          |
| support_user         | /dashboard       | Confirmed                                                                                                          |
| auditor              | /dashboard       | Confirmed                                                                                                          |
| leasing_company_user | /workspace       | Confirmed                                                                                                          |

Note: LC users redirect to /workspace, all bank roles to /dashboard, bank_admin landing is TBD.

**Bank Admin context (2026-07-08 update, Ivan Mladenovic decision 2026-07-06):**

- Wire value: `bank_admin`
- user_type: `bank_tenant`
- Scope: Tenant-level, single tenant only
- **Only role that can assign/change bank user roles** (per PRD1042-48 update)
- `system_admin` is now platform-only and NO LONGER manages bank users
- Landing page is NOT specified in Jira ticket or Figma design as of 2026-07-08 — used `/dashboard/admin` as best-inference placeholder

---

## Successful login test users (from src/e2e/.env — updated 2026-06-10)

All credentials read from `src/e2e/.env`. Do NOT hardcode values in specs — always reference env vars via `process.env`.

| Role                 | .env email variable           | .env password variable           | Expected landing page |
| -------------------- | ----------------------------- | -------------------------------- | --------------------- |
| system_admin         | `DEV_USER_EMAIL`              | `DEV_USER_PASSWORD`              | /dashboard            |
| front_office         | `DEV_FRONT_OFFICE_USER_EMAIL` | `DEV_FRONT_OFFICE_USER_PASSWORD` | /dashboard            |
| back_office_risk     | `DEV_BACK_OFFICE_USER_EMAIL`  | `DEV_BACK_OFFICE_USER_PASSWORD`  | /dashboard            |
| support_user         | `DEV_SUPPORT_USER_EMAIL`      | `DEV_SUPPORT_USER_PASSWORD`      | /dashboard            |
| auditor              | `DEV_AUDIT_USER_EMAIL`        | `DEV_AUDIT_USER_PASSWORD`        | /dashboard            |
| leasing_company_user | `DEV_LCO_USER_EMAIL`          | `DEV_LCO_USER_PASSWORD`          | /workspace            |

**Excluded from happy-path login scenarios:** `TEST_INVALID_EMAIL` / `TEST_INVALID_PASSWORD` — these are negative-test fixtures only (AC-08 invalid credentials scenario).

**Coverage note:** These 6 users map 1:1 to the Scenario Outline rows in the BDD suite (AC-03, AC-06, AC-07). Each row must assert: HTTP 200, JWT issued, correct landing page redirect, and role claim present in token payload.

---

## E2E blocking dependencies

| Dependency                                   | Blocks                                                         | Resolution owner |
| -------------------------------------------- | -------------------------------------------------------------- | ---------------- |
| D16 — TEST_TOKEN_TTL_SECONDS env override    | AC-17 (session timeout)                                        | Dev team         |
| D17 — TEST_JWT_SECRET or test-forge endpoint | AC-15 (JWT validation), AC-16 (token tampering)                | Dev team         |
| D18 — Admin API to reset lockout counter     | AC-10 (account lockout)                                        | Dev team         |
| D19 — Throwaway user creation/deletion API   | AC-09 seeded accounts, AC-11 no-role user, AC-12 no-scope user | Dev team         |

All 10 active scenarios are unblocked. Only the 4 pending stubs require D-series resolution.

---

## Patterns applicable to future Epic 28 stories

- Every auth/login story needs: tenant isolation 404 tests, FO/BO disjunct negative case, audit log coverage on every failure path, role-scope boundary negative cases.
- MFA scenarios should be tagged @edge-case and include a note about auth provider (R1) until R1 is resolved.
- Scope filter is mandatory before writing scenarios: happy-path + main-error only. Timing/lockout/implementation details go to separate files. Target 5–10 scenarios per story.
- Design frames will be happy-path only — always expect MAJOR findings for missing error states. Plan for this gap and write behavioral assertions (no session created) rather than copy assertions when error message wording is unconfirmed.

**Why this matters:** This story carries the highest security surface area in Sprint 1. Any test gap on JWT validation, audit logging, or role enforcement has direct MaRisk/regulatory exposure.

Related memories: [[project-refinext-overview]], [[reference-jira]], [[feedback-figma-design-convention]]
