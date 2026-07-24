# PRD1042-813 — US 11.14 | Framework Agreement | Framework Agreement Audit Trail Read & Reconstruction

Generated: 2026-07-24
Story: PRD1042-813 — US 11.14 | Framework Agreement | Framework Agreement Audit Trail Read & Reconstruction
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (17 derived ACs from Functional Requirements + Field Specification + Validation Rules + System Behavior + Security Requirements + Non-Functional Requirements + Edge Cases + Audit Requirements, description present with Permission Matrix + endpoint contract + event fan-out + Field Spec table, stakeholder-reviewed, Dev in progress; children BE PRD1042-1372, FE PRD1042-1373 QA-ready, QA PRD1042-1374)
ACs with Gherkin scenarios: 11 of 17 | Blocked: 1 (AC-12 — D21 + D-Session-Revalidation-Signal) | Excluded: 5 (AC-02/16/17 bundled into AC-01/AC-09; AC-05 immutability invariant covered by Epic 26 US 26.03 PRD1042-780; AC-14 >10,000 events volume warning bundled into AC-07 cursor pagination happy path)
Figma design: Shared Epic 11 file `aQGn5OLEjEGJO7xGzFikP5`. Target frame — Audit / Lifecycle History tab within FA detail view (US 11.04) on canvas `10:15285` (FA details page). Stage 2 FAILED (MCP `get_metadata` returned "You've reached the Figma MCP tool call limit for your View seat on the Professional plan" — same quota state as prior 803/804/805/806/807/808/809/812 batch; REST `/v1/files` also quota-exhausted per [[feedback-figma-nodes-fallback]] confirmed in prior sessions on this token; WebFetch cannot pass `X-Figma-Token`; no shell available; no cached PNG fixture in `rendered-nodes/` for the Audit tab / as-of picker overlay / volume warning banner). Design-blind, spec-anchored per user directive; verbatim tab label / as-of picker copy / reconstruction overlay heading / volume warning banner / session-expired banner / FA-did-not-exist message copy remain OPEN design gaps logged in the Design specification section below.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                                                                                                            | Blocking dependency                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| AC-12 | Auditor engagement expires mid-session; next API call must return HTTP 403 + UI must show session-expired banner. Requires configurable engagement TTL override AND a mechanism to expire an existing valid auditor session between two API calls | `D21` (`AUDITOR_VALIDITY_MINUTES` env override) + `D-Session-Revalidation-Signal` (mid-session revocation trigger) |

---

## AC Scope Filter

| AC    | Description                                                                                                                                | Classification | Rationale                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Audit / Lifecycle History tab on FA detail view lists all governance events chronologically (configurable; default descending)             | `happy-path`   | Core success flow — the primary Audit tab read that underpins the story                                                                                                       |
| AC-02 | Event row schema (event type, actor, countersignatory-null-Nov, timestamp UTC, justification, structured before/after diff)                | `happy-path`   | Bundled — asserted field-by-field inside AC-01                                                                                                                                |
| AC-03 | Filter controls: event type multi-select, date range, actor text search                                                                    | `happy-path`   | Filter contract — Outline covers event type + date range + actor text                                                                                                         |
| AC-04 | As-of reconstruction: past timestamp → replay events ≤ asOf → show FA state at that point                                                  | `happy-path`   | Reconstruction endpoint — replay + snapshot contract                                                                                                                          |
| AC-05 | Audit events are append-only and immutable; this story is read-only                                                                        | `edge-case`    | Infrastructure invariant enforced at DB layer — covered end-to-end by Epic 26 US 26.03 (PRD1042-780) DB-Level Immutability tests; no distinct read-side surface here          |
| AC-06 | Auditor read writes AUDITOR_FA_AUDIT_ACCESS meta-audit event (auditor identity, faId, filters, timestamp)                                  | `happy-path`   | Governance-critical — Auditor read is itself audited; verified by event assertion                                                                                             |
| AC-07 | Audit history paginated; max 50 events per page (cursor-based)                                                                             | `happy-path`   | Pagination contract — cursor semantics + max page size, also bundles AC-14 (high-volume >10,000 events warning surfaced through the same cursor path)                         |
| AC-08 | As-of reconstruction timestamp must be ≥ FA creation timestamp AND ≤ now                                                                   | `main-error`   | Bound validation guard — future timestamp rejected                                                                                                                            |
| AC-09 | CSV export permitted for Power User (Bank Admin) + Back Office / Risk (with reason) + Auditor; LC + Support cannot export                  | `happy-path`   | Export role gating + reason capture + FA_AUDIT_EXPORT event fan-out (bundles AC-16 reason recorded in audit + AC-17 FA_AUDIT_EXPORT payload)                                  |
| AC-10 | As-of timestamp during a Suspended state window returns reconstructed FA lifecycle = Suspended with field values current at that timestamp | `happy-path`   | State-machine time-travel — reconstruction must honour interim lifecycle transitions, not just current state                                                                  |
| AC-11 | As-of timestamp before FA creation returns "FA did not exist at the requested timestamp"                                                   | `main-error`   | Lower-bound validation — structured error contract                                                                                                                            |
| AC-12 | Auditor engagement expires mid-session — next API call HTTP 403 + UI session-expired banner                                                | `Blocked`      | Requires `D21` (`AUDITOR_VALIDITY_MINUTES` env override) + `D-Session-Revalidation-Signal` to expire an existing valid session between two calls                              |
| AC-13 | Audit Trail temporarily unavailable → HTTP 503 + UI retry option; NO stale cache permitted for audit data                                  | `main-error`   | Degraded / failover — governed error path, distinct from utilization surface's stale-cache allowance (contrast with 808 AC-10)                                                |
| AC-14 | High-volume >10,000 events → cursor pagination + explicit volume warning to user                                                           | `edge-case`    | Bundled into AC-07 cursor pagination happy path — volume warning is a UI affordance surfaced through the same paginated read                                                  |
| AC-15 | RBAC — LC + Support attempting access receive HTTP 404; justification text filtered out of LC + Support DTO                                | `main-error`   | Uniform 404-not-403 pattern + DTO shape filtering — Outline covers all 6 roles including Power User (Bank Admin), Front Office, Back Office / Risk, LC User, Support, Auditor |
| AC-16 | CSV export from Back Office / Risk requires stated reason recorded in audit                                                                | `happy-path`   | Bundled into AC-09 export role gating scenario — reason recorded in FA_AUDIT_EXPORT payload                                                                                   |
| AC-17 | Emits FA_AUDIT_EXPORT event with { actor, faId, reason, timestamp, row count }                                                             | `happy-path`   | Bundled into AC-09 — FA_AUDIT_EXPORT event assertion is part of the export happy path                                                                                         |

