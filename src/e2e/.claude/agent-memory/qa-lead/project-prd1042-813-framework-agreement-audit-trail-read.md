---
name: project-prd1042-813-framework-agreement-audit-trail-read
description: PRD1042-813 US 11.14 Framework Agreement Audit Trail Read & Reconstruction (Epic 11) processed 2026-07-24 — DoR PASS 17 derived ACs, Stage 2 FAILED (MCP quota + no cached PNG for Audit tab on FA detail canvas 10:15285), Stage 3 WARNINGS spec-anchored, 11 scenario blocks (7 happy + 4 error), 1 Blocked (AC-12 D21 + D-Session-Revalidation-Signal), 5 Excluded/bundled, 0 of 11 @e2e-ready
metadata:
  type: project
---

Processed 2026-07-24 as a single-story pipeline run inside the Epic 11 continuation batch, sharing the same Figma file `aQGn5OLEjEGJO7xGzFikP5`. Target surface: **Audit / Lifecycle History tab on FA detail view (US 11.04)** — canvas `10:15285` (FA details page) per [[project-prd1042-22-framework-agreement]] page inventory; no distinct tab-level node ID enumerated in prior batch memory.

**Stage 1 — Jira extraction:** DoR PASS. US 11.14 Framework Agreement Audit Trail Read & Reconstruction. 17 derived ACs from Functional Requirements (6) + Field Specification (6-field event row schema) + Validation Rules (3) + System Behavior (4) + Security Requirements (3) + Non-Functional (2) + Edge Cases (5) + Audit Requirements (2). Epic PRD1042-22. Status: Dev in progress. Children: PRD1042-1372 (BE), PRD1042-1373 (FE QA-ready), PRD1042-1374 (QA Dev in progress).

**Stage 2 — Figma extraction:** FAILED. Confirmation call: MCP `get_metadata` on file `aQGn5OLEjEGJO7xGzFikP5` node `10:15285` returned "You've reached the Figma MCP tool call limit for your View seat on the Professional plan" (same quota state persisted from 803/804/805/806/807/808/809/812 batch). REST `/v1/files` also quota-exhausted per [[feedback-figma-nodes-fallback]] confirmations from prior sessions. WebFetch cannot pass `X-Figma-Token`. No shell available for `curl` fallback to `/v1/files/{key}/nodes`. No PNG fixture in `src/e2e/fixtures/figma-e11/rendered-nodes/` for Audit tab / as-of picker overlay / volume warning banner. Proceeded design-blind, spec-anchored per user directive.

**Stage 3 — Comparison:** WARNINGS. No CRITICAL contradictions — spec internally consistent. Design gaps logged (terminal-only):

- Verbatim Audit / Lifecycle History tab label + column headers
- As-of timestamp picker widget UI copy + reconstruction overlay heading
- Volume warning banner copy for >10,000-event FAs
- Auditor session-expired banner copy
- FA-did-not-exist error message wording (spec anchor "FA did not exist at the requested timestamp" carried behaviourally)
- Countersignatory display convention when null in November (single-admin model) — hidden vs "—" vs annotation

Ambiguities (OQ):

- OQ-11.14-A: Countersignatory column display when null in November — spec silent
- OQ-11.14-B: FA_EDITED field-diff structure — assumed `[{field, oldValue, newValue}]` array; not yet confirmed against Epic 26 canonical schema

Domain rules:

- Role-based access — LC + Support + Front Office get 404 (uniform 404-not-403), justification filtered from any LC/Support DTO (mirrors PRD1042-812/808 hidden-key pattern applied to justification field)
- Four-Eyes — N/A (read-only story, no state mutation from any endpoint here)
- Async op — reconstruction is synchronous (3s p95); no stale indicator needed on happy path
- Tenant isolation — auditor engagement-scoped access enforced; cross-tenant reads via LC User bound to another LC → 404 via tenant isolation

