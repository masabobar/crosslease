---
name: project-prd1042-772
description: US 13.25 Archive Partner (Epic 13) — lifecycle-termination with pre-archival reference check + Four-Eyes for risk-role Partners
metadata:
  type: project
---

# PRD1042-772 — US 13.25 | Partner Management | Archive Partner (Referential Integrity Preserved)

Processed 2026-07-09 under the [[feedback-manual-3-stage-pipeline]] (Figma + Jira → generator, no comparator). Epic 13 Partner Management ([[project-prd1042-747]] is the epic's first story). CP-12, November 2026 Release — Foundation.

- **DoR:** PASS. 12 ACs (reconstructed/deduplicated from Functional/Field/Validation/System/Security/NFR + Edge-case sections — extract does not number ACs). Status "Ready for DEV Review". Assignee Iva Marković.
- **Figma:** PARTIAL. Node 235:28534 = the **fifth E13 scope-legend card** (lists 747/751/760/764/766/772), not a screen frame. The ARCHIVE action + "Active references found" + DOWNSTREAM IMPACT (Contracts/Financings affected) cluster is **corroborated in the real 764 frame at node 21:11234** — so the archival + reference-check UI is confirmed present, just not enumerable from the legend card. Scenarios driven from ACs.
- **Output:** `src/e2e/tests/PRD1042-24 Partner Management/PRD1042-772 Archive Partner.md`. 6 scenario blocks (1 happy-path Scenario + 5 main-error incl. 1 Outline). Gherkin for 9 of 12 ACs.

## Model

- API `POST /api/partners/{id}/archive` (+ a counter-confirm endpoint for risk-role Partners). PartnerLifecycleService; entities Partner (Archived), PartnerLinkageReference.
- **Archived is a lifecycle state, NOT a hard delete** — historical references and audit remain intact. The hard-delete REJECTION itself is **US 13.26** → classified `separate-feature` here (AC-12).
- Pre-archival **Active-Reference Check** returns Clear / Blocked (system-computed against linking modules; authoritative-by-reference). Clear → archival proceeds; Blocked → archival rejected, blocking refs surfaced.
- **Four-Eyes for risk-role Partners:** same FO-initiates / BO-Risk-counter-confirms split as [[project-prd1042-752]] (13.06), [[project-prd1042-757]] (13.11), [[project-prd1042-761]] (13.15). Non-risk-role Partner → FO archives single-actor. Risk-role → held for BO/Risk counter-confirm; same-user SoD negative auto-applied.
- Emits **PartnerArchived** → Notification bus (E31 Part A) + Audit Trail. Event emission classified `edge-case` (asserted indirectly via the audit assertion).

## Scenario shape

Happy: FO archives Clear + Reason → Archived, refs+audit preserved (AC-01/02/03/04). Main-error: blocked-refs (AC-05); risk-role held for Four-Eyes (AC-06); same-user counter-confirm rejected (AC-07); idempotent re-archive no-op (AC-08); role-gating 403 Outline (AC-09).

## E2E readiness — 0 of 6 ✅

Greenfield E13, no Partner fixtures. Every scenario needs a seeded Partner in a specific state: Confirmed-with-zero-active-refs (happy), Partner-with-active-Contract/Financing-ref (blocked), risk-role-bearing Partner (Four-Eyes ×2), already-Archived Partner (idempotent), any seeded Partner + per-role users (role gating — a partner id is needed so 403 resolves before 404). All ⚙️.

## Deferred / cross-epic (context, no scenarios)

- **OQ-06:** automatic archival idle window (no active refs / no active KYC obligation); per-role differentiation deferred Post-MVP; MVP needs a platform-default value.
- **OQ-07:** LC suspension cascade on archival of an LC Partner (interacts with Framework Agreement OQ-05) — cross-epic alignment, affects LC-side lifecycle.

## Carry-over

- "Power User (Bank Admin)" appears in the permission matrix (Archive ✗ / Counter-confirm ✗) and STILL has no UserRole enum mapping (recurring across E13 — see [[project-prd1042-749]], [[project-prd1042-764]], [[project-prd1042-770]]).