**Gherkin generated for:** AC-01, AC-03, AC-04, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-13, AC-15
**Blocked (no Gherkin):** AC-12 (D21 + D-Session-Revalidation-Signal)
**No Gherkin (edge-case or separate-feature):** AC-02 (bundled into AC-01), AC-05 (Epic 26 US 26.03 immutability infrastructure), AC-14 (bundled into AC-07 cursor pagination), AC-16 (bundled into AC-09), AC-17 (bundled into AC-09)

---

## Scenarios summary

| Tag           | Scenario                                                                                                                                       | AC                  | Priority | E2E                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------- | --------------------------------------------------------------------------------- |
| `@happy-path` | Power User (Bank Admin) reads Audit tab on FA with 7-event history (chronological desc, full event row schema)                                 | AC-01, AC-02        | P0       | ⚙️ needs seeded FA with 7-event lifecycle fixture + D-Audit-Read-API              |
| `@happy-path` | Filter Outline — event type, date range, actor text search                                                                                     | AC-03               | P0       | ⚙️ needs seeded FA with multi-actor multi-type history + D-Audit-Read-API         |
| `@happy-path` | As-of reconstruction replays events up to timestamp and returns FA state snapshot                                                              | AC-04               | P0       | ⚙️ needs seeded FA with 3-transition history + D-Audit-Read-API                   |
| `@happy-path` | Auditor read emits AUDITOR_FA_AUDIT_ACCESS meta-audit event with filters payload                                                               | AC-06               | P0       | ⚙️ needs Auditor role + D-EventBus-Inspection + D-Audit-Read-API                  |
| `@happy-path` | Cursor pagination — page 1 of 50 events, page 2 cursor navigation, >10,000-event FA displays volume warning                                    | AC-07, AC-14        | P0       | ⚙️ needs seeded FA with 10,050-event history + D-Audit-Read-API                   |
| `@happy-path` | As-of timestamp during a Suspended state window returns lifecycle = Suspended in reconstructed snapshot                                        | AC-10               | P0       | ⚙️ needs seeded FA with Suspended → Reactivated interim window + D-Audit-Read-API |
| `@happy-path` | CSV export role gating — Power User (Bank Admin) exports without reason; BO/Risk exports with reason; Auditor exports; FA_AUDIT_EXPORT emitted | AC-09, AC-16, AC-17 | P0       | ⚙️ needs seeded FA history + D-Audit-Read-API + D-EventBus-Inspection             |
| `@main-error` | As-of timestamp in the future rejected with structured 400                                                                                     | AC-08               | P0       | ⚙️ needs seeded FA + D-Audit-Read-API                                             |
| `@main-error` | As-of timestamp before FA creation returns "FA did not exist at the requested timestamp"                                                       | AC-11               | P0       | ⚙️ needs seeded FA + D-Audit-Read-API                                             |
| `@main-error` | Audit Trail service unavailable returns 503 with retry affordance; NO stale-cache fallback                                                     | AC-13               | P0       | ⚙️ needs D-Audit-Down (Audit Trail downstream failure simulator)                  |
| `@main-error` | RBAC 404 + DTO justification filtering Outline — LC + Support get 404; other roles get 200 but LC/Support justification filtered from DTO      | AC-15               | P0       | ⚙️ needs D20 (second tenant) + Support grant fixture + D-Audit-Read-API           |

