---
name: project-prd1042-587
description: PRD1042-587 US 29.6 Module Deactivation per Tenant — 16 ACs, DoR PASS, Stage 2 SUCCESS (design-verified re-run 2026-07-07 via REST API nodes 93:20741 + 93:20742), Stage 3 WARNINGS, 5 scenario blocks, 4 Blocked ACs (governance drift + D-Enforcement), fail-open deactivation contrast with fail-closed activation
metadata:
  type: project
---

PRD1042-587 (US 29.6 | TENANT MANAGEMENT | Module Deactivation per Tenant) processed 2026-07-07 (re-run with design data — supersedes design-blind v1).

**DoR:** PASS — 16 ACs, QA in progress, sub-stories PRD1042-665 (BE) + PRD1042-666 (FE) + PRD1042-670 (QA).

**Stage 2:** SUCCESS — design-verified via REST API. Canvas 93:12429 "Module Activation/Deactivation" (file 7pygkopuqyeEhUTMVp9lrP), sections 93:20741 (MODULE DEACTIVATION) + 93:20742 (DEPENDENCY CONFLICTS). Verbatim copy captured:

- Modal card-title: "Deactivate module"
- Fields: Module name (read-only, e.g. "Reporting & dashboards"), Current status (badge), Dependency check result (helper "Required for Auditor users only")
- Cancel button: "Cancel"
- Submit button: "Submit for deactivation"
- Success card: "Deactivation confirmed" / "Reporting is now inactive."
- NO "View profile" link on success (validates fail-open UX contract — no sync-pending indicator, unlike activation)

**Remaining design gaps (MAJOR, logged):**

- Justification field (AC-07 min 20 chars) NOT visible in extracted modal frames — may live on separate step or missing from design
- Dependency conflict list specific per-row copy not captured (section exists but dynamic content)

**Stage 3:** WARNINGS — governance drift (AC-03/AC-04) escalated to Blocked; other MAJOR mismatches upgraded from design-blind to design-verified with copy anchors.

Critical governance drift preserved from v1: AC-03/AC-04 story text says "no countersignature, immediately Inactive" but Ivan Mladenovic (2026-06-03) mandated Four-Eyes symmetric with activation. Vesna confirmed update applied but AC wording never rewritten. AC-03/AC-04 Blocked pending PO rewrite + PRD1042-77 wiring.

Key domain asymmetry confirmed (Vesna Plakalovic 2026-06-05) and NOW design-anchored:

- Activation (PRD1042-586): FAIL-CLOSED — waits for enforcement sync before module goes Active
- Deactivation (PRD1042-587): FAIL-OPEN — module immediately Inactive after dependency check; enforcement removal async with retry
- Design evidence: deactivation success card shows "Reporting is now inactive." with no "View profile" link (vs activation's PRD1042-586 pattern) — confirms no pending-enforcement indicator

**Justification min-length:** 20 chars for deactivation (vs 10 chars for activation PRD1042-586) — asymmetry flagged for PO confirmation (A-02). Design gap: field itself not in extracted frames.

**Stage 4:** 5 scenario blocks (same structure as v1 but with design-verified copy assertions).

- 1 happy-path Outline (AC-01/06/07/08): System Admin deactivates Active module with no conflicts — now asserts modal title "Deactivate module", Submit label "Submit for deactivation", success card "Deactivation confirmed" + "<module> is now inactive.", no "View profile" link
- 3 main-error Scenarios: Justification <20 chars (AC-07, design gap noted), Dependency conflicts block + Submit disabled (AC-02/10/11, design-verified panel presence), Module not Active (AC-09)
- 1 main-error Outline @e2e-ready: Non-System Admin roles receive 404 (AC-16, 4 role variants)
- 4 Blocked (no Gherkin): AC-03/04 governance drift, AC-12/14 D-Enforcement
- 3 excluded: AC-05 (separate-feature), AC-13 (edge-case race-condition), AC-15 (separate-feature audit events)

**E2E automation candidates:** 1 of 5 (AC-16 RBAC Outline only — other 4 need module state + dependent workflow seeding).

**Output file:** src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-587 Module Deactivation.md (design-verified overwrite of v1).

**Why:** [[project-prd1042-586]] (activation) and this story are symmetric pair; enforcement asymmetry is a deliberate design decision per Vesna and now design-anchored. Four-Eyes governance question (A-01) must be resolved before AC-03/04 can be unblocked. Design re-run demonstrates that REST API extraction succeeds where MCP hits rate limits — see [[project-prd1042-583]] and [[project-prd1042-585]] for same pattern.
