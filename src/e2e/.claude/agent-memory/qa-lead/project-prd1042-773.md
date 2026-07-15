---
name: project-prd1042-773
description: US 13.26 Reject Hard Delete of Referenced Partner (Epic 13) — system delete-guard, no Figma, delete-guard pair to US 13.25
metadata:
  type: project
---

# PRD1042-773 — US 13.26 | Partner Management | Reject Hard Delete of Referenced Partner

Processed 2026-07-09 under the [[feedback-manual-3-stage-pipeline]] (Figma + Jira → generator, no comparator). Epic 13 Partner Management. CP-12, November 2026 Release — Foundation. **Delete-guard pair to US 13.25 archival** ([[project-prd1042-772]]).

- **DoR:** PASS. 9 ACs (reconstructed/deduplicated from Functional/Field/Validation/System/Security/NFR + Edge-case sections — extract does not number ACs). Status "Ready for DEV Review". Assignee Iva Marković.
- **Figma:** N/A — no node supplied. System/delete-guard story; the only UI-observable surface is the Delete control **disabled/blocked for referenced Partners with an explanatory message** (arch notes; design shows delete only on Draft partners, disabled once references exist). Substance is the backend delete guard + security audit event.
- **Output:** `src/e2e/tests/PRD1042-24 Partner Management/PRD1042-773 Reject Hard Delete of Referenced Partner.md`. 4 scenario blocks (3 happy-path incl. 1 Outline + 1 main-error). Gherkin for 5 of 9 ACs.

## Guard-story framing

This is a REJECT guard: "happy path" = the guard correctly rejecting. **There is no successful hard-delete of a referenced Partner by design.** Core Outline rejects across operational reference types (Contract/Financing/Request/KYC/Regulatory Reporting). Fail-closed, backend-enforced, no override path (even Sys Admin → rejected). HardDeleteAttempted security audit event emitted on every attempt (actor/target/rejection/reference-evidence).

## Two OPEN questions (flagged to BA/PO — no scenarios, terminal only)

1. **OQ-08 (GDPR vs GwG/MaRisk):** platform policy for resolving GDPR erasure vs GwG/MaRisk retention conflicts on Partner records, and how resolution is evidenced. Recommendation = retention-precedence default with audit-recorded conflict resolution. Erasure execution mechanics owned by the **Löschkonzept epic**; Partner Management enforces precedence only → AC-07 classified `separate-feature`.
2. **Audit-trail-as-reference (Philipp Maute, 2026-06-18, UNCONFIRMED):** whether the append-only audit trail counts as a blocking reference. His reading (to confirm): block hard-delete only on **OPERATIONAL** references (contract/financing/request/KYC/regulatory reporting), **NOT** the audit trail alone — otherwise no Draft is ever deletable (every Draft has a creation event). For scenario purposes I treated "referenced" = operational references. The **unreferenced-Draft-deletable allow-path depends on this ruling** → AC-09 classified `edge-case`, no scenario until confirmed.

## Role gating largely N/A

Permission matrix is all-system ("—" for every role) — "reject hard delete" is a system guard, not a user action. So no role-gating Outline; the AC-05 "no override" scenario uses a privileged Sys Admin only to prove there is no bypass, not to test a permission grant.

## E2E readiness — 0 of 4 ✅

Greenfield E13, no Partner fixtures. Every scenario needs a seeded Partner carrying an operational reference (Contract/Financing/etc.), plus audit-read for the event assertion and a sys-admin session for the no-override scenario. All ⚙️.

## Cleanup note (this session)

Duplicate file risk: I first wrote `PRD1042-773 Reject Hard Delete.md` (short name), then the coordinator requested the longer `...Reject Hard Delete of Referenced Partner.md`. Both may exist — the Jupyter kernel was inactive so the short-named file could not be removed programmatically. If both are present, delete the short-named one; the long-named file is authoritative.

## Carry-over

- "Power User (Bank Admin)" appears in the permission matrix (all "—") and STILL has no UserRole enum mapping (recurring across E13).
