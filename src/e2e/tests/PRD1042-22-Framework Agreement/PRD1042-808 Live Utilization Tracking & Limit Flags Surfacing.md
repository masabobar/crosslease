# PRD1042-808 — US 11.9 | Framework Agreement | Live Utilization Tracking & Limit Flags Surfacing

Generated: 2026-07-24
Story: PRD1042-808 — US 11.9 | Framework Agreement | Live Utilization Tracking & Limit Flags Surfacing
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (17 derived ACs from Functional Requirements + Field Specification + Validation Rules + System Behavior + Security Requirements + Non-Functional Requirements + Edge Cases + Audit Requirements, description present with permission matrix + endpoint contract + event fan-out, stakeholder-reviewed, Dev in progress; children BE PRD1042-1360, FE PRD1042-1361 QA-ready, QA PRD1042-1362)
ACs with Gherkin scenarios: 10 of 17 | Blocked: 0 | Excluded: 7 (2 separate-feature — Epic 26 audit + Epic 31 event bus / Validation Engine; 5 edge-case / bundled / NFR — scope filter table only)
Updated per CR PRD1042-1495 (2026-07-24): List-view surfacing of utilization figures (US 11.03 mini-gauge + limit flag badges columns) is HIDDEN per CR A1/A3 (1495) — UI-only change; backend endpoints `GET /utilization` + `POST /utilization:batch` remain active and unchanged. Detail-view Utilization tab (US 11.04) surfacing is RETAINED. AC-17 batch endpoint remains testable at API layer but has no user-visible list-view consumer in November MVP. FE team may optionally pause list-view surfacing work per PO note.
Updated per CR PRD1042-22 Reconciliation v10 (2026-07-27): **[CR-PENDING B4]** on the ENTIRE utilization surface — v10 §7 pending decision: the used-against-approved figure should be sourced from REAL FINANCINGS (not Limit Management) per v10 §6 US 11.9. Current 808 scenarios source everything from Limit Management (spec-anchored). Once Philipp confirms the reference figure, this suite may need to be re-anchored to real-financings computation. **CRITICAL non-gating invariant confirmed** — §6 US 11.9: "No operation is blocked, refused, or gated on the strength of the utilisation figure." AC-11 (blocking new Financing assembly by Validation & Gating on Limit Breach) is already classified `separate-feature` — behaviour remains valid but belongs to the Validation & Gating Engine suite, not this surfacing story. Header display of Limit Breach Flag is INFORMATIONAL only per v10. State model 4 stored values reinforced.
Figma design: Shared Epic 11 file `aQGn5OLEjEGJO7xGzFikP5`. Target frames — Utilization tab within FA detail view (US 11.04) + list-view utilization column (US 11.03). Stage 2 FAILED (MCP `get_metadata` returned "You've reached the Figma MCP tool call limit for your View seat on the Professional plan" — same quota state as prior 803/804/805/806/807/809/812 batch; REST `/v1/files` also quota-exhausted per [[feedback-figma-nodes-fallback]] confirmed in prior sessions on this token; WebFetch cannot pass `X-Figma-Token`; no shell available; no cached PNG fixture in `rendered-nodes/` for a Utilization tab or list-view mini-gauge). Design-blind, spec-anchored per user directive; verbatim gauge / badge / tooltip / mini-gauge / stale-state copy remains an OPEN design gap logged in the Design specification section below.

---

## AC Scope Filter

