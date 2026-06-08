---
name: project-prd1042-71
description: PRD1042-71 US 28.4 User List View — full pipeline complete twice, WARNINGS, 9 scenario blocks, LC User nav gap, read-only row gap
metadata:
  type: project
---

PRD1042-71 (US 28.4 | User Management | User List View) completed full pipeline re-run 2026-06-03 (original run 2026-06-02).

**DoR:** PASS — 14 ACs, description present, stakeholder-reviewed. Status updated to "QA ready" (was "Dev in progress" on first run). Child tickets: BE/FE/QA/UI-UX all in QA in progress or Dev in progress.

**Figma:** PARTIAL — single screen node 2162:6928 in file j5hq5cQgHWdOtzLvSX0jvj. Rate limit hit on sub-node extraction (Figma MCP View seat limit). Top-level node metadata confirmed: Sidebar, Navbar, Title, Actions bar (search input + 5 filter buttons + Export button), Table (7 columns, 12 data rows), Pagination (Previous/1/2/.../Next). Status column cells (col 3 and col 6) confirmed present but text/color variants not extractable. No empty/loading/error states. No role-variant nav.

**Stage 3:** comparison_status WARNINGS — 4 MAJOR mismatches, 0 CRITICAL, no blockers:
- M-01 MAJOR: No LC User sidebar nav variant designed (AC-03)
- M-02 MAJOR: Status badge color variants for Expired/Locked/Archived unconfirmed (AC-04)
- M-03 MAJOR: No read-only row/actions variant for Support or Auditor (AC-10)
- M-04 MAJOR: No expired-engagement UI state for Auditor (AC-09) — excluded as separate-feature

**Stage 4:** 9 scenario blocks generated (1 Outline + 8 Scenarios)
- happy-path: AC-01+AC-04 (Outline 3 roles), AC-06 (sorting), AC-07 (pagination), AC-14 happy (export trigger)
- main-error: AC-02 (tenant isolation 404), AC-03 × 2 (nav hidden + route blocked for LC User), AC-10 (read-only enforcement Outline 2 roles), AC-14 main (cross-tenant export blocked)
- Excluded as edge-case: AC-05, AC-08, AC-11, AC-13
- Excluded as separate-feature: AC-09, AC-12

**Confirmed domain rules applied:**
- LC User → entire module invisible (no nav link, no route, no placeholder) — AC-03
- Tenant isolation → cross-tenant request returns 404 not 403 — AC-02
- Support + Auditor → read-only; modification actions suppressed — AC-10

**Open questions requiring resolution:**
- AMB-02: Does direct LC User URL access return 404 or redirect silently? (BA)
- AMB-03: Export format — CSV/XLSX/both? Format dialog or immediate download? (Designer/BA)
- Column 7 (32px): bulk actions scope not confirmed — checkbox or row icon? (BA)

**Output file:** src/e2e/tests/User Management/PRD1042-71 User List View.md

**Why:** User List View is the primary administrative interface; tenant isolation and role access are critical compliance properties for DACH banking regulation context (MaRisk / BAIT).
**How to apply:** When processing follow-on stories (User Detail View, User Create, User Edit), expect role-variant design gaps to recur; flag proactively at Stage 2. Figma View seat rate limit consistently hit on sub-node deep extraction — plan for top-level metadata only and supplement with screenshot.

Related: [[project-prd1042-39]] (Epic 28), [[feedback-figma-design-convention]], [[project-prd1042-73]] (User Detail View)