Active scenario blocks: 11 (2 Outlines + 9 Scenarios)
E2E automation candidates: 0 of 11 scenarios ✅ (all 11 require `D-Audit-Read-API` — Audit Trail read endpoint fixtures + seeded event histories; several also need `D-EventBus-Inspection`, `D-Audit-Down`, or `D20`)

---

## Design specification (source of truth)

**Stage 2 DESIGN-BLIND.** Story description places the audit surface as the "Audit / Lifecycle History" tab on the FA detail view (US 11.04 — canvas `10:15285` in shared Epic 11 file `aQGn5OLEjEGJO7xGzFikP5`). Verbatim tab label / column headers / as-of timestamp picker copy / reconstruction overlay heading / volume warning banner / session-expired banner / FA-did-not-exist error message have NOT been retrieved. MCP is quota-exhausted, REST `/v1/files` was quota-exhausted last session with multi-day `Retry-After`, `WebFetch` cannot pass `X-Figma-Token`, and no shell is available to run `curl` for the `/v1/files/{key}/nodes` fallback (see [[feedback-figma-nodes-fallback]]).

Scenarios below are anchored to the **Jira story spec verbatim** rather than design copy. Where UI copy would ordinarily anchor assertions, assertions are described in **behavioural** terms — element role, field presence, structured payload shape — and left open for a copy-pass tightening once the Audit tab design fixture is exported. Scenario execution against the running application is not blocked: assertions match the spec's payload contract; only display copy will need verbatim confirmation post-fixture-export.

**Spec anchors (verbatim from Jira description):**

| Anchor                          | Verbatim wording                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Read-side scope                 | "Audit Trail (Epic 26) is the persistence owner; this story specifies the read-side reconstruction contract for Framework Agreement events."                                          |
| Purpose                         | "view the full audit history of a Framework Agreement and reconstruct its state at any past timestamp"                                                                                |
| Audit tab                       | "Audit / Lifecycle History tab on FA detail view (US 11.04) lists all governance events for the FA in chronological order (configurable; default descending)."                        |
| Event row                       | "Each event row: event type, actor, countersignatory (if any — POST-NOVEMBER), timestamp (UTC), justification (where applicable), structured before/after diff (where applicable)."   |
| Filter controls                 | "Filter controls: event type multi-select, date range, actor text search."                                                                                                            |
| Reconstruction                  | "As-of reconstruction: user enters a past timestamp; system replays events up to that timestamp and shows the FA state (lifecycle status, all field values) as it was at that point." |
| Immutability                    | "Audit events are append-only and immutable; this story is read-only."                                                                                                                |
| Meta-audit                      | "Auditor access writes a meta-audit event capturing the auditor's read."                                                                                                              |
| Pagination                      | "Audit history is paginated; max 50 events per page."                                                                                                                                 |
| As-of bounds                    | "As-of reconstruction timestamp must be ≥ FA creation timestamp and ≤ now."                                                                                                           |
| Export role gating              | "Export to CSV permitted for Power User (Bank Admin), Back Office / Risk (with reason), and Auditor; LC users and Support cannot export."                                             |
| Audit source                    | "Audit history list is read directly from Audit Trail (Epic 26) — the immutable source of truth."                                                                                     |
| Replay logic                    | "As-of reconstruction logic: load FA creation snapshot, then replay all events with timestamp ≤ asOf, applying diffs. Result is the reconstructed FA state."                          |
| Read-only                       | "Reconstruction is read-only; no mutation of underlying data."                                                                                                                        |
| Meta-audit payload              | "Auditor access to audit history writes AUDITOR_FA_AUDIT_ACCESS event: auditor identity, faId, filters applied, timestamp."                                                           |
| Security                        | "Audit history endpoint requires Power User (Bank Admin), Back Office / Risk, or Auditor role (engagement-scoped)."                                                                   |
| LC / Support 404                | "LC users and Support attempting access receive HTTP 404."                                                                                                                            |
| Justification filter            | "Justification text is filtered out of LC user and Support DTOs."                                                                                                                     |
| CSV reason                      | "CSV export endpoint requires a stated reason from Back Office / Risk; reason recorded in audit."                                                                                     |
| NFR — list                      | "Audit history list API responds within 2 seconds at p95 for FAs with ≤ 1,000 events."                                                                                                |
| NFR — reconstruction            | "As-of reconstruction responds within 3 seconds at p95 for FAs with ≤ 1,000 events."                                                                                                  |
| Edge — before creation          | "As-of timestamp before FA creation → Reconstruction returns \"FA did not exist at the requested timestamp\"."                                                                        |
| Edge — during Suspended         | "As-of timestamp during Suspended state → Reconstructed FA state shows lifecycle = Suspended with field values current at that timestamp."                                            |
| Edge — auditor expiry           | "Auditor engagement expires mid-session → Next API call returns HTTP 403; UI shows session-expired banner."                                                                           |
| Edge — audit down               | "Audit Trail temporarily unavailable → API returns HTTP 503; UI shows retry option. Stale cache not permitted for audit data."                                                        |
| Edge — high volume              | "Audit history exceeds 10,000 events for one FA → Paginated; cursor-based navigation; explicit warning shown to user about volume."                                                   |
| Export event                    | "Emits FA_AUDIT_EXPORT when CSV export performed."                                                                                                                                    |
| AUDITOR_FA_AUDIT_ACCESS payload | "auditor identity, faId, filters, timestamp."                                                                                                                                         |
| FA_AUDIT_EXPORT payload         | "actor, faId, reason, timestamp, row count."                                                                                                                                          |