**Stage 4 — Test generation:** File written to `src/e2e/tests/PRD1042-22-Framework Agreement/PRD1042-813 Framework Agreement Audit Trail Read & Reconstruction.md`. 11 scenario blocks (2 Outlines + 9 Scenarios). 7 happy-path + 4 main-error. 1 Blocked (AC-12 auditor engagement mid-session expiry — needs D21 + D-Session-Revalidation-Signal). 5 Excluded/bundled (AC-02 → AC-01; AC-05 Epic 26 US 26.03 immutability infrastructure; AC-14 → AC-07 cursor pagination bundle; AC-16/17 → AC-09 CSV export bundle). 0 of 11 @e2e-ready — every scenario needs `D-Audit-Read-API` (Audit Trail read endpoint fixtures + seeded event histories); several also need `D-EventBus-Inspection` (for AUDITOR_FA_AUDIT_ACCESS + FA_AUDIT_EXPORT event assertion), `D-Audit-Down` (Audit Trail downstream failure simulator for AC-13), or `D20` (second tenant for AC-15 cross-tenant 404).

**Key domain patterns captured:**

- **Read-only story** — no Four-Eyes, no governed modal, no wizard, no MFA freshness gate (contrast with 803/804/805/806/807/809 governed-write batch; mirrors 808 + 812 read patterns)
- **7-event canonical fixture** for AC-01: FA_DRAFT_CREATED → FA_ACTIVATED → FA_EDITED → FA_SUSPENDED → FA_REACTIVATED → FA_DOCUMENT_UPLOADED → FA_DOCUMENT_DOWNLOADED — spans every event category the Audit tab must render
- **Field Specification schema** asserted field-by-field inside AC-01 happy path (eventType, actor, countersignatory-null-Nov, previousState, newState, justification, fieldDiff, timestamp UTC)
- **Countersignatory null pattern** for November single-admin model — POST-NOVEMBER field explicitly documented as null across all rows; display convention flagged as design gap
- **As-of reconstruction contract:** load creation snapshot → replay events with timestamp ≤ asOf → return reconstructed FA state (AC-04 primary path)
- **Interim-state reconstruction:** as-of during a Suspended window must return lifecycle=Suspended (AC-10) — state-machine time-travel invariant
- **As-of validation bounds:** ≥ FA creation AND ≤ now — future timestamp → structured 400 (AC-08), before-creation timestamp → structured 400 with "FA did not exist at the requested timestamp" message (AC-11)
- **Cursor pagination + volume warning bundle:** AC-07 + AC-14 in single scenario — 50 events/page, nextCursor opaque, volumeWarning flag true when event count > 10,000
- **CSV export role gating tri-branch:** Power User (Bank Admin) exports without reason; BO/Risk exports WITH reason (recorded in FA_AUDIT_EXPORT payload); Auditor exports without reason; LC + Support cannot export (covered by AC-15 404 Outline)
- **AUDITOR_FA_AUDIT_ACCESS meta-audit on read** — Auditor reading the audit trail is itself audited (parallel to PRD1042-774 US 13.27 Auditor Reconstruction of Partner Decisions same "read is audited" invariant)
- **FA_AUDIT_EXPORT event fan-out** — one per successful CSV export; payload `{actor, faId, reason, timestamp, rowCount}`
- **No-stale-cache-on-degradation** — CRITICAL DIFFERENCE from [[project-prd1042-808-framework-agreement-utilization]] AC-10 which permits 503 + stale cached values + staleness timestamp; audit data must NEVER be served stale (AC-13). Same 503 + retry pattern, different fallback semantics.
- **RBAC 404-not-403 uniform** with 803/804/805/806/807/808/809/812 batch — LC + Support + Front Office all get 404 (not 403) on both `/audit-history` and `/reconstruct` and `/export.csv` endpoints
- **Justification hidden-key pattern** — justification filtered from LC + Support DTO by JSON-key absence (mirrors LC 3-of-9 field pattern from PRD1042-812/808 hidden-bank-internal-fields DOM + JSON-key absence pattern)