| AC    | Description                                                                                                                                                                            | Classification     | Rationale                                                                                                                                                                                                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Utilization figures surfaced on FA detail view (US 11.04 Utilization tab), FA list view (US 11.03 columns), and via API for external consumers                                         | `happy-path`       | Core success flow — GET returns full field spec + UI renders Utilization tab                                                                                                                                                                                                                        |
| AC-02 | All figures read live from Limit Management; FA does NOT compute or persist utilization itself                                                                                         | `edge-case`        | Implementation invariant — asserted only indirectly through AC-01 field-source contract; no distinct user-visible test surface                                                                                                                                                                      |
| AC-03 | Limit Available Flag = true when Available Volume > 0 AND FA lifecycle = Active; otherwise false                                                                                       | `happy-path`       | Derived-state assertion — Outline covers Active+available (true) plus non-Active states + zero-Available (false)                                                                                                                                                                                    |
| AC-04 | Limit Breach Flag = true when Net Exposure > Max Volume                                                                                                                                | `main-error`       | Breach condition — governed error/warning state on the utilization surface                                                                                                                                                                                                                          |
| AC-05 | Utilization figures update on: confirmed disbursement, reconciled redemption, governed Max Volume change (US 11.10)                                                                    | `happy-path`       | Cache invalidation on each of the 3 event types → next read reflects updated figures                                                                                                                                                                                                                |
| AC-06 | 9-field spec: Max Volume, Disbursed Volume, Redeemed Volume, Net Exposure, Available Volume, Utilization %, Limit Available Flag, Limit Breach Flag, Last Refreshed At                 | `happy-path`       | Bundled into AC-01 happy path — the response payload is asserted field-by-field once inside the single-FA happy scenario                                                                                                                                                                            |
| AC-07 | Utilization values non-negative; negative Net Exposure (post-redemption surplus) clamped to 0 with audit alert                                                                         | `main-error`       | Validation guard on data quality — clamp behaviour plus audit-alert emission                                                                                                                                                                                                                        |
| AC-08 | Limit Breach Flag remains true until utilization returns within Max Volume (via redemption or governed Max Volume increase)                                                            | `edge-case`        | Behavioural invariant already covered end-to-end by AC-04 (set) + AC-12 (resolve); no additional test surface beyond the pair                                                                                                                                                                       |
| AC-09 | `GET /api/framework-agreements/{id}/utilization` live read; cached 120s server-side; cache-bust on disbursement.confirmed / redemption.reconciled / fa.max-volume.changed              | `happy-path`       | Bundled — endpoint shape asserted in AC-01 (single-FA GET) and cache-invalidation semantics asserted in AC-05                                                                                                                                                                                       |
| AC-10 | Limit Management unavailable → HTTP 503 with stale-cached values + explicit staleness timestamp; UI shows "—" with retry after cache TTL                                               | `main-error`       | Degraded / failover state — governed error path with structured 503 payload                                                                                                                                                                                                                         |
| AC-11 | Limit Breach triggers `fa.limit.breached` event to Notification Center; new Financing assembly blocked by Validation & Gating Engine; existing Financings continue                     | `separate-feature` | Event-bus fan-out + Validation & Gating Engine blocking behaviour — belongs to Epic 31 Part A (Notification Center) + Validation & Gating Engine integration tests, not to the surfacing story                                                                                                      |
| AC-12 | Redemption brings Net Exposure back below Max Volume → Limit Breach Flag false + `fa.limit.breach.resolved` event                                                                      | `happy-path`       | Resolve flow — flag flips false after redemption event is reconciled and cache is busted                                                                                                                                                                                                            |
| AC-13 | RBAC per Permission Matrix (6 roles); LC users receive only Max Volume, Available Volume, and Limit Available Flag; Disbursed / Redeemed / Net Exposure / Limit Breach Flag are hidden | `main-error`       | Differentiated DTO shape by role (LC-truncated) + unauthorized role 404 — Outline covers all roles including LC hidden-field pattern                                                                                                                                                                |
| AC-14 | Utilization API tenant-scoped; cross-tenant reads blocked                                                                                                                              | `main-error`       | Bundled into AC-13 role Outline as an additional row (LC cross-LC = 404, tenant isolation domain rule)                                                                                                                                                                                              |
| AC-15 | Non-Functional: single FA p95 ≤ 800ms; batch (≤ 50 FAs) ≤ 1.5s; Limit Management availability 99.5% during business hours                                                              | `edge-case`        | Performance NFR — not E2E-deterministic; belongs to load/perf harness, not manual BDD                                                                                                                                                                                                               |
| AC-16 | Audit events: FA_LIMIT_BREACHED and FA_LIMIT_BREACH_RESOLVED with full payloads                                                                                                        | `separate-feature` | Audit payload assertions belong to Epic 26 audit-schema tests; surfacing story asserts only that the events fire (behaviourally checked inside AC-04 and AC-12)                                                                                                                                     |
| AC-17 | Batch API: `POST /api/framework-agreements/utilization:batch` with body `{ faIds[] }` for list view performance                                                                        | `happy-path`       | Batch endpoint — list-view page-read contract distinct from single-FA GET. Per CR A1/A3, list-view mini-gauge and flag badge columns are hidden in the November MVP — endpoint still active (BE unchanged) but has no visible UI consumer; retained for later re-enablement and API-level assertion |

**Gherkin generated for:** AC-01, AC-03, AC-04, AC-05, AC-07, AC-10, AC-12, AC-13 (+AC-14 bundled), AC-17
**Blocked (no Gherkin):** none — spec is self-contained; every governed happy + error path is testable given seeded FAs
**No Gherkin (edge-case / bundled / separate-feature):** AC-02, AC-06 (bundled into AC-01), AC-08 (bundled into AC-04+AC-12), AC-09 (bundled into AC-01+AC-05), AC-11 (Epic 31 event bus + Validation Engine), AC-15 (NFR), AC-16 (Epic 26 audit)