**Endpoints:**

- `GET /api/framework-agreements/{id}/audit-history?type=&from=&to=&actor=&cursor=` — audit event list, filterable + paginated
- `GET /api/framework-agreements/{id}/reconstruct?asOf=<ISO8601>` — as-of state reconstruction
- `GET /api/framework-agreements/{id}/audit-history/export.csv?reason=<text>` — CSV export (Power User / BO/Risk / Auditor only)

**Audit Event Row schema (from Field Specification):**

| Field            | Type       | M/O/C | Visibility Rules                                                                                                           |
| ---------------- | ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| Event Type       | Enum       | M     | All events from Epic 11 §10 Audit Requirements (FA_DRAFT_CREATED through FA_DOCUMENT_DOWNLOADED, FA_LIMIT_BREACHED, etc.)  |
| Actor            | User ref   | M     | Power User (Bank Admin) + Back Office / Risk see full identity; Auditor sees engagement-scoped identity                    |
| Countersignatory | User ref   | C     | POST-NOVEMBER. Currently null for November (single-admin model).                                                           |
| Previous State   | Text       | C     | Present for lifecycle transitions.                                                                                         |
| New State        | Text       | C     | Present for lifecycle transitions.                                                                                         |
| Justification    | Long text  | C     | Present for governed transitions (activation, suspension, reactivation, termination, edit). Hidden from LC + Support DTOs. |
| Field Diff       | Structured | C     | Present for FA_EDITED events: array of `{field, oldValue, newValue}`.                                                      |
| Timestamp (UTC)  | DateTime   | M     | Sortable.                                                                                                                  |

**Permission Matrix (from Jira story description):**

| Role                    | View FA audit event list | View governance justification | Reconstruct FA state at as-of | Export audit history (CSV) |
| ----------------------- | ------------------------ | ----------------------------- | ----------------------------- | -------------------------- |
| Power User (Bank Admin) | ✓ (own tenant)           | ✓                             | ✓                             | ✓                          |
| Front Office            | ✗                        | ✗                             | ✗                             | ✗                          |
| Back Office / Risk      | ✓                        | ✓                             | ✓                             | ✓ (with reason)            |
| LC User                 | ✗                        | ✗                             | ✗                             | ✗                          |
| Support                 | ✗                        | ✗                             | ✗                             | ✗                          |
| Auditor                 | ✓ (engagement-scoped)    | ✓                             | ✓                             | ✓                          |

**Audit events emitted (fan-out from read-side actions):**

- `AUDITOR_FA_AUDIT_ACCESS` — `{ auditorId, faId, filters, timestamp }`
- `FA_AUDIT_EXPORT` — `{ actor, faId, reason, timestamp, rowCount }`

**Consistency with prior Epic 11 stories:**

- Read-only story — no Four-Eyes, no governed modal, no wizard, no MFA freshness gate (contrast with [[project-prd1042-804-framework-agreement-suspension]], [[project-prd1042-805-framework-agreement-reactivation]], [[project-prd1042-806-framework-agreement-termination]], [[project-prd1042-803-807-809-framework-agreement]]; mirrors [[project-prd1042-808-framework-agreement-utilization]] and [[project-prd1042-812]] read patterns).
- 404-not-403 pattern on unauthorized roles (LC + Support + Front Office) mirrors 803/804/805/806/807/808/809/812 batch.
- Justification-hidden-from-LC/Support DTO pattern mirrors LC hidden-field pattern of PRD1042-812 + PRD1042-808 (DOM + JSON-key absence).
- Meta-audit-on-read pattern parallels PRD1042-774 (US 13.27 Auditor Reconstruction of Partner Decisions) — same "auditor reads the audit trail is itself audited" invariant.
- As-of state reconstruction parallels PRD1042-759 (US 13.13 Reconstruct Full Merge History) — event replay from creation snapshot forward.
- No stale-cache-on-degradation is a DIFFERENCE from [[project-prd1042-808-framework-agreement-utilization]] AC-10 — audit data must never be served stale; utilization can be served stale with staleness timestamp.

---

## Feature file

