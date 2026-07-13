---
name: project-prd1042-780
description: PRD1042-780 US 26.3 DB-Level Immutability Enforcement processed 2026-07-10 — first Audit Trail story
metadata:
  type: project
---

# PRD1042-780 — US 26.3 Database-Level Immutability Enforcement

**Processed:** 2026-07-10
**Epic:** PRD1042-37 (Epic 26: Audit Trail)
**Epic folder created:** `src/e2e/tests/PRD1042-37-Audit Trail/` (first story in the Audit Trail epic — no pre-existing folder)
**Jira status:** Ready for DEV Review (parent); child BE story PRD1042-990 in QA ready
**DoR status:** PASS — 14 derived ACs from prose (functional / validation / system-behavior / security / NFR / edge sections + permission matrix)

## Pipeline outcome

| Stage   | Status    | Notes                                                                                                                                   |
| ------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Stage 1 | PASS      | Story ships requirements in prose; ACs synthesized to 14                                                                                |
| Stage 2 | SKIPPED   | Backend/infrastructure story — no UI surface; the shared Audit Trail Figma covers investigation surface (US 26.10+), not DB permissions |
| Stage 3 | SKIPPED   | No design object; RefiNext domain-rule checks applied against ACs directly                                                              |
| Stage 4 | GENERATED | 8 scenario blocks (1 Outline + 7 Scenarios), 9 of 14 ACs covered, 1 Blocked (AC-09), 4 excluded (edge-case/separate-feature)            |

## Scenario coverage

- **Happy path (3):** grant matrix inspection for `audit_app_role` (AC-01/05), grant matrix for `audit_migration_role` (AC-02), positive INSERT+SELECT round-trip (AC-08)
- **Main error (5):** DB-layer UPDATE rejection (AC-06), DB-layer DELETE rejection (AC-07), soft-delete column governance lint Outline × 3 (AC-03/13), runtime credential scope (AC-11), startup guard against migration credentials (AC-14)
- **Blocked (1):** AC-09 `audit.migration.executed` events — OQ-3 architectural decision pending (Marko Mrdja 2026-06-18 comment proposes dropping infrastructure-level app-emitted event in favour of alembic + git tracking; story description still lists it as required)
- **Excluded (4):** AC-04 (out-of-band legally-governed process), AC-05 (merged with AC-01), AC-10 (threat-model assertion — empirically covered by AC-06/07), AC-12 (NFR peak-throughput — separate load test with golden number from Platform Engineering)

## Key architectural notes

- **Two-layer immutability** approach agreed by Marko Mrdja (2026-06-18): DB trigger + REVOKE, INSERT-only app repository, no update/delete methods in audit repo
- **Physical deletion** only via out-of-band privileged access under legally-governed destruction order — explicitly excluded from application path (AC-04)
- **Migration governance** lint must catch soft-delete column patterns (`is_deleted`, `deleted_at`, `active/inactive`) — three canonical forbidden patterns baked into Outline
- **Runtime credential scope**: application service must connect only as `audit_app_role`; migration role credentials segregated (AC-11); startup must fail if misconfigured (AC-14, defense-in-depth)

## E2E automation status

**All 8 scenarios marked `⚙️ needs infra`** — none `@e2e-ready`. This is a DB-layer/governance story that cannot be exercised from the standard Playwright browser flow. Requires:

- **D-DB-Introspect** — direct query access to `information_schema.role_table_grants` from tests
- **D-DB-Direct** — direct DB connection as `audit_app_role` from test harness (raw SQL execution)
- **D-Audit-Fixture** — controlled audit-event emission for round-trip verification
- **D-Migration-Lint** — governance lint runnable against candidate migrations in CI
- **D-Cred-Scope** — introspection of runtime credential set
- **D-Startup-Guard** — test-mode startup with injected misconfigured credentials

These are backend-QA harness dependencies, not Playwright-user-facing. Recommend routing to `refinext-api` pytest suite rather than Playwright E2E.

## References

- Story: PRD1042-780 (parent), PRD1042-990 (BE), PRD1042-991 (FE — likely no-op given no UI), PRD1042-992 (QA)
- Epic: PRD1042-37 (Epic 26: Audit Trail)
- Regulatory anchors: DORA Art. 9, BAIT AT 7.2, MaRisk AT 7.2 (per Philipp Maute comment 34102 on epic)
- CDR 2024/1774 Art. 12(2)(d), BAIT Chapter 6 "manipulationssichere Protokollierung" (per Marko Mrdja comment 37517)
