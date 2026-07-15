---
name: project-prd1042-770
description: US 13.23 Search & Filter Partner Registry (Epic 13) — read-only search/filter story, processed under 3-stage manual flow
metadata:
  type: project
---

# PRD1042-770 — US 13.23 | Partner Management | Search & Filter Partner Registry (Bank-Internal)

Processed 2026-07-08 under the [[feedback-manual-3-stage-pipeline]] (Figma + Jira → generator, no comparator). Part of Epic 13 Partner Management ([[project-prd1042-747]] is the epic's first story).

- **DoR:** PASS. 14 ACs (reconstructed from Functional/Field/Validation/System/Security/NFR sections — the extract does not number ACs explicitly). Status "Ready for DEV Review". Assignee Iva Marković.
- **Figma:** PARTIAL. Node 235:28523 = the **second E13 scope-legend card** (lists 770/751/760/766/759/774), not a screen frame. FE surface per arch notes: registry search grid + filter bar, KYC filter conditionally rendered. The real grid/filter-bar frame lives under a `21:xxxxx` node that the claude.ai Figma MCP could not enumerate from the legend card. Scenarios driven from ACs.
- **Output:** `src/e2e/tests/PRD1042-24 Partner Management/PRD1042-770 Search and Filter Partner Registry.md`. 6 scenario blocks (4 happy-path incl. 2 Outlines + 1 empty-state Scenario; 2 main-error). Gherkin for 11 of 14 ACs.

## Read-only story — no events, no audit-on-read

Search is read-only: no event emission, no audit on read. So unlike most E13 stories there are NO event/audit ACs to exclude. The only excluded ACs are two genuine edge-cases: AC-12 (query-layer scope enforcement — internal, asserted indirectly via AC-13) and AC-14 (NFR 2s performance).

## Scenario shape

- Happy-path Outline over 6 single-dimension filters (Status, Role, Country, UBO Status, Confirmation Status) — asserts tenant-scoped + server-side (AC-01/02/03/04/05/07/08).
- AND-composition scenario (AC-10): two filters → intersection, never widen.
- KYC Outcome conditional-rendering Outline (AC-06/11): visible when KYC module active, hidden when deactivated. KYC module state read from **E29 module activation**.
- Empty-state scenario (AC-01): valid search, no matches → empty state, no error.
- Main-error: invalid enum filter → HTTP 400 (AC-09).
- Main-error: LC excluded from registry-wide search → out-of-scope read → **404 not 403** (AC-13, tenant/role isolation), cross-dependency on **US 13.24** (LC isolation).

## E2E readiness — 1 of 6 ✅

Greenfield E13, no Partner registry fixtures. Only AC-09 (invalid enum → 400) is ✅ (authenticated FO session + malformed query param, no partner data needed). All others ⚙️: filter/AND/empty-state need a seeded multi-status registry; KYC conditional needs an E29 KYC-module toggle + tenant fixtures; LC isolation needs an LC user + own-submission fixtures (D20-style second scope).

## Carry-overs

- "Power User (Bank Admin)" has "Diagnostic" registry-search access and STILL has no UserRole enum mapping (recurring across E13 — see [[project-prd1042-749]], [[project-prd1042-764]]).
- Cross-dependency on **US 13.24** for LC own-submission isolation (AC-13 asserts the 404 boundary but the own-submission scope itself is defined there).
