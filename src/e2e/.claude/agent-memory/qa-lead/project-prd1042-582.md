---
name: project-prd1042-582
description: US 29.1 Tenant Creation & Onboarding — first story processed in Epic 29 (PRD1042-40 Tenant Management); 20 ACs, DoR PASS, Figma FAILED (session tooling), Stage 3 WARNINGS, 9 scenario blocks, four active open bugs
metadata:
  type: project
---

# PRD1042-582 — US 29.1 | Tenant Creation & Onboarding Flow

**Processed:** 2026-07-03
**Epic:** PRD1042-40 Epic 29 Tenant Management (first story processed in this epic — pilot for tenant lifecycle test suite)
**Story status at processing:** QA in progress
**DoR:** PASS — 20 ACs, description complete, reviewed by Iva Marković 2026-06-01, accepted by Vesna Plakalovic 2026-06-11
**Stage 2:** FAILED — Figma REST + MCP unreachable in session (same tooling class as PRD1042-44 and PRD1042-48); design signals derived from story description + open bugs
**Stage 3:** WARNINGS — no CRITICAL blockers; design gaps flagged
**Stage 4:** 9 active scenario blocks (1 Outline + 8 Scenarios), 4 `@e2e-ready`, 5 needing fixtures

**Why:** First tenant-scope story in the pipeline — the tenant creation wizard is the primary provisioning surface and defines how tenant identity is established for downstream RBAC/isolation stories.

**How to apply:**

Feature-specific rules that will repeat across Epic 29 stories:

- **Multi-step wizard shape** — 5 steps: Identity → Modules → Seed Package → Integration → Review & Submit. Same wizard/step naming should be reused in future stories that extend the flow (TM-02 activation, TM-11 integration config)
- **Two-Actor governance** — every state-changing tenant operation goes through PRD1042-77 Four-Eyes (per BPS §3.1); OQ-01 (whether sandbox tenants use lighter tier) is unresolved as of 2026-07-03
- **404-not-403 pattern confirmed** — AC-11 explicitly uses 404 for cross-role access to tenant endpoints (RefiNext enumeration-prevention rule, architecture constraint #5)
- **Immutability guard** — Tenant Code is immutable; API PATCH must be rejected. Standard main-error scenario pattern in the file
- **Idempotency deferred** — Ivan Mladenovic comment 2026-06-05 confirmed idempotency is covered implicitly by unique constraints on Name + Code for MVP; AC-19 classified `separate-feature`
- **Seed content binding deferred** — same Ivan comment: seed content wiring (Product Templates, Rate Tables, Workflow Definitions) blocked on upstream modules; will be attached to activation handler later, no schema change needed

**Open bugs currently blocking copy-tight assertions (do NOT assert exact copy on these fields until closed):**

- PRD1042-1047 — Tenant Code helper text mismatch
- PRD1042-1090 — Step 2 Modules data/structure mismatch
- PRD1042-1094 — Step 2 Module section name + capitalization
- PRD1042-1092 — Label/value spacing (QA subtask PRD1042-652 blocker)

**Fixture gaps observed (Epic 29 will need these):**

- Throwaway tenant creation/deletion API (D19-analogue for tenants) — needed for happy-path + duplicate-name/code scenarios
- Deprecated seed package fixture — needed for AC-08 (seed active-check) scenario
- Existing-tenant seeding harness — used across 5 scenarios in this story

**File written:** `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-582 Tenant Creation.md` (created epic folder `PRD1042-40-Tenant Management` — new for this epic).

Related: [[project-prd1042-77]] (Four-Eyes engine dependency), [[feedback-figma-design-convention]], [[feedback-figma-link-not-bubbled]]
