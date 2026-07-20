---
name: project-prd1042-792
description: US 26.15 Hash-Chain Integrity Verification story processed; Optional MVP; heavy back-end, 21 derived ACs, DoR PASS
metadata:
  type: project
---

**PRD1042-792 — US 26.15 | AUDIT TRAIL | Hash-Chain Integrity Verification (Optional MVP)**

**Processed:** 2026-07-10
**Epic:** PRD1042-37 (Epic 26: Audit Trail)
**Stage 1:** DoR PASS — 21 synthesized ACs from Functional Requirements + Validation Rules + Permission Matrix; description present; spec v1.2 stakeholder-approved 2026-05-29; grooming decision 12.06 keeps as Optional MVP; Client Approved 16.06 (Philipp Maute)
**Stage 2:** FAILED — Figma MCP Professional-plan quota exhausted; canvas 1:11090 not fetchable this session; extraction blind on FE surface (single read-only Platform Auditor integrity-verification view per description)
**Stage 3:** WARNINGS — MAJOR design gap (no captured view copy); domain rules applied (role-based access AC-12/18, tenant isolation AC-11/15, async op AC-05/09/20 blocked pending D-EventBus + D-Alert-Queue)
**Stage 4:** 6 scenario blocks (2 Outlines + 4 Scenarios), 8 of 21 ACs get Gherkin, 6 Blocked, 7 excluded (edge-case/separate-feature)

**Key facts (source-of-truth for future retrofits):**

- Optional MVP per OQ-AT-02 default; hash-chain infra mandatory, tenant activation optional (Vesna 12 June + Philipp 16 June — hold for Markov-DORA-pass)
- Verification API: `GET /audit/integrity/verify/{entityId}` — platform Auditor only
- Permission Matrix (Story Description, verbatim):
  - Compute hash chain on INSERT: System (only)
  - Invoke verification API: System/Power User + Auditor (platform-level)
  - Modify hash-chain node: NOBODY
  - FO / BO / Support / LC User: all `✗`
- Chain semantics: `chainSequence = prev_max + 1`, `recordHash = SHA-256(canonical(record))`, `previousRecordHash = hash(prior_record_for_same_entity)`
- Validation rules (AC-AT-H1/H2/H3): untampered → valid; modified → hash mismatch; deleted → chain gap
- `integrityProtectedFlag` semantics owned by US 26.08 (PRD1042-785) — separate-feature
- Emits event `audit.integrity.tamper.detected` (Blocked pending D-EventBus)
- TAMPER_DETECTED audit entry classified Regulatory Critical (10y + purge-prohibited per Epic 26 §retention v1.2)

**Blocked ACs (6):**

- AC-05 (gap → alert): D-EventBus + D-Alert-Queue
- AC-07 (modify → mismatch): backend hash-forge harness (post-November per grooming)
- AC-09 (immediate alert): D-Alert-Queue + D-Audit
- AC-14 (write latency ceiling): D-Performance-Harness (non-E2E)
- AC-20 (event emission): D-EventBus
- AC-21 (TAMPER_DETECTED audit entry): PRD1042-37 audit-log query API

**Excluded ACs (7, edge-case or separate-feature):** AC-01, AC-02, AC-03, AC-10, AC-13, AC-16, AC-17

**Gherkin generated for:** AC-04, AC-06, AC-08, AC-11, AC-12, AC-15, AC-18, AC-19

**Scenario roster:**

1. `@happy-path` Scenario Outline (2 rows: Auditor, System/Power User) — chain-valid response
2. `@happy-path` Scenario — API response contract (entityId, integrityStatus, chainSequence, verifiedAt)
3. `@main-error` Scenario — chain gap detection (AC-AT-H3)
4. `@main-error` Scenario — tenant chaining-off returns "chaining not enabled"
5. `@main-error` Scenario Outline (4 rows: FO, BO, Support, LC User) — 403 RBAC — `@e2e-ready`
6. `@main-error` Scenario — client-supplied hash-chain modification rejected (immutability)

**E2E automation candidates:** only AC-12/18 RBAC 403 Outline is `@e2e-ready`; all others need D-Audit + PRD1042-1027 FE view + backend test-fixture

**Domain rule note — role-based access:** Story description explicitly says non-Auditor roles cannot invoke verification API; I applied 403 (RBAC) not 404 (tenant isolation) because verification API is a platform-scoped resource, not a tenant-scoped record. Bank Admin (`bank_admin`) NOT in permission matrix — treated as no-access (would 403); not added to Outline pending explicit matrix update from Ivan Mladenovic since scope is platform-only.

**Related epic children:** PRD1042-1026 (BE), PRD1042-1027 (FE), PRD1042-1028 (QA) — QA subtask empty, this .md serves it.