---

## Scenarios summary

| Tag           | Scenario                                                                                                                         | AC                  | Priority | E2E                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------- | ---------------------------------------------------------------- |
| `@happy-path` | Power User (Bank Admin) reads live utilization on Active FA (all 9 fields populated + Limit Available true + Limit Breach false) | AC-01, AC-06, AC-09 | P0       | ⚙️ needs seeded Active FA + Limit Management fixture             |
| `@happy-path` | Limit Available Flag Outline — true iff Available > 0 AND lifecycle = Active                                                     | AC-03               | P0       | ⚙️ needs seeded FA states (Active / Suspended / Terminated)      |
| `@happy-path` | Cache-bust on `disbursement.confirmed` — next GET returns updated Disbursed Volume + Net Exposure                                | AC-05, AC-09        | P0       | ⚙️ needs D-EventBus-Inspection + disbursement fixture            |
| `@happy-path` | Cache-bust on `fa.max-volume.changed` (US 11.10) — next GET returns updated Max Volume + Available Volume + Utilization %        | AC-05               | P0       | ⚙️ needs D-EventBus-Inspection + max-volume-change fixture       |
| `@happy-path` | Redemption clears Limit Breach Flag when Net Exposure returns within Max Volume (`fa.limit.breach.resolved` emitted)             | AC-12               | P0       | ⚙️ needs D-EventBus-Inspection + redemption fixture              |
| `@happy-path` | Batch utilization read for a list-view page of ≤ 50 FAs returns one payload keyed by faId                                        | AC-17               | P0       | ⚙️ needs seeded batch of Active FAs                              |
| `@main-error` | Disbursement pushing Net Exposure > Max Volume flips Limit Breach Flag true (`fa.limit.breached` emitted)                        | AC-04               | P0       | ⚙️ needs D-EventBus-Inspection + over-limit disbursement fixture |
| `@main-error` | Negative Net Exposure (post-redemption surplus) is clamped to 0 with audit alert                                                 | AC-07               | P0       | ⚙️ needs seeded over-redemption fixture                          |
| `@main-error` | Limit Management unavailable → GET returns HTTP 503 with stale cached values + staleness timestamp; UI shows "—"                 | AC-10               | P0       | ⚙️ needs D-LimitMgmt-Degraded                                    |
| `@main-error` | RBAC + LC DTO truncation Outline — non-view roles get 404; LC gets truncated 3-field DTO; LC cross-LC gets 404                   | AC-13, AC-14        | P0       | ⚙️ needs D20 (second tenant) + LC user fixture                   |

Active scenario blocks: 10 (2 Outlines + 8 Scenarios)
E2E automation candidates: 0 of 10 scenarios ✅ (all 10 need seeded fixture data or `D-EventBus-Inspection` / `D-LimitMgmt-Degraded` / `D20` infrastructure)

---

## Design specification (source of truth)

**Stage 2 DESIGN-BLIND.** Story description places the utilization surface in two locations:

1. **FA detail view — Utilization tab (US 11.04):** bar gauge with color zones + 9-field summary panel + Limit Breach red badge with explanatory tooltip. **RETAINED per November MVP.**
2. **FA list view (US 11.03) columns:** inline mini-gauge column + flag badges. **HIDDEN per CR PRD1042-1495 A1/A3 (2026-07-20)** — the list-view surfacing is deferred; the backend contract stays unchanged. Batch endpoint remains callable at API layer, but no user-visible consumer exists in the November list view.

No PNG fixture for either surface has been exported to `src/e2e/fixtures/figma-e11/rendered-nodes/`. The shared Epic 11 file `aQGn5OLEjEGJO7xGzFikP5` is known to contain the FA detail canvas, but the Utilization tab node ID has not been enumerated in prior batch memory. MCP is quota-exhausted, REST `/v1/files` was quota-exhausted last session with `Retry-After` in the multi-day range on this same token, `WebFetch` cannot pass `X-Figma-Token`, and no shell is available to run `curl` for the `/v1/files/{key}/nodes` fallback (see [[feedback-figma-nodes-fallback]]).

Scenarios below are anchored to the **Jira story spec verbatim** rather than design copy. Where verbatim gauge / badge / tooltip / mini-gauge / stale-state UI copy would ordinarily anchor assertions, assertions are described in **behavioural** terms — element role, field presence + value, badge state — and left open for a copy-pass tightening once the design fixture is exported. Scenario execution against the running application is not blocked: assertions match the spec's payload contract; only display copy will need verbatim confirmation post-fixture-export.

**Spec anchors (verbatim from Jira description):**

