---
name: project-prd1042-784
description: US 26.7 Temporal Integrity & Immutable Timestamp Enforcement — DoR PASS 11 derived ACs, Stage 2 FAILED (Figma quota), 5 scenario blocks, 2 Blocked (D-Clock-Skew-Config + D-Ops-Alert), all @e2e blocked on D-Audit-API
metadata:
  type: project
---

Story: PRD1042-784 (US 26.7 | AUDIT TRAIL | Temporal Integrity & Immutable Timestamp Enforcement).
Epic: PRD1042-37 Audit Trail (folder `PRD1042-37-Audit Trail`).
Jira status: Ready for DEV Review, moved to Client Approved by Philipp Maute 2026-06-16 comment 37245.

**Why:** Cross-cutting backend enforcement story — no dedicated FE surface. Investigation surface is owned by sibling stories (US 26.10 investigation, US 26.15 hash-chain). Design gaps do not block generation; test all behaviour at API/persistence layer.

**How to apply:**

- Stage 2 FAILED (Figma MCP quota exhausted; WebFetch cannot pass X-Figma-Token) — treated as PARTIAL not BLOCKED per [[feedback-figma-link-not-bubbled]] pattern (no FE surface anyway)
- 11 ACs derived: AC-01 UTC assignment (happy-path), AC-02 client TS ignored (main-error), AC-03 deterministic ordering (happy-path), AC-04 immutability (main-error), AC-07 no API param permits caller TS (main-error, merged with AC-02 Outline), AC-11 RBAC uniform 6-role Outline (main-error)
- Blocked: AC-08 (monotonicity — needs clock-skew tolerance config), AC-10 (drift alerting — internal ops flow)
- Edge/separate-feature (no Gherkin): AC-05 (async ordering, dup of AC-03), AC-06 (NTP/infra), AC-09 (same-ms disambiguation, covered by AC-03)
- 5 scenario blocks: 2 Outlines (AC-02/07 × 3 field aliases; AC-11 × 6 roles) + 3 Scenarios
- Marko Mrdja BE alignment 2026-06-18 comment 37523: chainSequence proposed to be replaced by `audit_seq` IDENTITY column — tests written at behaviour level ("distinct disambiguation-sequence values", "second action's record follows the first") to tolerate either name
- Iva Marković review 2026-06-10 comment 36754 flagged questions/assumptions block — ASSUMPTION captured: all timestamps stored in UTC, tenant-local rendering is display-only
- All 5 scenarios are ⚙️ needs D-Audit-API — no public read/write audit endpoint yet exposed for temporal-integrity assertions; AC-04 additionally needs D17 (test-forge equivalent for attempting UPDATE via admin surface)
- File written: `src/e2e/tests/PRD1042-37-Audit Trail/PRD1042-784 US 26.7 Temporal Integrity.md`

Related: [[project-prd1042-46]] and [[project-prd1042-47]] — sibling backend-security stories with same "no FE, all backend enforcement" shape.