```gherkin
@framework-agreement @us-11.14 @p0
Feature: Framework Agreement Audit Trail Read & Reconstruction (US 11.14 — PRD1042-813)
  As a Power User (Bank Admin), Back Office / Risk user, or Auditor
  I want to view the full audit history of a Framework Agreement and reconstruct its state at any past timestamp
  So that I can review governance actions, demonstrate compliance (MaRisk AT 4.3.2 / BAIT AT 7.2), and resolve operational disputes

  Background:
    Given the RefiNext platform is up and healthy
    And the Audit Trail service (Epic 26) is available
    And a Framework Agreement "FA-Audit-Alpha" (internal ID "FA-2026-00081") exists bound to Leasing Company "New Group Trade" (Tenant ID "TNT-00042")
    And "FA-Audit-Alpha" has the following governance event history in chronological order (oldest first):
      | seq | event_type              | actor                              | timestamp              | previous_state | new_state    | justification                                        | field_diff                                       |
      | 1   | FA_DRAFT_CREATED        | Vincent Brooke (Power User)        | 2026-05-02T09:00:00Z   | —              | Draft        | —                                                    | —                                                |
      | 2   | FA_ACTIVATED            | Vincent Brooke (Power User)        | 2026-05-05T10:00:00Z   | Draft          | Active       | Initial activation post-review                       | —                                                |
      | 3   | FA_EDITED               | Sara Novak (Back Office / Risk)    | 2026-05-15T14:30:00Z   | —              | —            | Increase max volume post-approval                    | [{field: "maxVolumeEUR", oldValue: "1000000.00", newValue: "1500000.00"}] |
      | 4   | FA_SUSPENDED            | Vincent Brooke (Power User)        | 2026-06-01T11:00:00Z   | Active         | Suspended    | Regulator inquiry pending — pause new disbursements  | —                                                |
      | 5   | FA_REACTIVATED          | Vincent Brooke (Power User)        | 2026-06-10T09:30:00Z   | Suspended      | Active       | Regulator inquiry cleared                            | —                                                |
      | 6   | FA_DOCUMENT_UPLOADED    | Sara Novak (Back Office / Risk)    | 2026-06-15T08:15:00Z   | —              | —            | —                                                    | —                                                |
      | 7   | FA_DOCUMENT_DOWNLOADED  | Michael Rousseau (Auditor)         | 2026-06-20T13:00:00Z   | —              | —            | —                                                    | —                                                |
    And a Framework Agreement "FA-Audit-Beta" exists bound to Leasing Company "Beta Leasing GmbH" (Tenant ID "TNT-00099")
    And a Framework Agreement "FA-Audit-HighVolume" exists in Active state with 10,050 governance events accumulated (audit-history exceeds 10,000-event threshold)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02
  # Power User (Bank Admin) opens the Audit tab on FA-Audit-Alpha. The audit
  # history endpoint returns the 7-event history in chronological descending
  # order (default). Each row exposes the full event-row schema per Field
  # Specification. Countersignatory is null across all rows (POST-NOVEMBER,
  # single-admin model in November 2026).
  # Design gap logged: verbatim tab label, column headers, and Countersignatory
  # display convention when null (hidden vs "—" vs annotation) — spec silent.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @p0
  Scenario: Power User (Bank Admin) reads Audit tab on FA-Audit-Alpha and sees 7-event history in descending order (AC-01, AC-02)
    Given I am logged in as Power User (Bank Admin) "Vincent Brooke" with a valid session bound to Tenant ID "TNT-00042"
    And I am viewing "FA-Audit-Alpha" detail
    When the FA detail view opens the Audit / Lifecycle History tab
    Then a GET request to "/api/framework-agreements/FA-Audit-Alpha/audit-history" should be sent
    And the response status should be 200
    And the response payload should contain exactly 7 event rows
    And the event rows should be returned in descending chronological order (newest first)
    And the first event row (newest) should be event_type "FA_DOCUMENT_DOWNLOADED" with actor "Michael Rousseau (Auditor)" at "2026-06-20T13:00:00Z"
    And the last event row (oldest) should be event_type "FA_DRAFT_CREATED" with actor "Vincent Brooke (Power User)" at "2026-05-02T09:00:00Z"
    And each event row should include the mandatory fields: eventType, actor, timestamp (UTC)
    And each event row's "countersignatory" field should be null (single-admin model in November)
    And the event row for "FA_ACTIVATED" (seq 2) should include justification "Initial activation post-review", previousState "Draft", newState "Active"
    And the event row for "FA_EDITED" (seq 3) should include justification "Increase max volume post-approval" and a fieldDiff array containing one entry {field: "maxVolumeEUR", oldValue: "1000000.00", newValue: "1500000.00"}
    And the event row for "FA_SUSPENDED" (seq 4) should include justification "Regulator inquiry pending — pause new disbursements", previousState "Active", newState "Suspended"
    And no event row should be marked mutable in the response payload (all rows read-only)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03
  # Filter controls: event type multi-select, date range, actor text search.
  # Outline covers each filter dimension in isolation plus one combined filter.
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @p0
  Scenario Outline: Audit history filter Outline — event type / date range / actor text (AC-03)
    Given I am logged in as Power User (Bank Admin) "Vincent Brooke" with a valid session bound to Tenant ID "TNT-00042"
    And I am viewing the Audit / Lifecycle History tab for "FA-Audit-Alpha"
    When I GET "/api/framework-agreements/FA-Audit-Alpha/audit-history<query_string>"
    Then the response status should be 200
    And the response payload should contain exactly <expected_count> event rows
    And every returned event row should match filter constraint "<filter_description>"

    Examples:
      | query_string                                                                          | expected_count | filter_description                                                          |
      | ?type=FA_ACTIVATED,FA_REACTIVATED                                                     | 2              | eventType in {FA_ACTIVATED, FA_REACTIVATED}                                 |
      | ?type=FA_EDITED                                                                       | 1              | eventType == FA_EDITED                                                       |
      | ?from=2026-06-01T00:00:00Z&to=2026-06-30T23:59:59Z                                    | 4              | timestamp within June 2026                                                   |
      | ?from=2026-05-01T00:00:00Z&to=2026-05-31T23:59:59Z                                    | 3              | timestamp within May 2026                                                    |
      | ?actor=Sara                                                                           | 2              | actor display name contains "Sara" (case-insensitive)                        |
      | ?actor=Michael                                                                        | 1              | actor display name contains "Michael" (case-insensitive)                     |
      | ?type=FA_SUSPENDED,FA_REACTIVATED&from=2026-06-01T00:00:00Z&to=2026-06-30T23:59:59Z    | 2              | eventType in {FA_SUSPENDED, FA_REACTIVATED} AND timestamp within June 2026   |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-04
  # As-of reconstruction. User enters a past timestamp; system replays events
  # up to (and including) that timestamp and returns the FA state at that
  # point in time. For as-of "2026-05-20T00:00:00Z" (after events 1–3, before
  # 4–7), lifecycle should be Active and maxVolumeEUR should be 1,500,000.00
  # (the edited value from event 3).
  # ---------------------------------------------------------------------------

  @happy-path @ac-04 @p0
  Scenario: As-of reconstruction returns FA state after replaying events up to timestamp (AC-04)
    Given I am logged in as Power User (Bank Admin) "Vincent Brooke" with a valid session bound to Tenant ID "TNT-00042"
    And "FA-Audit-Alpha" was created at "2026-05-02T09:00:00Z" and its event history includes an FA_EDITED at "2026-05-15T14:30:00Z" that changed maxVolumeEUR from 1000000.00 to 1500000.00
    When I GET "/api/framework-agreements/FA-Audit-Alpha/reconstruct?asOf=2026-05-20T00:00:00Z"
    Then the response status should be 200
    And the reconstructed FA state should include lifecycle "Active"
    And the reconstructed FA state should include maxVolumeEUR "1500000.00"
    And the reconstructed FA state should NOT reflect any event with timestamp after "2026-05-20T00:00:00Z" (i.e., the response should not show the Suspended → Reactivated transitions from June 2026)
    And the response payload should include an "asOf" field equal to "2026-05-20T00:00:00Z"
    And the response payload should NOT mutate any underlying audit event (read-only)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-06
  # Auditor reading the Audit tab writes a meta-audit event AUDITOR_FA_AUDIT_ACCESS
  # capturing the auditor's identity, the faId, the filters applied, and the
  # read timestamp. Reading the audit trail is itself audited.
  # ---------------------------------------------------------------------------

  @happy-path @ac-06 @p0
  Scenario: Auditor read of Audit tab emits AUDITOR_FA_AUDIT_ACCESS meta-audit event (AC-06)
    Given I am logged in as Auditor "Michael Rousseau" with an active engagement scope covering Tenant ID "TNT-00042"
    When I GET "/api/framework-agreements/FA-Audit-Alpha/audit-history?type=FA_EDITED&from=2026-05-01T00:00:00Z&to=2026-05-31T23:59:59Z"
    Then the response status should be 200
    And an audit event "AUDITOR_FA_AUDIT_ACCESS" should be emitted with payload:
      | Field       | Expected value                                                                                        |
      | auditorId   | Michael Rousseau's user identifier                                                                    |
      | faId        | FA-Audit-Alpha                                                                                        |
      | filters     | { type: ["FA_EDITED"], from: "2026-05-01T00:00:00Z", to: "2026-05-31T23:59:59Z" }                     |
      | timestamp   | ISO 8601 datetime within 5 seconds of "now"                                                           |
    And the AUDITOR_FA_AUDIT_ACCESS event should itself be persisted to the Audit Trail (Epic 26) as an immutable record

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07, AC-14
  # Cursor-based pagination with max 50 events per page. Reading a page returns
  # up to 50 events plus a nextCursor when more remain. For an FA whose audit
  # history exceeds 10,000 events (FA-Audit-HighVolume), the response includes
  # an explicit volume warning to the user surfaced through the same paginated
  # read (AC-14 bundled).
  # Design gap logged: verbatim volume warning banner copy.
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @ac-14 @p0
  Scenario: Cursor pagination returns 50 events per page and volume warning on >10,000-event FA (AC-07, AC-14)
    Given I am logged in as Power User (Bank Admin) "Vincent Brooke" with a valid session bound to Tenant ID "TNT-00042"
    And "FA-Audit-HighVolume" has 10,050 governance events in its audit history
    When I GET "/api/framework-agreements/FA-Audit-HighVolume/audit-history"
    Then the response status should be 200
    And the response payload should contain exactly 50 event rows (first page)
    And the response payload should include a "nextCursor" field with a non-empty opaque cursor value
    And the response payload should include a "volumeWarning" flag equal to true (event count exceeds 10,000)
    And the UI should render an explicit volume warning banner indicating high event count
    When I GET "/api/framework-agreements/FA-Audit-HighVolume/audit-history?cursor=<nextCursor from previous response>"
    Then the response status should be 200
    And the response payload should contain 50 event rows (second page, distinct from the first page)
    And the response payload should include a distinct "nextCursor" value

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-10
  # As-of timestamp lands during a Suspended state window. Reconstruction must
  # honour the interim lifecycle transitions, not just current state. For
  # FA-Audit-Alpha, as-of "2026-06-05T12:00:00Z" is after FA_SUSPENDED (event
  # 4 on 2026-06-01) and before FA_REACTIVATED (event 5 on 2026-06-10), so
  # reconstructed lifecycle must be Suspended.
  # ---------------------------------------------------------------------------

  @happy-path @ac-10 @p0
  Scenario: As-of timestamp inside a Suspended state window returns lifecycle = Suspended in reconstructed snapshot (AC-10)
    Given I am logged in as Power User (Bank Admin) "Vincent Brooke" with a valid session bound to Tenant ID "TNT-00042"
    And "FA-Audit-Alpha" was Suspended at "2026-06-01T11:00:00Z" and Reactivated at "2026-06-10T09:30:00Z"
    When I GET "/api/framework-agreements/FA-Audit-Alpha/reconstruct?asOf=2026-06-05T12:00:00Z"
    Then the response status should be 200
    And the reconstructed FA state should include lifecycle "Suspended"
    And the reconstructed FA state should include maxVolumeEUR "1500000.00" (the value at that timestamp — unchanged since the 2026-05-15 edit)
    And the reconstructed FA state should NOT reflect the FA_REACTIVATED event (its timestamp 2026-06-10 is after the requested asOf)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-09, AC-16, AC-17
  # CSV export role gating. Power User (Bank Admin) exports without a reason
  # (matrix "✓"); Back Office / Risk exports WITH a stated reason (matrix
  # "✓ (with reason)") which is recorded in the audit event; Auditor exports.
  # Every export emits FA_AUDIT_EXPORT with actor + faId + reason + timestamp
  # + rowCount. LC + Support cannot export (covered by AC-15 Outline).
  # ---------------------------------------------------------------------------

  @happy-path @ac-09 @ac-16 @ac-17 @p0
  Scenario Outline: CSV export role gating + reason capture + FA_AUDIT_EXPORT event (AC-09, AC-16, AC-17)
    Given I am logged in as <role> with a valid session <session_scope>
    When I GET "/api/framework-agreements/FA-Audit-Alpha/audit-history/export.csv<query_string>"
    Then the response status should be <status>
    And the response Content-Type should be "text/csv"
    And the CSV response body should include a header row and 7 data rows (one per event in FA-Audit-Alpha history)
    And an audit event "FA_AUDIT_EXPORT" should be emitted with payload:
      | Field     | Expected value                                                                    |
      | actor     | the current logged-in actor identifier                                            |
      | faId      | FA-Audit-Alpha                                                                    |
      | reason    | <expected_reason>                                                                 |
      | timestamp | ISO 8601 datetime within 5 seconds of "now"                                       |
      | rowCount  | 7                                                                                 |

    Examples:
      | role                        | session_scope                                            | query_string                          | status | expected_reason                                          |
      | Power User (Bank Admin)     | tenant "TNT-00042"                                       |                                       | 200    | null (matrix "✓" — no reason required)                   |
      | Back Office / Risk          | tenant "TNT-00042"                                       | ?reason=Regulatory%20review%20request | 200    | "Regulatory review request" (matrix "✓ (with reason)")   |
      | Auditor                     | engagement scope covering tenant "TNT-00042"             |                                       | 200    | null (matrix "✓" — no reason required)                   |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # As-of timestamp in the future rejected with structured 400. Upper bound of
  # the validation rule: "≥ FA creation timestamp AND ≤ now".
  # ---------------------------------------------------------------------------

  @main-error @ac-08 @p0
  Scenario: As-of timestamp in the future returns structured 400 (AC-08)
    Given I am logged in as Power User (Bank Admin) "Vincent Brooke" with a valid session bound to Tenant ID "TNT-00042"
    And the current server time is "2026-07-24T10:00:00Z"
    When I GET "/api/framework-agreements/FA-Audit-Alpha/reconstruct?asOf=2027-01-01T00:00:00Z"
    Then the response status should be 400
    And the response body should include a machine-readable error code identifying the as-of upper-bound violation (as-of > now)
    And no reconstructed FA state should be returned in the response payload

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # As-of timestamp before FA creation returns structured error message
  # "FA did not exist at the requested timestamp". Lower bound of the
  # validation rule.
  # Design gap logged: verbatim error message wording — spec text captured
  # here behaviourally.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: As-of timestamp before FA creation returns "FA did not exist at the requested timestamp" (AC-11)
    Given I am logged in as Power User (Bank Admin) "Vincent Brooke" with a valid session bound to Tenant ID "TNT-00042"
    And "FA-Audit-Alpha" was created at "2026-05-02T09:00:00Z"
    When I GET "/api/framework-agreements/FA-Audit-Alpha/reconstruct?asOf=2026-04-01T00:00:00Z"
    Then the response status should be 400
    And the response body should include an error message conveying "FA did not exist at the requested timestamp"
    And the response body should include a machine-readable error code identifying the as-of lower-bound violation (as-of < FA creation)
    And no reconstructed FA state should be returned in the response payload

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13
  # Audit Trail service unavailable. API returns 503; UI shows retry option.
  # Contrast with utilization surface (808 AC-10): audit data must NEVER be
  # served stale — no cached fallback is permitted here.
  # Design gap logged: verbatim retry banner copy.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @p0
  Scenario: Audit Trail service unavailable returns 503 without stale-cache fallback (AC-13)
    Given I am logged in as Power User (Bank Admin) "Vincent Brooke" with a valid session bound to Tenant ID "TNT-00042"
    And the Audit Trail service is currently unavailable (simulated downstream failure)
    And a stale cache entry may exist locally for "FA-Audit-Alpha" audit history
    When I GET "/api/framework-agreements/FA-Audit-Alpha/audit-history"
    Then the response status should be 503
    And the response body should NOT include any stale audit event rows
    And the response body should include a machine-readable error code identifying "audit trail unavailable"
    And the Audit tab should render a retry affordance
    And no audit event should be surfaced to the user from a cached source (stale cache is not permitted for audit data)

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-15
  # RBAC 404 + justification filtering. Uniform 404-not-403 for LC User,
  # Support, and Front Office (Permission Matrix ✗ on view). Justification
  # text is filtered from LC User and Support DTOs — asserted via JSON-key
  # absence pattern (inherits DOM+JSON absence pattern from PRD1042-812 and
  # PRD1042-808). Power User (Bank Admin), Back Office / Risk, and Auditor
  # get 200 with justification present.
  # Also covers cross-tenant read attempt from LC User bound to Beta LC:
  # cross-tenant → 404 via tenant isolation.
  # ---------------------------------------------------------------------------

  @main-error @ac-15 @p0
  Scenario Outline: RBAC 404 + LC/Support justification-filter Outline (AC-15)
    Given I am logged in as <role> with a valid session <session_scope>
    When I GET "/api/framework-agreements/<faId>/audit-history"
    Then the response status should be <status>
    And the response body should match "<dto_shape>"

    Examples:
      | role                        | session_scope                                            | faId              | status | dto_shape                                                                                                                                     |
      | Power User (Bank Admin)     | tenant "TNT-00042"                                       | FA-Audit-Alpha    | 200    | full 7-event history, every governed event row includes non-empty "justification" field (activation, edit, suspension, reactivation)          |
      | Back Office / Risk          | tenant "TNT-00042"                                       | FA-Audit-Alpha    | 200    | full 7-event history, "justification" field present on governed events                                                                        |
      | Auditor                     | engagement scope covering tenant "TNT-00042"             | FA-Audit-Alpha    | 200    | full 7-event history, "justification" field present on governed events (Auditor authorized to view governance justification)                  |
      | Front Office                | tenant "TNT-00042"                                       | FA-Audit-Alpha    | 404    | none — Front Office has no audit-view permission (Permission Matrix ✗)                                                                        |
      | LC User                     | LC "New Group Trade", tenant "TNT-00042"                 | FA-Audit-Alpha    | 404    | none — LC User has no audit-view permission (Permission Matrix ✗); response body contains no event rows                                       |
      | LC User                     | LC "Beta Leasing GmbH", tenant "TNT-00099"               | FA-Audit-Alpha    | 404    | none — cross-tenant read (LC bound to TNT-00099 attempting TNT-00042 FA); 404 via tenant isolation                                             |
      | Support (grant-scoped)      | tenant "TNT-00042", active support grant covering FA-Audit-Alpha | FA-Audit-Alpha    | 404    | none — Support has no audit-view permission (Permission Matrix ✗); support grants do NOT extend to audit history                              |
```
