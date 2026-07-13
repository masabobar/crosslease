---
name: project-prd1042-781
description: US 26.4 Actor Provenance Enforcement processed (Epic 26 Audit Trail); DoR PASS, Figma PARTIAL (shared Audit Trail Table node 1:11090), Stage 3 WARNINGS, 8 scenario blocks + 2 Blocked
metadata:
  type: project
---

**PRD1042-781 — US 26.4 | Audit Trail | Actor Provenance Enforcement & Misattribution Prevention**

Processed 2026-07-10 through full 4-stage QA Lead pipeline.

**Story shape:** Backend/security enforcement — closed `actor_type` enumeration (7 values: `manual_user`, `system_scheduler`, `system_dd_counter`, `system_propagation`, `integration_callback`, `system_lifecycle`, `migration`), server-authoritative provenance validation, misattribution rejection with permanent evidence record (`actor_type = system_lifecycle`, `actionType = misattribution_rejected`).

**Epic:** PRD1042-37 — Epic 26: Audit Trail. Folder `PRD1042-37-Audit Trail/` created (first Audit Trail story processed in this session set to write to that path).

**DoR PASS:** 13 ACs derived from Functional Requirements + Validation Rules + System Behavior + Security Requirements + Edge Cases. Description present. Stakeholder-reviewed by Philipp Maute (comment 34102 — closed enum recommendation) + Marko Mrdja (comment 37518 — proposes splitting actor_type + trigger_source, dropping PrincipalResolutionService; NOT yet agreed).

**Stage 2 PARTIAL:** Shared Figma design node 1:11090 (file `7EkiVhANXOkn65k0jG4uEJ`) is an Audit Trail Table (Investigation Surface) with Timestamp + Status columns visible in fetched depth. MCP rate-limited on second call. This is a backend/enforcement story — no UI surface for actor_type validation or misattribution rejection. Read-only investigation surface is design-covered; enforcement mechanics are backend.

**Stage 3 WARNINGS:**

- MAJOR: No visible `actor_type`/`principal_id` columns confirmed in fetched depth (may exist in deeper nodes)
- MAJOR: No misattribution_rejected filter/badge in design
- MINOR: Governance-approval workflow for enum expansion (AC-04) is separate-feature
- Ambiguities: OQ-AT-06 (migration event attribution) unresolved; Marko Mrdja's split-field proposal not adopted

**Scenario blocks: 8 (2 Outlines + 6 Scenarios)**

- happy-path × 3: closed-enum acceptance (7 variants), manual_user principal + role capture (3 role variants), system service identity for system events
- main-error × 5: unknown actor_type rejected (5 variants), unresolvable principal_id rejected, system process attempting manual_user rejected + evidence written (canonical AC-07), payment_default_flag_raised never returned as manual_user (AC-08 canonical read-side contract), client-supplied actor_type discarded (AC-10 server-authoritative)

**Blocked (2):**

- AC-09 (misattribution evidence permanent persistence) — D-AuditQuery (audit read API)
- AC-11 (system identity segregation from human identifiers) — D-SystemHarness (test client for system service identity)

**Excluded (3):**

- AC-04 (enumeration expansion governance) — separate-feature (governance workflow story)
- AC-12 (latency NFR) — edge-case (perf test, not E2E BDD)
- AC-13 (specific engine → actor_type wiring) — edge-case (verified in producer stories, e.g. US 26.6)

**E2E automation candidates: 1 of 8** — only AC-10 (client-supplied override) is directly assertable via UI/API without additional test infrastructure. The other 7 scenarios need audit read API (D-AuditQuery) and/or system-identity test harness (D-SystemHarness).

**Backend-comment risk (per Marko Mrdja 2026-06-18 comment 37518):** Dev has proposed dropping `MISATTRIBUTION_REJECTED` and `PrincipalResolutionService` as first-class concepts and using JWT-context-based ActorContext instead. Spec-vs-implementation drift may occur — flag if AC-07 (misattribution evidence record) is dropped from implementation, test would need to be marked pending or rewritten against new contract.
