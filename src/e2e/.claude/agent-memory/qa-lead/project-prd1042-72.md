---
name: project-prd1042-72
description: PRD1042-72 US 28.5 User Search & Filtering — full pipeline complete, WARNINGS, 5 scenario blocks, Critical Quick Filter mismatch
metadata:
  type: project
---

PRD1042-72 (US 28.5 | USER MANAGEMENT | User Search & Filtering) completed full pipeline 2026-06-02.

**DoR:** PASS — 16 ACs, description present, Dev in progress (not QA-Ready; processed anyway per pipeline rule)
**Figma:** PARTIAL — 2 screens (Default + Active Filters state), node 2117:11195, file j5hq5cQgHWdOtzLvSX0jvj
  - Quick Filter row present with filter count badges and chips strip on Screen 2
  - Critical gap: filter dropdown panels absent, page size selector absent, empty state absent
  - Critical mismatch: design Quick Filter row (Role, Tenant, MFA, Status, Last login) ≠ story authoritative list
**Stage 3:** comparison_status WARNINGS — 1 CRITICAL mismatch, 5 MAJOR, 3 MINOR

Key mismatches:
- CRITICAL: Quick Filter row in design omits First Name, Last Name, Email; includes "Last login" which is not in the authoritative closed list. Order also wrong. Story states list is closed/authoritative.
- MAJOR DG-02: No filter dropdown panel designed for any filter button
- MAJOR DG-03: Page size selector absent (story requires 10/20/50/100)
- MAJOR DG-04/DG-05: No empty/zero-results state designed (security-sensitive for AC-11 enumeration leakage)
- MAJOR AC-09: No auditor expiry / access-denied state designed
- MAJOR AC-16: Export button present but no export panel/scope confirmation designed

Decision on CRITICAL: Stage 4 proceeded with WARNINGS (not BLOCKED) — mismatch is in filter labeling/presence, not in a hard business rule that makes test scenarios logically invalid. Scenarios written using story-authoritative filter names with inline design-update note.

**Stage 4:** 5 scenario blocks generated (2 Outlines + 3 Scenarios)
- happy-path: AC-01 (authorized search Outline, 3 role variants), AC-07 (combined filtering)
- main-error: AC-04 (FO + BO/Risk governance combination block), AC-08 (tenant isolation — 404 not 403), AC-11 (zero-results wording does not reveal unauthorized user existence)
- Excluded as edge-case: AC-02, AC-03, AC-05, AC-06, AC-10, AC-12, AC-13, AC-14, AC-16
- Excluded as separate-feature: AC-09, AC-15

**Confirmed domain rules applied:**
- Tenant isolation → cross-tenant search returns 404 (not 403)
- Governance role combination block → Front Office + Back Office/Risk mutually exclusive
- Enumeration leakage → zero-results message must not disclose unauthorized user existence
- Email search → always audit-logged (AC-14 edge-case; server-side only)

**Open questions requiring resolution:**
- AMB-01: Front Office + Back Office/Risk block — UI enforcement at filter selection vs. results level?
- AMB-02: Auditor expiry — full-page access denied, toast/banner, or redirect?
- AMB-03: Zero-results message exact copy (security-sensitive wording)
- AMB-04: Export format (CSV/XLSX/PDF?) and scope confirmation UX
- AMB-05: Import users + Invite user CTAs — which story covers these?

**Why:** User Search & Filtering is a compliance-critical feature for DACH banking (MaRisk/BAIT) — tenant isolation and enumeration leakage prevention are regulatory requirements.
**How to apply:** Quick Filter row discrepancy is a recurring pattern between design and authoritative spec — always validate filter set against the closed list in the story. Expect missing dropdown panels for filter buttons in this design system.

Related: [[project-prd1042-71]] (User List View — shares same Figma frame parent), [[project-prd1042-39]] (Epic 28), [[feedback-figma-design-convention]]