| Anchor                    | Verbatim wording                                                                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Utilization surfaces      | "Utilization figures are surfaced on FA detail view (US 11.04 Utilization tab), FA list view (US 11.03 columns), and via API for external consumers."                                           |
| Ownership                 | "All figures are read live from Limit Management; Framework Agreement does NOT compute or persist utilization itself."                                                                          |
| Limit Available Flag rule | "Limit Available Flag is true when Available Volume > 0 AND FA lifecycle = Active. Otherwise false."                                                                                            |
| Limit Breach Flag rule    | "Limit Breach Flag is true when Net Exposure > Max Volume. Used to surface override / data-quality conditions."                                                                                 |
| Update triggers           | "Utilization figures update on: confirmed disbursement (Disbursed Volume increases), reconciled redemption (Redeemed Volume increases), governed Max Volume change (US 11.10)."                 |
| Net Exposure formula      | "Net Exposure = Disbursed − Redeemed (computed by Limit Management)."                                                                                                                           |
| Available Volume formula  | "Available Volume = Max Volume − Net Exposure."                                                                                                                                                 |
| Utilization % formula     | "Utilization % = Net Exposure / Max Volume × 100."                                                                                                                                              |
| Negative-NE clamp         | "Utilization values are non-negative; negative Net Exposure (post-redemption surplus) is clamped to 0 with audit alert."                                                                        |
| Breach persistence        | "Limit Breach Flag remains true until utilization returns within Max Volume (via redemption or governed Max Volume increase)."                                                                  |
| Single-FA endpoint        | "GET /api/framework-agreements/{id}/utilization issues a live read to Limit Management."                                                                                                        |
| Cache TTL + bust          | "Cached for maximum 2 minutes server-side; cache-bust on receipt of any disbursement.confirmed, redemption.reconciled, or fa.max-volume.changed event."                                         |
| Degraded state            | "If Limit Management is unavailable, API returns HTTP 503 with stale-cached values where available and an explicit \"staleness\" timestamp."                                                    |
| Batch endpoint            | "List view (US 11.03) batch-reads utilization for visible page rows in a single Limit Management batch query."                                                                                  |
| LC DTO truncation         | "LC users receive only Max Volume, Available Volume, and Limit Available Flag in their DTO; Disbursed, Redeemed, Net Exposure, and Limit Breach Flag are hidden."                               |
| Tenant isolation          | "Utilization API tenant-scoped; cross-tenant reads blocked."                                                                                                                                    |
| Breach event              | "Limit Breach Flag set true. Notification Center event-bus emits fa.limit.breached (per NC-US-N1). Existing Financings continue; new financing assembly blocked by Validation & Gating Engine." |
| Breach-resolved event     | "Redemption brings Net Exposure back below Max Volume — Limit Breach Flag set false. fa.limit.breach.resolved event emitted."                                                                   |

**Endpoints:**

- `GET /api/framework-agreements/{id}/utilization` — single FA live read
- `POST /api/framework-agreements/utilization:batch` — body `{ faIds: string[] }` for list view page reads

**Utilization Read API payload (9 fields, all Mandatory):**

| Field                | Type     | Source / Notes                                                  |
| -------------------- | -------- | --------------------------------------------------------------- |
| Max Volume EUR       | Decimal  | Framework Agreement field (not from Limit Management)           |
| Disbursed Volume     | Decimal  | Limit Management — sum of confirmed disbursements under this FA |
| Redeemed Volume      | Decimal  | Limit Management — sum of reconciled redemptions                |
| Net Exposure         | Decimal  | Disbursed − Redeemed (computed by Limit Management)             |
| Available Volume     | Decimal  | Max Volume − Net Exposure                                       |
| Utilization %        | Decimal  | Net Exposure / Max Volume × 100                                 |
| Limit Available Flag | Boolean  | Limit Management                                                |
| Limit Breach Flag    | Boolean  | Limit Management                                                |
| Last Refreshed At    | DateTime | Timestamp of latest Limit Management read                       |

**Permission Matrix (from Jira story description):**

| Role                    | View utilization figures          | View Limit Available Flag | View Limit Breach Flag |
| ----------------------- | --------------------------------- | ------------------------- | ---------------------- |
| Power User (Bank Admin) | ✓                                 | ✓                         | ✓                      |
| Front Office            | ✓ (Active FA only)                | ✓                         | ✓                      |
| Back Office / Risk      | ✓                                 | ✓                         | ✓                      |
| LC User                 | ✓ (own LC, available volume only) | ✓ (own LC)                | ✗                      |
| Support                 | ✓ (grant-scoped, summary)         | ✓                         | ✓                      |
| Auditor                 | ✓                                 | ✓                         | ✓                      |

**Audit events emitted:**

