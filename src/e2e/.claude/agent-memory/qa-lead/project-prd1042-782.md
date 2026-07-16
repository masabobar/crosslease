---
name: project-prd1042-782
description: US 26.5 Audit Trail Old/New Value Capture & Sensitive-Field Masking, first story processed in Epic 26 Audit Trail folder path pattern PRD1042-37-Audit Trail
metadata:
  type: project
---

# PRD1042-782 — US 26.5 | AUDIT TRAIL | Old / New Value Capture & Sensitive-Field Masking

Processed 2026-07-10 through full 4-stage QA Lead pipeline.

- **Epic:** PRD1042-37 Epic 26: Audit Trail (parent)
- **Folder created (first Audit Trail file in this sub-agent session):** `src/e2e/tests/PRD1042-37-Audit Trail/`
- **File:** `PRD1042-782 Old-New Value Capture and Masking.md`
- **DoR:** PASS — 15 derived ACs (from Functional Requirements + Field Spec + Validation Rules + System Behavior + Security + Edge Cases). Stakeholder-reviewed by Philipp Maute (v1.2 approval 2026-05-29) and Marko Mrdja (2026-06-18 dev-side refinement proposal — NOT adopted in ticket, status still Ready for DEV Review).
- **Stage 2:** FAILED — MCP quota exhausted on View seat, no shell/REST fallback available in this session. Design-blind Stage 3.
- **Stage 3:** WARNINGS — 5 MAJOR design gaps (masked value affordance, privileged reveal affordance, read-only field-diff styling, integrityProtectedFlag banner, compliance-gap surfacing). Domain rules: 404-not-403 for cross-role (LC User) applied.
- **Stage 4:** 8 scenario blocks (2 Outlines + 6 Scenarios) — 5 happy-path + 3 main-error. E2E automation: 2 of 8 ✅ (AC-14 read-only field-diff view + AC-15 LC User 404). Remaining 6 need D-Audit-API for fault injection and record read seams.
- **Blocked:** AC-08 (privileged Auditor unmasking → D-Privileged-Path, US 26.9 backlog), AC-10 (integrityProtectedFlag → D-Audit-API fault injection), AC-11 (compliance gap on snapshot failure → D-Snapshot-Ref).
- **Excluded:** AC-05 (deltaType enum — Marko proposes dropping), AC-13 (NFR without numeric threshold).

## Key ambiguity flagged for BA/PO

Marko Mrdja's 2026-06-18 comment proposes dropping write-time masking, DiffCaptureService, SensitiveFieldMaskingService, deltaType, and integrityProtectedFlag — replacing with RBAC + tenant scoping + a `sensitive` boolean flag. If adopted, AC-05, AC-07, AC-08, AC-09, AC-10, AC-12 all shift materially. Test suite was written to the CURRENT ticket spec (Vesna's v1.2), not Marko's proposed revision.

## Domain semantics captured

- Audit records are tenant-scoped; cross-role/cross-tenant returns 404 (never 403).
- Standard view = masked for all roles including bank-side admin/front/back/support.
- Privileged unmasking is a SEPARATE governed access path (US 26.9 Audit-of-Audit tracks the reveal itself).
- Large-value fields = entity-ID + version reference, never inline.
- Unclassified sensitive fields default to masked + raise classification gap.
