---
name: project-prd1042-71
description: PRD1042-71 US 28.4 User List View — full pipeline complete, WARNINGS, 9 scenario blocks, LC User nav gap, read-only row gap
metadata:
  type: project
---

PRD1042-71 (US 28.4 | User Management | User List View) completed full pipeline 2026-06-02.

**DoR:** PASS — 14 ACs, description present, Dev in progress (not QA-Ready; processed anyway per pipeline rule)
**Figma:** PARTIAL — single screen node 2162-6928 in file j5hq5cQgHWdOtzLvSX0jvj; no empty/loading/error states; no role-variant nav; missing status variants (Expired, Locked, Archived); actions column header is placeholder text
**Stage 3:** comparison_status WARNINGS — 4 MAJOR mismatches, 0 CRITICAL, no blockers

Key mismatches:
- M-01 MAJOR: No LC User sidebar nav variant designed (AC-03) — tests written against requirements only
- M-02 MAJOR: Status badge missing for Expired, Locked, Archived (AC-04) — three states untestable via design
- M-03 MAJOR: No read-only row/actions variant for Support or Auditor (AC-10)
- M-04 MAJOR: No expired-engagement UI state for Auditor (AC-09) — excluded as separate-feature

**Stage 4:** 9 scenario blocks generated (2 Outlines + 7 Scenarios)
- happy-path: AC-01+AC-04 (Outline 3 roles), AC-06 (sorting), AC-07 (pagination), AC-14 (export trigger)
- main-error: AC-02 (tenant isolation), AC-03 × 2 (nav hidden + route blocked for LC User), AC-10 (read-only enforcement), AC-14 (cross-scope export blocked)
- Excluded as edge-case: AC-05, AC-08, AC-11, AC-13
- Excluded as separate-feature: AC-09, AC-12

**Confirmed domain rules applied:**
- LC User → entire module invisible (no nav link, no route, no placeholder)
- Tenant isolation → cross-tenant request returns 404 not 403
- Support + Auditor → read-only; modification actions suppressed

**Open questions requiring resolution:**
- AMB-02: Does direct LC User URL access return 404 or redirect silently?
- AMB-03: Export dropdown format options not designed
- Checkboxes have no AC — bulk actions not in scope confirmed or denied

**Why:** User List View is the primary administrative interface; tenant isolation and role access are critical compliance properties for DACH banking regulation context (MaRisk / BAIT).
**How to apply:** When processing follow-on stories (User Detail View, User Create, User Edit), expect role-variant design gaps to recur; flag proactively at Stage 2.

Related: [[project-prd1042-39]] (Epic 28), [[feedback-figma-design-convention]]