- `FA_LIMIT_BREACHED` — `{ faId, tenantId, netExposure, maxVolume, breachTriggerEvent, timestamp }`
- `FA_LIMIT_BREACH_RESOLVED` — `{ faId, netExposure, maxVolume, resolutionTriggerEvent, timestamp }`

**Consumed events (cache invalidation triggers):** `disbursement.confirmed`, `redemption.reconciled`, `fa.max-volume.changed`

**[CR-PENDING B4] Non-gating invariant (v10 §6 US 11.9):** "No operation is blocked, refused, or gated on the strength of the utilisation figure." This suite's scenarios remain valid as informational surfacing; the Validation & Gating Engine blocking-behaviour scenario (AC-11) is out of scope here (already classified `separate-feature`). SOURCE OF TRUTH for the used-against-approved figure is contested (Limit Management per current spec vs REAL FINANCINGS per v10 §6). Suite will need re-anchoring once Philipp confirms — until then, treat all Limit Management-sourced assertions as B4-provisional.

**Consistency with prior Epic 11 stories:**

- Read-only surfacing story — no Four-Eyes, no governed modal, no wizard (contrast with [[project-prd1042-804-framework-agreement-suspension]], [[project-prd1042-805-framework-agreement-reactivation]], [[project-prd1042-806-framework-agreement-termination]]).
- 404-not-403 pattern on unauthorized roles mirrors 803/804/805/806/807/809/812 batch.
- LC hidden-field pattern (DOM + JSON-key absence) mirrors PRD1042-812 LC Portal Summary View (see `feedback` in [[project-prd1042-812]] — hidden-bank-internal-fields validated by both DOM absence and JSON-key absence).
- Limit Breach Flag as historical evidence pattern matches PRD1042-806 AC-09 (Termination proceeds despite Limit Breach Flag).

---

## Feature file

