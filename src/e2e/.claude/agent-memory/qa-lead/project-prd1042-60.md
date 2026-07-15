---
name: project-prd1042-60
description: PRD1042-60 US 28.16 Account Activation — DoR PASS, 13 ACs, full pipeline complete (Figma PARTIAL), Stage 3 WARNINGS, 7 scenario blocks
metadata:
  type: project
---

**Story:** PRD1042-60 — "US 28.16 | USER MANAGEMENT | Account Activation"
**Status:** QA Ready
**Epic:** PRD1042-39 (Epic 28: User Management & Authentication)
**DoR:** PASS — title present, 13 ACs found
**Figma link:** https://www.figma.com/design/j5hq5cQgHWdOtzLvSX0jvj/1.-Workspace?node-id=2080-2622
**Figma extraction_status:** PARTIAL — activation form (default + strong password), invitation email mockup, success screen, 5 password strength states, 2 blocked state screens. Missing: Confirm Password field (entire field absent), button disabled/loading state, password field error state.

**Why:** Activation is a pre-authentication flow (invited user, no active session). Design reflects happy-path form entry + success + two generic blocked screens. Error states and the Confirm Password field follow the established RefiNext pattern of being added in a later design pass.

**AC Summary (13 total):**

- AC-01: Valid token → show activation form (server-side validated, unused, active, account in Invited/Pending state)
- AC-02: Expired token → block activation, no sensitive token state exposed in error
- AC-03: Password/confirm mismatch → validation error, no activation; Confirm Password field ABSENT from design (DG-01 MAJOR)
- AC-04: Successful activation → token marked used, timestamp recorded, role/tenant/LC scope/access validity preserved, audit logged
- AC-05: Lifecycle transition Pending Activation → Active (server-side, audit traceable)
- AC-06: Role unchanged after activation (server-authoritative)
- AC-07: Tenant and LC scope unchanged after activation (server-authoritative)
- AC-08: Deactivated/expired/revoked/already-active accounts blocked (no session created)
- AC-09: Audit logging for all outcomes (actor, timestamp, invitation status, lifecycle, role, tenant, outcome — immutable)
- AC-10: Backend/API enforcement — server-authoritative; frontend alone cannot determine eligibility
- AC-11: Auditor activation requires active valid-from/valid-until; expired validity blocks activation
- AC-12: LC User requires valid tenant + LC scope; missing/invalid/unlinked scope blocks activation
- AC-13: Already-used token rejected (single-use; no state change; audit logged)

**Key design observations:**

- Blocked State 1 ("Account isn't ready yet") covers both AC-08 invalid state AND AC-11 Auditor validity — shared screen with generic "access configuration" copy
- Blocked State 2 ("This link is not valid") covers AC-02 expired + AC-13 already-used + revoked — shared screen, no token state exposed
- "Generate password" link and 5-state password strength bar present in design but have no AC backing — scope unconfirmed (MAJOR gap)
- Hardcoded date in Blocked State 1 ("Auditor validity expired on 20 Apr 2026") — must be dynamic in implementation; tests must not assert a specific date
- Success screen: "Welcome to Crosslease" — tenant name hardcoded in design mockup; dynamic in implementation
- Auto-redirect "Auto-redirect in 5s" on success screen has no AC backing — scope unconfirmed (INFO)

**Stage 3 outcome — WARNINGS (no CRITICAL blockers):**

- DG-01 MAJOR: Confirm Password field absent from all design frames
- DG-02 MAJOR: Button disabled state not designed
- DG-03 MINOR: Password field error state not designed
- MAJOR: Generate password / strength bar have no AC
- MAJOR: Hardcoded date in Auditor validity error message
- MAJOR: Role/scope preservation (AC-06, AC-07) have no UI evidence on success screen
- MAJOR: Tenant isolation pattern for LC scope rejection (AC-12) unconfirmed at API layer
- MINOR: AC-05 lifecycle transition has no explicit UI indicator
- Ambiguities: which screen for already-active account (AC-08); LC scope vs Auditor validity — same screen or distinct; auto-redirect testability

**AC scope filter decisions:**

- happy-path: AC-01, AC-04
- main-error: AC-02, AC-03, AC-08, AC-11, AC-12
- edge-case: AC-05, AC-06, AC-07, AC-09, AC-10
- separate-feature: AC-13

**Stage 4 scope — 7 scenario blocks (3 Outlines + 4 Scenarios):**

1. Activation form displayed — valid token (AC-01) — 1 Scenario
2. Successful activation — 3 role rows: front_office, auditor, lc_user (AC-04) — 1 Outline
3. Invalid token blocks activation — 3 token states: expired, already_used, revoked (AC-02) — 1 Outline
4. Password mismatch blocks activation (AC-03) — 1 Scenario (DG-01 noted; copy assertions deferred)
5. Invalid account state blocks activation — 3 states: deactivated, expired, already_active (AC-08) — 1 Outline
6. Auditor validity expired blocks activation (AC-11) — 1 Scenario (dynamic date assertion, not hardcoded)
7. LC scope missing/invalid blocks activation (AC-12) — 1 Scenario

**No blocked ACs** — all main-error ACs have sufficient story text to write Gherkin without design confirmation.

**Open alignment items (from Blockers and Gaps Summary):**

- Which blocked screen applies to already-active account retrying activation (AC-08)?
- Does LC scope failure (AC-12) share Blocked State 1 copy with Auditor validity (AC-11) or need distinct copy?
- Is the 5s auto-redirect a testable requirement or UX convenience?
- Are Generate Password and password strength bar in-scope requirements needing AC?
- Confirm 404-not-403 pattern for tenant isolation in LC scope rejection (AC-12, AC-07)

**Stage 1 completion:** provided in parent conversation (2026-06-02)
**Stage 2 completion:** provided in parent conversation (2026-06-02)
**Stage 3 completion:** 2026-06-02 — WARNINGS (7 MAJOR mismatches, 3 ambiguities, 0 CRITICAL blockers)
**Stage 4 completion:** 2026-06-02
**Stage 4 output:** /Users/admin/refinext-app/src/e2e/tests/PRD1042-60 Account Activation.md

Related memories: [[project-prd1042-39]], [[project-prd1042-43]], [[project-prd1042-45]], [[feedback-figma-design-convention]]
