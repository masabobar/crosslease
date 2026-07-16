---
name: project-prd1042-779
description: PRD1042-779 US 26.2 Audit Event Reception & Validation — first story processed in Epic 26 Audit Trail; backend service-to-service story, Frontend None, Stage 2 SKIPPED design-blind, architecture pivot per Marko Mrdja 2026-06-18 drops outbox/DLQ/duplicate-detection/MISATTRIBUTION_REJECTED
metadata:
  type: project
---

**PRD1042-779** — US 26.2 | AUDIT TRAIL | Audit Event Reception & Validation

- **Epic:** PRD1042-37 (Epic 26: Audit Trail) — first story processed from this epic
- **Epic folder:** `src/e2e/tests/PRD1042-37-Audit Trail/`
- **File:** `PRD1042-779 Audit Event Reception & Validation.md`
- **DoR:** PASS (functional + validation + security + edge-case ACs)
- **Stage 2:** SKIPPED design-blind — Architectural Notes explicitly say "Frontend: None". Shared E26 canvas (node 1:11090) covers UI-facing US 26.10/26.11/26.15, NOT the internal `POST /audit/events` service-to-service endpoint.
- **Stage 3:** WARNINGS (design-blind + architecture-pivot ambiguities)
- **Stage 4:** 5 scenario blocks (2 Outlines + 3 Scenarios), 3 Blocked ACs (D-AuditEmitter, D-CircuitBreaker, D17)

**Critical architecture pivot — Marko Mrdja comment 37516 (2026-06-18):** v1.2 architecture collapsed the three-service model (Reception + Validation + Persistence) into a single **AuditService** with three recording methods:

1. in-transaction (default — audit INSERT in same DB tx as business op)
2. isolated-transaction (for events that must persist when main tx rolls back — permission-denied, cross-tenant attempts)
3. synchronous (Celery background tasks)

**Dropped per pivot (do NOT test these):**

- Duplicate detection via correlationId uniqueness (multiple audit events per request are legitimate — OTP + login share correlationId)
- MISATTRIBUTION_REJECTED audit event type
- DUPLICATE_EVENT_DETECTED audit event type
- Dead-letter queue
- Outbox path (US 26.20 backlog — separate feature)
- Idempotency under retry via correlationId

**Kept (still testable):**

- CROSS_TENANT_WRITE_BLOCKED — but only on the READ path, since application code cannot construct cross-tenant WRITE (tenantId is server-derived)
- Sync in-transaction recording — happy path visible via governed action (login) + Auditor read verification
- Reception endpoint not exposed to operational roles or LC — 404 uniform across all 7 platform roles (per tenant-isolation constraint #5)

**Testing rules to reuse for other Audit Trail stories:**

- Reception endpoint (`POST /audit/events`) is internal — every operational user gets 404, not 403
- Cross-tenant read attempts → 404 + CROSS_TENANT_WRITE_BLOCKED audit event (readable only by Auditor/Compliance)
- INSERT-only DB permission enforcement (application service account has INSERT + SELECT only, no UPDATE/DELETE) is Regulatory Critical per Epic 26 + Philipp comment 34102
- 7-role RBAC: system_admin, bank_admin, front_office, back_office, support_user, auditor, lc_user

**Open Questions:**

- OQ-AT-01: Fail-closed applies to state-mutating governed actions only (V1 default assumption); non-governed reads are best-effort — impacts scope of future US 26.x reception scenarios
- Spec still references old three-service architecture; ALWAYS test the v1.2 implemented model (per BE story PRD1042-987 "QA ready")

**Related backlog stories in this epic (per Philipp comment 37245, 2026-06-16):**

- US 26.8 (Retention Policy Computation) — GoBD §147, Markov-DORA watchlist
- US 26.13 (Retention Governance Scheduler) — archival volumina
- US 26.14 (Fail-Closed Audit Circuit Breaker) — DORA Art. 9, watchlist
- US 26.16 (Financing audit coverage) — AnaCredit/BaFin
- US 26.17 (Contract Events + Redemption audit coverage)
- US 26.20 (Outbox Pattern) — deferred per architecture pivot

**MVP scope cuts confirmed by Philipp comment 35785 (2026-05-29):**

- Hash-chain: schema fields only in MVP (recordHash, previousRecordHash, chainSequence nullable) — chain computation + verification API deferred to V2
- Investigation surface minimal: entity-scoped Audit Tab + simple global filters only; bookmarks + Session Access Log view + Hash Chain Verification UI → V2
- Retention: 2 categories in MVP (Standard 10y purgeable + Regulatory Critical 10y purge-prohibited) — 3-category model → V2 if needed
- actor_type enum reduced to 5 active values in MVP (`manual_user`, `system_scheduler`, `integration_callback`, `system_lifecycle`, `migration`) — `system_dd_counter` and `system_propagation` reserved (declared not emitted) until engines built

Links: [[project-prd1042-37]] (epic parent, to be created), [[project-prd1042-599]] (sibling backend-only-no-UI precedent)