```gherkin
@framework-agreement @us-11.9 @p0
Feature: Live Utilization Tracking & Limit Flags Surfacing (US 11.9 — PRD1042-808)
  As a Power User (Bank Admin) or Back Office / Risk user
  I want to see live utilization figures and limit flags on every Framework Agreement
  So that I have real-time visibility into how much of the credit envelope is consumed and whether the limit is approaching or has been breached

  Background:
    Given the RefiNext platform is up and healthy
    And a Framework Agreement "FA-Utilization-Normal" exists in Active state bound to Leasing Company "New Group Trade" (Tenant ID "TNT-00042") with Max Volume 1,000,000.00 EUR, Disbursed Volume 400,000.00, Redeemed Volume 100,000.00
    And a Framework Agreement "FA-Utilization-AtLimit" exists in Active state with Max Volume 500,000.00, Disbursed 500,000.00, Redeemed 0.00 (Available = 0)
    And a Framework Agreement "FA-Utilization-Breach" exists in Active state with Max Volume 200,000.00, Disbursed 220,000.00, Redeemed 0.00 (breach configured)
    And a Framework Agreement "FA-Utilization-Suspended" exists in Suspended state with Max Volume 800,000.00, Disbursed 300,000.00, Redeemed 50,000.00
    And a Framework Agreement "FA-Utilization-Terminated" exists in Terminated state
    And a Framework Agreement "FA-Beta-Utilization" exists in Active state bound to Leasing Company "Beta Leasing GmbH" (Tenant ID "TNT-00099")

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-06, AC-09
  # Power User (Bank Admin) reads live utilization on an Active FA. Response
  # contains all 9 mandatory fields with values computed by Limit Management.
  # Limit Available Flag = true (Available > 0 AND lifecycle Active); Limit
  # Breach Flag = false (Net Exposure < Max Volume). Detail-view Utilization
  # tab renders the gauge + badges accordingly.
  # ---------------------------------------------------------------------------

  # [CR-PENDING B4] — v10 §6 US 11.9 pending: SOURCE OF TRUTH is contested.
  # Current spec sources from Limit Management (assumed here); v10 proposes
  # REAL FINANCINGS. Assertions remain valid as behavioural contract; once
  # Philipp confirms, this scenario may re-anchor to real-financings compute.
  # Non-gating invariant is CONFIRMED: no operation blocks on this figure.

  @happy-path @ac-01 @ac-06 @ac-09 @p0 @cr-pending-b4
  Scenario: Power User (Bank Admin) reads live utilization on a normal Active FA (AC-01, AC-06, AC-09)
    Given I am logged in as Power User (Bank Admin) with a valid session bound to Tenant ID "TNT-00042"
    And I am viewing "FA-Utilization-Normal" detail
    When the FA detail view loads the Utilization tab
    Then a GET request to "/api/framework-agreements/FA-Utilization-Normal/utilization" should be sent
    And the response status should be 200
    And the response payload should include all 9 mandatory fields:
      | Field                | Expected value / kind                                  |
      | maxVolumeEUR         | 1000000.00                                             |
      | disbursedVolume      | 400000.00                                              |
      | redeemedVolume       | 100000.00                                              |
      | netExposure          | 300000.00 (= disbursed − redeemed)                     |
      | availableVolume      | 700000.00 (= maxVolume − netExposure)                  |
      | utilizationPercent   | 30.00 (= netExposure / maxVolume × 100)                |
      | limitAvailableFlag   | true                                                   |
      | limitBreachFlag      | false                                                  |
      | lastRefreshedAt      | ISO 8601 datetime, within 120 seconds of "now"         |
    And the Utilization tab should render a bar gauge indicating ~30% utilization
    And the Limit Available badge should be present and marked positive
    And the Limit Breach badge should NOT be rendered (flag false)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03
  # Limit Available Flag = true iff Available Volume > 0 AND lifecycle Active.
  # Outline covers: normal Active + Available > 0 (true), Active + Available = 0
  # (false), Suspended (false), Terminated (false).
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @p0
  Scenario Outline: Limit Available Flag derived-state Outline (AC-03)
    Given I am logged in as Power User (Bank Admin) with a valid session bound to Tenant ID "TNT-00042"
    When I GET "/api/framework-agreements/<faId>/utilization"
    Then the response status should be 200
    And the response field "limitAvailableFlag" should be <expected_flag>
    And the response field "availableVolume" should equal <expected_available>

    Examples:
      | faId                       | expected_available | expected_flag |
      | FA-Utilization-Normal      | 700000.00          | true          |
      | FA-Utilization-AtLimit     | 0.00               | false         |
      | FA-Utilization-Suspended   | 550000.00          | false         |
      | FA-Utilization-Terminated  | N/A                | false         |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05, AC-09
  # Cache-bust on disbursement.confirmed — next read within the 120s TTL
  # window returns updated Disbursed Volume + Net Exposure rather than the
  # previously cached snapshot.
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @ac-09 @p0
  Scenario: Cache-bust on disbursement.confirmed returns fresh utilization on next GET (AC-05, AC-09)
    Given I am logged in as Power User (Bank Admin) with a valid session bound to Tenant ID "TNT-00042"
    And I GET "/api/framework-agreements/FA-Utilization-Normal/utilization" and receive disbursedVolume = 400000.00 and netExposure = 300000.00
    When a Limit Management event "disbursement.confirmed" is emitted for "FA-Utilization-Normal" with amount 50000.00
    And I GET "/api/framework-agreements/FA-Utilization-Normal/utilization" within 5 seconds
    Then the response status should be 200
    And the response field "disbursedVolume" should equal 450000.00
    And the response field "netExposure" should equal 350000.00
    And the response field "availableVolume" should equal 650000.00
    And the response field "lastRefreshedAt" should be later than the previous "lastRefreshedAt"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-05
  # Cache-bust on fa.max-volume.changed (from US 11.10) — a governed Max
  # Volume change invalidates the utilization cache; next GET returns updated
  # Max Volume + Available Volume + Utilization %.
  # ---------------------------------------------------------------------------

  @happy-path @ac-05 @p0
  Scenario: Cache-bust on fa.max-volume.changed returns fresh utilization on next GET (AC-05)
    Given I am logged in as Power User (Bank Admin) with a valid session bound to Tenant ID "TNT-00042"
    And I GET "/api/framework-agreements/FA-Utilization-Normal/utilization" and receive maxVolumeEUR = 1000000.00, availableVolume = 700000.00, utilizationPercent = 30.00
    When a Limit Management event "fa.max-volume.changed" is emitted for "FA-Utilization-Normal" with new Max Volume 1,200,000.00
    And I GET "/api/framework-agreements/FA-Utilization-Normal/utilization" within 5 seconds
    Then the response status should be 200
    And the response field "maxVolumeEUR" should equal 1200000.00
    And the response field "availableVolume" should equal 900000.00
    And the response field "utilizationPercent" should equal 25.00
    And the response field "lastRefreshedAt" should be later than the previous "lastRefreshedAt"

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-12
  # Redemption brings Net Exposure back below Max Volume for an FA that was
  # in breach. Limit Breach Flag flips false and fa.limit.breach.resolved
  # event is emitted.
  # ---------------------------------------------------------------------------

  @happy-path @ac-12 @p0
  Scenario: Redemption clears Limit Breach Flag when Net Exposure returns within Max Volume (AC-12)
    Given I am logged in as Power User (Bank Admin) with a valid session bound to Tenant ID "TNT-00042"
    And I GET "/api/framework-agreements/FA-Utilization-Breach/utilization" and receive limitBreachFlag = true and netExposure = 220000.00 and maxVolumeEUR = 200000.00
    When a Limit Management event "redemption.reconciled" is emitted for "FA-Utilization-Breach" with amount 30000.00
    And I GET "/api/framework-agreements/FA-Utilization-Breach/utilization" within 5 seconds
    Then the response status should be 200
    And the response field "netExposure" should equal 190000.00
    And the response field "limitBreachFlag" should be false
    And an audit event "FA_LIMIT_BREACH_RESOLVED" should be emitted with faId "FA-Utilization-Breach", netExposure 190000.00, maxVolume 200000.00, resolutionTriggerEvent "redemption.reconciled"
    And the Utilization tab should no longer display the Limit Breach red badge

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-17
  # Batch utilization read for a page of ≤ 50 FAs returns one payload keyed by
  # faId. Backend contract retained for future re-enablement.
  # Per CR PRD1042-1495 A3 (2026-07-20): the list-view mini-gauge + flag badge
  # columns that consumed this batch endpoint are HIDDEN in the November MVP.
  # The endpoint remains callable — this scenario now asserts the API contract
  # only, NOT any list-view UI rendering (list view no longer surfaces these
  # values per CR A1/A3).
  # ---------------------------------------------------------------------------

  @happy-path @ac-17 @p0
  Scenario: Batch utilization read for a page of Active FAs — API contract only (AC-17)
    Given I am logged in as Power User (Bank Admin) with a valid session bound to Tenant ID "TNT-00042"
    When a POST request is sent to "/api/framework-agreements/utilization:batch" with body {"faIds": ["FA-Utilization-Normal", "FA-Utilization-AtLimit", "FA-Utilization-Breach", "FA-Utilization-Suspended"]}
    Then the response status should be 200
    And the response payload should contain one utilization object keyed by each requested faId
    And each utilization object should contain all 9 mandatory fields (maxVolumeEUR, disbursedVolume, redeemedVolume, netExposure, availableVolume, utilizationPercent, limitAvailableFlag, limitBreachFlag, lastRefreshedAt)
    # NOTE: Per CR PRD1042-1495 A3, the FA list view no longer surfaces mini-gauge or Limit Breach / Limit Available flag badges.
    # The former UI assertions ("list view row for FA-Utilization-Breach should render the Limit Breach red badge" +
    # "list view row for FA-Utilization-AtLimit should render Available Volume 0 indicator") are REMOVED here;
    # they can be reinstated if the list-view surfacing is re-enabled post-MVP.

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # A disbursement that pushes Net Exposure above Max Volume flips the Limit
  # Breach Flag to true. The FA_LIMIT_BREACHED event is persisted to audit and
  # fa.limit.breached is emitted to Notification Center. Existing Financings
  # continue (not asserted here — belongs to Validation Engine tests).
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0
  Scenario: Disbursement pushing Net Exposure > Max Volume flips Limit Breach Flag true (AC-04)
    Given I am logged in as Power User (Bank Admin) with a valid session bound to Tenant ID "TNT-00042"
    And "FA-Utilization-AtLimit" has Max Volume 500000.00, Disbursed 500000.00, Redeemed 0.00, limitBreachFlag = false
    When a Limit Management event "disbursement.confirmed" is emitted for "FA-Utilization-AtLimit" with amount 20000.00 (pushing Disbursed to 520000.00 and Net Exposure to 520000.00)
    And I GET "/api/framework-agreements/FA-Utilization-AtLimit/utilization" within 5 seconds
    Then the response status should be 200
    And the response field "netExposure" should equal 520000.00
    And the response field "limitBreachFlag" should be true
    And an audit event "FA_LIMIT_BREACHED" should be emitted with faId "FA-Utilization-AtLimit", netExposure 520000.00, maxVolume 500000.00, breachTriggerEvent "disbursement.confirmed"
    And the Utilization tab should display the Limit Breach red badge with an explanatory tooltip

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # A post-redemption surplus (redemptions exceed disbursements — data-quality
  # anomaly) yields a negative Net Exposure at the source. Limit Management
  # clamps the surfaced Net Exposure to 0 and emits an audit alert.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: Negative Net Exposure (post-redemption surplus) is clamped to 0 with audit alert (AC-07)
    Given I am logged in as Power User (Bank Admin) with a valid session bound to Tenant ID "TNT-00042"
    And a Framework Agreement "FA-Utilization-Surplus" exists in Active state with Max Volume 100000.00, Disbursed 40000.00, Redeemed 60000.00 (Net Exposure would be −20000.00 without clamp)
    When I GET "/api/framework-agreements/FA-Utilization-Surplus/utilization"
    Then the response status should be 200
    And the response field "netExposure" should equal 0.00 (clamped, not −20000.00)
    And the response field "availableVolume" should equal 100000.00
    And the response field "utilizationPercent" should equal 0.00
    And an audit alert should be emitted with type "UTILIZATION_NEGATIVE_NET_EXPOSURE_CLAMPED" referencing faId "FA-Utilization-Surplus"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Limit Management is unavailable. The API returns HTTP 503 with the last
  # stale cached values (where available) and an explicit staleness timestamp.
  # The UI degrades to "—" placeholders with a retry affordance after cache TTL.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: Limit Management unavailable returns 503 with stale cached values and staleness timestamp (AC-10)
    Given I am logged in as Power User (Bank Admin) with a valid session bound to Tenant ID "TNT-00042"
    And the Limit Management service is currently unavailable (simulated downstream failure)
    And a stale cache entry exists for "FA-Utilization-Normal" with maxVolumeEUR 1000000.00, disbursedVolume 400000.00, redeemedVolume 100000.00, lastRefreshedAt "2026-07-24T09:00:00Z"
    When I GET "/api/framework-agreements/FA-Utilization-Normal/utilization"
    Then the response status should be 503
    And the response body should contain the last stale-cached utilization values
    And the response body should include an explicit "staleness" timestamp equal to "2026-07-24T09:00:00Z" and NOT equal to "now"
    And the Utilization tab should render "—" placeholders for the numeric utilization fields
    And the Utilization tab should render a retry affordance that is enabled after the 120-second cache TTL elapses

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-13, AC-14
  # RBAC + LC DTO truncation + tenant isolation Outline.
  # - Non-view roles (none in the permission matrix are excluded, but any
  #   role not listed) — 404-not-403 uniformly.
  # - LC User owns-LC — receives truncated 3-field DTO (maxVolumeEUR,
  #   availableVolume, limitAvailableFlag) with all other fields hidden
  #   (asserted via JSON-key absence, mirroring PRD1042-812 hidden pattern).
  # - LC User cross-LC — 404 via tenant isolation.
  # - Front Office reading a non-Active FA — allowed only on Active FA per
  #   matrix; Suspended/Terminated → 404.
  # ---------------------------------------------------------------------------

  @main-error @ac-13 @ac-14 @p0
  Scenario Outline: RBAC + LC DTO truncation + tenant isolation Outline (AC-13, AC-14)
    Given I am logged in as <role> with a valid session <session_scope>
    When I GET "/api/framework-agreements/<faId>/utilization"
    Then the response status should be <status>
    And the response DTO shape should be <dto_shape>

    Examples:
      | role                        | session_scope                        | faId                       | status | dto_shape                                                                                                                                                                                             |
      | Power User (Bank Admin)     | tenant "TNT-00042"                   | FA-Utilization-Normal      | 200    | full 9-field DTO                                                                                                                                                                                       |
      | Back Office / Risk          | tenant "TNT-00042"                   | FA-Utilization-Normal      | 200    | full 9-field DTO                                                                                                                                                                                       |
      | Front Office                | tenant "TNT-00042"                   | FA-Utilization-Normal      | 200    | full 9-field DTO (Active FA — allowed)                                                                                                                                                                 |
      | Front Office                | tenant "TNT-00042"                   | FA-Utilization-Suspended   | 404    | none — Front Office restricted to Active FA only per matrix                                                                                                                                            |
      | Front Office                | tenant "TNT-00042"                   | FA-Utilization-Terminated  | 404    | none — Front Office restricted to Active FA only per matrix                                                                                                                                            |
      | LC User                     | LC "New Group Trade", tenant "TNT-00042" | FA-Utilization-Normal  | 200    | truncated 3-field DTO — only maxVolumeEUR, availableVolume, limitAvailableFlag; disbursedVolume, redeemedVolume, netExposure, utilizationPercent, limitBreachFlag JSON keys ABSENT from response body |
      | LC User                     | LC "New Group Trade", tenant "TNT-00042" | FA-Beta-Utilization    | 404    | none — cross-LC tenant isolation                                                                                                                                                                       |
      | Support (grant-scoped)      | tenant "TNT-00042", grant covering FA-Utilization-Normal | FA-Utilization-Normal | 200 | summary DTO — matrix "grant-scoped, summary" (all 9 fields present, no hidden-key truncation)                                                                                                          |
      | Auditor                     | tenant "TNT-00042"                   | FA-Utilization-Normal      | 200    | full 9-field DTO                                                                                                                                                                                       |
```
