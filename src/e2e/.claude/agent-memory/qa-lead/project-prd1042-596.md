---
name: project-prd1042-596
description: US 29.15 Tenant Edit (Non-Lifecycle Fields), 14 ACs, DoR PASS, Figma PARTIAL (canvas sections confirmed, deep field data not extractable — Figma MCP rate-limited), Stage 3 WARNINGS, 8 scenario blocks, 4 open bugs, Rejected tenants editable per PRD1042-1097, re-run 2026-07-06 upgrades from design-blind to design-verified PARTIAL
metadata:
  type: project
---

Story: PRD1042-596 — US 29.15 | TENANT MANAGEMENT | Tenant Edit (Non-Lifecycle Fields)
Epic: PRD1042-40 (Epic 29: Tenant Management)
Status: QA in progress (2026-07-06)
Pipeline result (re-run 2026-07-06): 8 scenario blocks, 1 Blocked AC (PRD1042-1103), 5 edge-case/separate-feature ACs filtered out. File marked "Stage 2: design-verified (PARTIAL)" — supersedes design-blind v1.

**Stage 2 extraction status (re-run):** PARTIAL

- Canvas node 52:1806 confirmed to contain 8 children including: SECTION ADMIN (read-only), SECTION EDIT - Tenant identity, SECTION EDIT - Licence limits, SECTION SUPPORT (read-only), SECTION AUDITOR (read-only), plus annotation instances
- Read-only fields confirmed in ADMIN view: Code "CL-DE001", Type "Bank entity", Country "Germany", Provisioned "12 Aug 2025, 14:38"
- Lifecycle buttons confirmed: "Suspend tenant", "Archive tenant"
- Tabs confirmed: Overview, Modules & configuration, Governance history, Support access grants, Licence limits, people
- NOT extractable: deep field labels/placeholders in EDIT sections, error state frames, governance justification dialog copy, button disabled states
- Figma MCP hit rate limit on Professional View seat; Bash shell execution not available in current environment

**Stage 3 key mismatches (MAJOR):**

- AC-05: Duplicate name error state not in design
- AC-06: Archived tenant locked state not in EDIT frames
- AC-08: Legal Hold Flag warning dialog copy unverified (remains edge-case)
- AC-14: Rejected tenant EDIT variant not shown in design
- AC-02: Governance justification conditional rendering mechanics unconfirmed

**Key domain rules embedded:**

- Governance justification mandatory ONLY when Tenant Name changes (min 20 chars) — PRD1042-1096 confirmed
- Tenant Name uniqueness enforced across ALL states including Archived
- Rejected tenants ARE editable (PRD1042-1097 Done) — Scenario Outline covers Active + Suspended + Rejected
- Archived tenants NOT editable — returns 422
- Immutable fields: Tenant Code, Tenant Type (post-activation), timestamps, governance actor fields — confirmed read-only in design
- 404-not-403 for non-System Admin roles (Front Office, Back Office, LC User, Support User, Auditor)
- Legal Hold Flag set and clear each produce a separate TENANT_MODIFIED audit event
- API endpoint: PATCH /api/tenants/{id}

**E2E readiness:** 6 of 8 scenarios @e2e-ready. AC-05 and AC-06 need seeded Archived tenant fixture (not a D-series dependency — operational data setup).

**Related open items:**

- PRD1042-1095 (Ready for Staging) — descriptive duplicate name error message
- PRD1042-1103 (Open) — Draft/Expired tenant editability; AC-15 remains Blocked

**Why:** Figma MCP rate limit persists on Professional View seat. Stage 2 PARTIAL is the maximum achievable without Bash shell execution or MCP rate limit resolution. Structural canvas data confirmed from prompt context. Design-verified (PARTIAL) supersedes design-blind v1 from prior run.

Links: [[project-prd1042-582]] (same tooling blocker), [[project-prd1042-595]] (adjacent Epic 29 story), [[feedback-figma-link-not-bubbled]]