**New dependency IDs introduced:**

- `D-Audit-Read-API` — Audit Trail read-endpoint fixture + seeded-history fixture (Epic 26 read source) — first Epic 11 story requiring pre-populated audit event histories seeded by lifecycle-transition events from prior stories; reused conceptually from PRD1042-787 (US 26.10 Read-Only Investigation Surface) which owns the read-side infrastructure — this is the first Epic 11 story to consume that infrastructure through FA-scoped filters
- `D-Audit-Down` — Audit Trail downstream service unavailability simulator (for AC-13 503 no-stale-cache path) — parallel to `D-LimitMgmt-Degraded` introduced in [[project-prd1042-808-framework-agreement-utilization]], but for Audit Trail (Epic 26) rather than Limit Management (Epic 19)
- `D-Session-Revalidation-Signal` — reused (previously seen conceptually in [[project-prd1042-789]] US 26.12 Cross-Tenant Audit Access Governance memory; formally required here for AC-12 auditor mid-session engagement expiry)

**Reused dependency IDs:**

- `D21` — `AUDITOR_VALIDITY_MINUTES` env override — used for AC-12 auditor engagement TTL setup (from CLAUDE.md D-series list); AC-12 currently Blocked pending both D21 + D-Session-Revalidation-Signal
- `D20` — Second seeded Bank Tenant — for AC-15 cross-tenant 404 assertion (LC bound to TNT-00099 attempting TNT-00042 FA)
- `D-EventBus-Inspection` — for AUDITOR_FA_AUDIT_ACCESS + FA_AUDIT_EXPORT event assertion (reused from 805 + 808 + 812)

**Comparison to sibling stories:**

- [[project-prd1042-808-framework-agreement-utilization]] — 808 is the read-side sibling on the utilization surface (payload contract, cache invalidation); 813 is the read-side sibling on the audit surface (event history, reconstruction). Both are surfacing stories consuming Epic 19 (utilization) / Epic 26 (audit) respectively. The no-stale-cache-on-degradation contrast (audit strict, utilization permissive) is the key semantic distinction.
- [[project-prd1042-812]] — LC Portal Summary View — 812 introduced the hidden-bank-internal-fields DOM + JSON-key absence pattern that 813 applies to the justification field for LC + Support DTOs.
- [[project-prd1042-804-framework-agreement-suspension]], [[project-prd1042-805-framework-agreement-reactivation]], [[project-prd1042-806-framework-agreement-termination]] — the governed lifecycle stories PRODUCE the audit events (FA_ACTIVATED / FA_SUSPENDED / FA_REACTIVATED / FA_TERMINATED / FA_EDITED) that 813 READS. The 7-event canonical fixture in 813 AC-01 explicitly spans events emitted by 800 (Activation), 803 (Edit), 804 (Suspension), 805 (Reactivation), 807 (Document Upload/Download).
- [[project-prd1042-787]] — Epic 26 US 26.10 Read-Only Investigation Surface — 787 owns the platform-Auditor cross-tenant audit read; 813 is the FA-scoped tenant-bound audit read consumed inside the FA detail cockpit. Same underlying Audit Trail service; different scope + role gating.
- [[project-prd1042-789]] — Epic 26 US 26.12 Cross-Tenant Audit Access Governance — 789 introduced the D-Session-Revalidation-Signal concept for auditor session invalidation; 813 formally requires it for AC-12 mid-session expiry.
- [[project-prd1042-774]] — US 13.27 Auditor Reconstruction of Partner Decisions — same "auditor reads the audit trail is itself audited" invariant + read-only + append-only assertions; 813 is the FA counterpart to 774's Partner counterpart.
- [[project-prd1042-759]] — US 13.13 Reconstruct Full Merge History — same event-replay-from-creation-snapshot-forward reconstruction pattern; 813 replays FA lifecycle events, 759 replays Partner merge events.

Epic folder: `PRD1042-22-Framework Agreement`.
