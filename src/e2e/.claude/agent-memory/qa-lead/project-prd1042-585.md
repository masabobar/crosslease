---
name: project-prd1042-585
description: US 29.4 Tenant Detail View, 14 ACs, DoR PASS, Figma PARTIAL (MCP rate-limited, node 52:1806 section names known), Stage 3 WARNINGS, 8 scenario blocks, AC-03 Blocked PRD1042-1099, AC-04 Pending Enforcement bug PRD1042-1098
metadata:
  type: project
---

PRD1042-585 — US 29.4 Tenant Detail View processed 2026-07-07.

**DoR:** PASS — 14 ACs, description with full Identity & Status field table, QA in progress.

**Figma:** PARTIAL — Node 52:1806 in file 7pygkopuqyeEhUTMVp9lrP ("Tenant details page + edit"). Section names confirmed from prior extraction: ADMIN, EDIT-Licence-Limits, SUPPORT, AUDITOR, EDIT-Tenant-Identity. MCP rate-limited; field-level content not depth-verified.

**Stage 3:** WARNINGS.

- MAJOR: AC-03 Auditor tab access blocked by PRD1042-1099 (open bug)
- MAJOR: AC-04/AC-07 Pending Enforcement badge blocked by PRD1042-1098 (open bug)
- MAJOR: AC-05 Configuration Overrides tab (TM-10) not confirmed in Figma node
- MAJOR: AC-06 Integration Binding tab (TM-11) not confirmed in Figma node
- MINOR: Support User "limited fields" in Identity & Status not enumerated in story

**Blocked ACs:** AC-03 (PRD1042-1099)
**Separate-feature ACs:** AC-05 (TM-10), AC-06 (TM-11)
**Edge-case ACs:** AC-10, AC-11, AC-13

**Scenarios:** 8 blocks (3 Outlines + 5 Scenarios). Target met.

- happy-path: AC-01 (7 tabs), AC-02 (Support limited tabs, needs D20), AC-04 (lifecycle buttons Outline), AC-07 (Identity fields)
- main-error: AC-07+AC-08 (immutable fields no edit), AC-09 (Governance History append-only), AC-12 (404 non-authorized Outline), AC-14 (Support no-grant 404, needs D20)

**E2E candidates:** 6 of 8 ✅. AC-02 and AC-14 need D20 (seeded Support Access Grant).

**Output file:** src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-585 Tenant Detail View.md

**Key domain rules confirmed:**

- 404-not-403 for non-authorized roles (all tenant APIs)
- Support User dual-condition: flag=true AND active grant (AC-14)
- Governance History append-only — no edit/delete for any role
- Immutable fields (Tenant Code, ID, timestamps) — no edit affordance on detail view
- Lifecycle buttons (Suspend/Archive/Reactivate) — System Admin only

**Open bugs affecting this story:**

- PRD1042-1098 — Module status not transitioning to Pending Enforcement (affects AC-04 badge display)
- PRD1042-1099 — Auditor cannot access Tenant Governance History (blocks AC-03 entirely)

**Why:** [[project-refinext-overview]] — tenant isolation, 404-not-403, role-scoped views are core RefiNext patterns. [[project-prd1042-582]] — first Epic 29 story, confirms 404-not-403 pattern. [[project-prd1042-584]] — US 29.3 Tenant List also has Support User grant-scoped access pattern.
