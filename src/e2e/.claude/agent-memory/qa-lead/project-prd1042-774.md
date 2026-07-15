---
name: project-prd1042-774
description: US 13.27 Auditor Reconstruction of Partner Decisions (Epic 13) — read-only full-decision-history audit reconstruction, broader sibling of 759
metadata:
  type: project
---

# PRD1042-774 — US 13.27 | Partner Management | Auditor Reconstruction of Partner Decisions

Processed 2026-07-09 under the [[feedback-manual-3-stage-pipeline]] (Figma + Jira → generator, no comparator). Epic 13 Partner Management. CP-13, November 2026 Release — Foundation.

- **DoR:** PASS. 11 ACs (reconstructed from Functional/Field/Validation/System/Security/NFR + Edge-case sections — extract does not number ACs). Status "Ready for DEV Review". Assignee Iva Marković.
- **Figma:** PARTIAL. Node 235:28523 = the **second E13 scope-legend card** (lists 770/751/760/766/759/774), not a screen frame. FE surface = Auditor decision-timeline view (read-only). Real timeline frame lives under a 21:xxxxx node, not enumerable from the legend card. Scenarios driven from ACs.
- **Output:** `src/e2e/tests/PRD1042-24 Partner Management/PRD1042-774 Auditor Reconstruction of Partner Decisions.md`. 5 scenario blocks (3 Outlines + 2 Scenarios; 2 happy-path + 3 main-error). Gherkin for 6 of 11 ACs (AC-01/02/03/04/05/06/07 — AC-02 folded into AC-01).

## Sibling relationship with 759

**Broader sibling of US 13.13 ([[project-prd1042-759]], Reconstruct Full Merge History).** 759 covers the MERGE lineage specifically; 774 covers the FULL decision history (creation → confirmation → role transitions → identity changes → merges → archival). SAME read-only auditor reconstruction pattern and SAME permission matrix. The Merged-source variant here (AC-04, forward reference to survivor) overlaps 759's merge-history reconstruction — keep both (759 is merge-specific depth; 774 is full-history breadth).

## Read-only auditor pattern

- Reconstruction from the **Audit Trail alone** — evidence independent of live operational state. Works for Archived (archival does not delete events) and Merged-source (reconstructable + forward reference to survivor).
- Decision Timeline = chronological append-only events, each with **actor evidence**.
- **No event emission** (read-only, no mutation). Auditor access session is logged (AC-09 edge-case).
- **Permission matrix:** Auditor ✓ + Sys Admin ✓ (read-only) + Power User (Bank Admin) = **Diagnostic**; FO / BO-Risk / LC = ✗ → 403. Tenant-scoped within engagement window; out-of-scope → **404 not 403**.

## Scenario shape

Happy: allowed-roles Outline (Auditor/SysAdmin/Power User) reconstruct full chronological timeline w/ actor evidence (AC-01/02/05-allowed); independence-from-live-state Outline (Archived / Merged-source) (AC-03/04). Main-error: denied-roles 403 Outline FO/BO/LC (AC-05); read-only no-mutation (AC-06); out-of-scope 404 (AC-07).

## E2E readiness — 0 of 5 ✅

Greenfield E13, no Partner fixtures AND no seeded audit-event history. Reconstruction needs a Partner with a rich seeded governance history (creation→confirmation→role→identity→merge→archival); Archived/Merged variants need those states seeded; out-of-scope 404 needs a second scope (D20-like); read-only no-mutation is hard to assert positively in E2E. All ⚙️.

## Carry-over

- "Power User (Bank Admin)" has **Diagnostic** reconstruction access here and STILL has no UserRole enum mapping (recurring across E13 — see [[project-prd1042-749]], [[project-prd1042-764]], [[project-prd1042-770]]). In the happy Outline I used the label "Power User" as the role value pending the enum decision.
