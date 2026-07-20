---
name: project-prd1042-783
description: US 26.6 System-Generated Event Attribution — 15 derived ACs, DoR PASS, Stage 2 FAILED (Figma quota + MCP limit), Stage 3 WARNINGS, 5 scenario blocks, first Audit Trail (Epic 26) story processed
metadata:
  type: project
---

**PRD1042-783 US 26.6 | AUDIT TRAIL | System-Generated Event Attribution** — first story processed in Epic 26 (PRD1042-37 Audit Trail), 2026-07-10.

**DoR:** PASS — 15 ACs derived from Functional Requirements (5) + Validation Rules (3) + System Behavior (3) + Security (1) + Edge Cases (3). Description clear; stakeholder review by Iva Marković (36753), Philipp Maute (34102, 35591, 35785, 37245), Marko Mrdja (37521). Jira status: Ready for DEV Review.

**Stage 2:** FAILED. Shared Figma design URL (`7EkiVhANXOkn65k0jG4uEJ` node `1:11090` — E26 -- Audit Trail) not reachable this session — Figma quota exhausted on Professional View seat, MCP tool limit hit, no Bash tool available for REST curl fallback. This is a backend attribution / provenance story with no UI surface in MVP anyway — Marko Mrdja 37521 explicitly dropped adapter services and confirmed "attribution is a convention, not infrastructure — any automated process sets actor_type + trigger_source when calling the audit service".

**Stage 3:** WARNINGS. No CRITICAL blockers.

- **MAJOR** AC-08 `financingVersionRef` explicitly dropped by Marko 37521 → `separate-feature` (returns with US 26.16 Financing coverage).
- **MAJOR** `system_dd_counter` + `system_propagation` enum values reserved but not emitted in MVP per Philipp smart-cut #5 (35591, approved 35785) → AC-02/03/09 `Blocked` on US 26.16/17 DD-Counter + Risk-Propagation engines.
- **MAJOR** "Pre-built investigation view: all system-generated default flags" → V2 per Philipp smart-cut #3 (approved 35785) → belongs to US 26.15 Investigation Surface.
- **MINOR** OQ-AT-04 retention category for scoring events — deferred to Compliance + Risk Lead pre-V1 freeze; assumption baked (scoring-events-that-influence-credit-decision = Long-Retention).

**Stage 4:** 5 scenario blocks (3 happy-path Outlines + 2 main-error).

- happy-path: AC-01/AC-10 scheduler Outline (rate_lock_expiry + retention_evaluation variants), AC-04 integration_callback Outline (core_banking + kyc variants), AC-05 system_lifecycle Outline (completion_eligible + conditions_pending variants).
- main-error: AC-06+AC-12 merged security invariant Outline (no `manual_user` masquerade across 3 active MVP actor_types), AC-13 rejected scheduler event with unresolved service identity.
- **Blocked** (5): AC-02, AC-03, AC-09 (DD-Counter/Risk-Propagation V2), AC-11 (audit-read API from US 26.15), AC-14 (US 26.02 idempotency), AC-15 (US 26.20 outbox).
- **Excluded** (3): AC-07 edge-case implementation detail (trigger_source_code string format), AC-08 separate-feature dropped, AC-10 subsumed into AC-01.
- E2E automation: 0 of 5 scenarios `@e2e-ready` — all require BE test hooks (D-Audit-Read-API, scheduler harness with identity-strip, integration harness, lifecycle trigger).

**File saved to:** `src/e2e/tests/PRD1042-37-Audit Trail/PRD1042-783 System-Generated Event Attribution.md` (dash separator per user instruction + [[feedback-epic-folder-naming]] convention).

**Key context for future Epic 26 stories:**

- Actor-type enum active in MVP: `manual_user`, `system_scheduler`, `integration_callback`, `system_lifecycle`, `migration` (5). Reserved-not-emitted: `system_dd_counter`, `system_propagation` (2). This is the Philipp Maute 35785 approved smart-cut #5.
- Investigation Surface: US 26.15 (basic global filter view MVP), NOT pre-built investigation views (V2).
- Retention categories MVP: 2 (Standard 10y purgeable, Regulatory Critical 10y purge-prohibited). NOT 3.
- Hash-chain: schema-only in MVP (nullable fields `recordHash`, `previousRecordHash`, `chainSequence` reserved); computation + verification API deferred V2. Per Philipp smart-cut #2 approved 35785.
- Audit-Read API for E2E assertion of emitted records is a **hard dependency** — belongs to US 26.15. Every Epic 26 write-side story that needs read-back assertion must Block on it.
- Provenance enforcement per US 26.04 is the fail-closed backstop: any system emission without a resolvable service identity must be rejected (AC-13 pattern).

**Related:** [[feedback-epic-folder-naming]] confirmed exact-folder-name-check-first rule.
