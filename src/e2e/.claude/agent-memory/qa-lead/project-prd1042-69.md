---
name: project-prd1042-69
description: US 28.25 Secure Logout, 9 ACs, DoR PASS, no Figma, Stage 3 WARNINGS, 5 scenario blocks, AC-08 blocked by R1/PRD1042-76
metadata:
  type: project
---

PRD1042-69 — US 28.25 Secure Logout was processed through the full QA pipeline on 2026-06-03.

**DoR:** PASS (9 ACs, QA Ready status, stakeholder-reviewed by Philipp Maute / Vesna Plakalovic).

**Figma:** No Figma URL on parent or children (PRD1042-492 BE, PRD1042-493 FE, PRD1042-494 QA). Consistent with PRD1042-46 (Account Lockout) and PRD1042-47 (Session Management) — Epic 28 backend security stories do not carry Figma designs.

**Stage 3 status:** WARNINGS (no design data; all ACs lack design evidence; no CRITICAL blockers).

**Scope filter result:**

- `happy-path`: AC-01 (logout control visible), AC-04 (redirect + back nav blocked), AC-09 (logout from all devices)
- `main-error`: AC-02 (session termination — token rejected), AC-03 (server-side token invalidation — access + refresh tokens)
- `Blocked`: AC-08 (federated SSO logout — blocked by R1 auth provider + PRD1042-76)
- `edge-case`: AC-05 (audit logging — DB layer), AC-06 (distributed invalidation — multi-service harness)
- `separate-feature`: AC-07 (centralized enforcement — each pathway has its own story: PRD1042-45, PRD1042-60, PRD1042-46)

**Scenarios generated:** 5 blocks (3 Outlines + 2 Scenarios), 10 total Example rows.

**Updated 2026-07-08:** Added `bank_admin` role variant to AC-01 Scenario Outline (now 7 role variants) per PRD1042-48 (Ivan Mladenovic decision 2026-07-06). Logout is role-agnostic per AC-01 — Bank Admin included alongside all other authenticated roles.

**Key design gaps (no Figma):**

- Logout control placement in authenticated UI shell unknown — Playwright selector unresolvable until FE confirms
- "Logout from all devices" control in security settings panel has no design
- Token capture mechanism (HttpOnly cookie vs localStorage) affects AC-02/AC-03 test setup; D17 (TEST_JWT_SECRET) may be required

**Blocking dependency:** R1 (auth provider) + PRD1042-76 (SSO/IdP) must be resolved before AC-08 scenarios can be written.

**Audit trail note:** Philipp Maute raised and confirmed the server-side invalidation posture (AC-03 semantics — DB session record vs Redis denylist left open as dev-team call) and added AC-08/AC-09 in comments before story reached QA Ready.

**Output file:** src/e2e/tests/User Management/PRD1042-69 Secure Logout.md

Related: [[project-prd1042-46]], [[project-prd1042-47]], [[project-prd1042-45]]
