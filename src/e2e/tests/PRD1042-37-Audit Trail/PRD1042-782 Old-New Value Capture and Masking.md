# PRD1042-782 — US 26.5 | AUDIT TRAIL | Old / New Value Capture & Sensitive-Field Masking

Generated: 2026-07-10
Story: PRD1042-782 — US 26.5 | AUDIT TRAIL | Old / New Value Capture & Sensitive-Field Masking
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (15 derived ACs, description present, stakeholder-reviewed by Philipp Maute 2026-05-29 v1.2 approval + Marko Mrdja 2026-06-18 dev-side refinement proposal, Ready for DEV Review)
ACs with Gherkin scenarios: 6 of 15 | Blocked: 3 (D-Audit-API, D-Snapshot-Ref, D-Privileged-Path) | Excluded: 6 (edge-case or separate-feature — scope filter table only)
Figma design: Node 1:11090, file 7EkiVhANXOkn65k0jG4uEJ — Screen "E26 -- Audit Trail" (Stage 2 FAILED — MCP quota exhausted on View seat, no REST fallback in this session; design-blind Stage 3)

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                 | Blocking dependency                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| AC-10 | integrityProtectedFlag=true fallback path requires simulating large-payload capture failure — no test harness surface  | D-Audit-API — audit-record write endpoint with fault injection                                      |
| AC-11 | Snapshot-also-unavailable compliance-gap raise requires disabling EntitySnapshotReferenceService — no toggle available | D-Snapshot-Ref — snapshot service failure-injection seam                                            |
| AC-08 | Privileged Auditor unmasking path routes through a governed "high-privilege audit access path" not yet implemented     | D-Privileged-Path — privileged reveal API + audit-of-access log (US 26.9 Audit-of-Audit is backlog) |

---

## AC Scope Filter

| AC    | Description                                                                                          | Classification | Rationale                                                                                                    |
| ----- | ---------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| AC-01 | Entity creation: newValue captures created payload; oldValue = null                                  | `happy-path`   | Core capture semantics; observable via audit-record read after a create emit                                 |
| AC-02 | Entity update: oldValue captures pre-change subset, newValue post-change                             | `happy-path`   | Core capture semantics; observable via audit-record read after an update emit                                |
| AC-03 | Status transition: oldValue = prior status, newValue = new status with supplementary context         | `happy-path`   | Core semantic for lifecycle transitions; observable via audit-record read                                    |
| AC-04 | changedFieldsSummary is human-readable list of changed fields                                        | `happy-path`   | Readable diff string; observable via investigation surface                                                   |
| AC-05 | deltaType enumerated: Field / Status / Link / Version / Permission Change                            | `edge-case`    | Schema classification detail — Marko Mrdja 2026-06-18 proposes dropping; not primary user-blocking behaviour |
| AC-06 | Large-value fields (payment schedules / document binaries) stored by reference (entity ID + version) | `main-error`   | Guardrail for oversize payloads — observable by uploading a document then reading audit record               |
| AC-07 | Sensitive fields masked/tokenized at write time before persistence                                   | `happy-path`   | Standard-view read never exposes unmasked sensitive value — pure UI/API assertion                            |
| AC-08 | Full sensitive value only via governed high-privilege audit access path (privileged Auditor)         | `Blocked`      | Privileged reveal path not yet implemented — D-Privileged-Path                                               |
| AC-09 | Standard audit view responses return masked sensitive fields (AC-AT-S2)                              | `happy-path`   | Merged with AC-07 into a masked-view Scenario Outline across roles                                           |
| AC-10 | Large-payload capture failure → record with integrityProtectedFlag = true + snapshot reference       | `Blocked`      | Requires fault-injection seam — D-Audit-API                                                                  |
| AC-11 | Snapshot unavailable → compliance gap raised for investigation                                       | `Blocked`      | Requires snapshot service failure seam — D-Snapshot-Ref                                                      |
| AC-12 | Sensitive field present but unclassified → default to masked + flag classification gap               | `main-error`   | Default-to-safe rule — observable by emitting a record with a novel field name                               |
| AC-13 | Diff computation + masking must not exceed platform-configured max write latency                     | `edge-case`    | Performance NFR with no numeric threshold in ticket — not testable as hard bound                             |
| AC-14 | Investigation surface field-diff view is READ-ONLY, masked by default                                | `happy-path`   | UI read-only + default-masked assertion                                                                      |
| AC-15 | Permission matrix — FO/BO/Support see scoped masked view; LC User no access; Auditor unmasked        | `happy-path`   | RBAC gating across five roles — Scenario Outline; unmasked-Auditor branch merged with AC-08 blocked          |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-06, AC-07, AC-09, AC-12, AC-14, AC-15
**Blocked (no Gherkin):** AC-08, AC-10, AC-11
**No Gherkin (edge-case or separate-feature):** AC-05, AC-13

---

## Scenarios summary

**Order: happy-path rows first, main-error rows second.** Never interleave.

| Tag           | Scenario                                                                                | AC                  | Priority | E2E                  |
| ------------- | --------------------------------------------------------------------------------------- | ------------------- | -------- | -------------------- |
| `@happy-path` | Entity create emits audit record with newValue populated and oldValue null              | AC-01               | P0       | ⚙️ needs D-Audit-API |
| `@happy-path` | Entity update emits audit record with oldValue + newValue + changedFieldsSummary        | AC-02, AC-04        | P0       | ⚙️ needs D-Audit-API |
| `@happy-path` | Status transition emits audit record with prior + new status                            | AC-03               | P0       | ⚙️ needs D-Audit-API |
| `@happy-path` | Standard audit view returns masked sensitive fields to authorized roles (Outline)       | AC-07, AC-09, AC-15 | P0       | ⚙️ needs D-Audit-API |
| `@happy-path` | Investigation field-diff view is read-only and masked by default                        | AC-14               | P0       | ✅                   |
| `@main-error` | LC User has no access to audit records — cross-role 404                                 | AC-15               | P0       | ✅                   |
| `@main-error` | Large-value field (document binary) stored as entity-ID + version reference, not inline | AC-06               | P0       | ⚙️ needs D-Audit-API |
| `@main-error` | Unclassified sensitive field defaults to masked + flags classification gap              | AC-12               | P0       | ⚙️ needs D-Audit-API |

Active scenario blocks: 8 (2 Outlines + 6 Scenarios)
E2E automation candidates: 2 of 8 scenarios ✅

---

## Feature file

```gherkin
@audit-trail @us-26.5 @p0
Feature: Old / New Value Capture & Sensitive-Field Masking (US 26.5 — PRD1042-782)
  As an Auditor
  I want pre- and post-change values captured for every relevant state change with sensitive fields masked
  So that any entity state is reconstructable without the operational database while protecting sensitive data

  Background:
    Given the audit-record read API is accessible at "/api/v1/audit/records"
    And I am authenticated with a role that has audit-read permission unless the scenario states otherwise
    And the tenant scope is bound to the seeded Bank Tenant A

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # A create action on any auditable entity must produce a single audit record where
  # newValue holds the created payload (or its governed subset) and oldValue is null.
  # Design gap: no Figma evidence for oldValue-null presentation — assertion is on API payload.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0
  Scenario: Entity create emits audit record with populated newValue and null oldValue (AC-01)
    Given no audit record exists for the entity to be created
    When a Front Office user creates a Refinancing Request with a valid payload
    Then a single audit record is emitted for that entity
    And the audit record's "oldValue" field is null
    And the audit record's "newValue" field contains the created payload or its governed subset
    And the audit record's "actionType" indicates a create action

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02, AC-04
  # An update to an auditable entity must produce an audit record where oldValue is the
  # pre-change subset, newValue is the post-change subset, and changedFieldsSummary is a
  # human-readable list of changed fields for the investigation display.
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @ac-04 @p0
  Scenario: Entity update emits audit record with oldValue, newValue, and changedFieldsSummary (AC-02, AC-04)
    Given a Refinancing Request "RR-100" exists with description "initial" and priority "low"
    When a Front Office user updates "RR-100" to set description "revised" and priority "high"
    Then an audit record is emitted for "RR-100"
    And the audit record's "oldValue" contains { description: "initial", priority: "low" } or the full pre-change serialization
    And the audit record's "newValue" contains { description: "revised", priority: "high" } or the full post-change serialization
    And the audit record's "changedFieldsSummary" lists "description" and "priority"
    And "changedFieldsSummary" is presentable to a human reader without further transformation

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03
  # A status transition must produce an audit record where oldValue holds the prior status
  # and newValue holds the new status together with supplementary context (e.g. transition
  # trigger, timestamp, or approval reference where applicable).
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @p0
  Scenario: Status transition emits audit record with prior and new status plus context (AC-03)
    Given a Financing "FIN-200" is in status "Pending Approval"
    When a Back Office user transitions "FIN-200" to status "Approved"
    Then an audit record is emitted for "FIN-200"
    And the audit record's "oldValue" contains status "Pending Approval"
    And the audit record's "newValue" contains status "Approved"
    And the audit record's "newValue" includes supplementary transition context

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-07, AC-09, AC-15
  # Standard audit view responses return sensitive fields masked to any authorized viewer
  # regardless of role. The Auditor's privileged unmasking path (AC-08) is Blocked pending
  # D-Privileged-Path and is not exercised here — this Outline validates the STANDARD view.
  # Bank Admin, Front Office, Back Office, Support all see masked values in the standard view.
  # ---------------------------------------------------------------------------

  @happy-path @ac-07 @ac-09 @ac-15 @p0
  Scenario Outline: Standard audit view returns masked sensitive fields to authorized roles (AC-07, AC-09, AC-15)
    Given an audit record exists for entity "FA-300" that contains sensitive fields "internalMargin", "lockedRate", "approverIdentityDetail", and "overrideNarrative"
    When I read the audit record as <role> via the standard audit view
    Then the response returns 200
    And the fields "internalMargin", "lockedRate", "approverIdentityDetail", and "overrideNarrative" are returned as masked tokens
    And the response body never contains the original plaintext of any masked field

    Examples:
      | role         |
      | Bank Admin   |
      | Front Office |
      | Back Office  |
      | Support      |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-14
  # The investigation surface field-diff view (part of the Audit Trail investigation UI)
  # is read-only and displays sensitive fields masked by default. Purely front-end,
  # no test-harness dependency.
  # ---------------------------------------------------------------------------

  @happy-path @ac-14 @p0 @e2e-ready
  Scenario: Investigation field-diff view is read-only and masked by default (AC-14)
    Given an audit record exists for entity "RR-400" with sensitive field "internalMargin"
    When I open the investigation field-diff view for record "RR-400" as an authorized viewer
    Then the field-diff panel displays the pre-change and post-change values side-by-side
    And every sensitive field is rendered as a masked token by default
    And no field is editable in the panel
    And no save, submit, or edit control is present in the panel

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-15
  # Leasing Company Users must have no access to audit records at all — the audit view is
  # bank-side only. Cross-role attempts return 404, not 403 (per RefiNext tenant-isolation
  # convention: never leak record existence to unauthorized roles).
  # ---------------------------------------------------------------------------

  @main-error @ac-15 @p0 @e2e-ready
  Scenario: LC User has no access to the audit view — 404 returned (AC-15)
    Given an audit record exists for entity "RR-500"
    When I read the audit record as a Leasing Company User
    Then the response returns 404
    And the response body does not disclose whether the record exists

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # Large-value fields (payment schedules, document binaries) must be captured as a
  # reference (entity ID + version), never inline. Verified by emitting an audit event
  # for a document upload and asserting the audit record does NOT embed the binary.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Large-value field is stored as entity-ID + version reference, not inline (AC-06)
    Given a document with binary payload of size 5 MB is uploaded to entity "RR-600"
    When the audit record for that upload is emitted
    Then the audit record's "newValue" references the document by "entityId" and "version"
    And the audit record's "newValue" does not embed the raw binary bytes
    And the audit record's serialized size is under the platform-configured inline threshold

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-12
  # If an unclassified sensitive field appears in a payload, the system defaults it to
  # masked (safe default) and flags a classification gap for governance to resolve.
  # Verifies both the masking behaviour and the gap-flagging side-effect.
  # ---------------------------------------------------------------------------

  @main-error @ac-12 @p0
  Scenario: Unclassified sensitive field defaults to masked and raises a classification gap (AC-12)
    Given the sensitivity classification does not cover a field named "customBankMetric"
    When an audit event is emitted for entity "RR-700" containing "customBankMetric"
    Then the audit record's "newValue" returns "customBankMetric" as a masked token
    And a classification-gap flag is raised for governance to review "customBankMetric"
    And the gap flag references the entity ID "RR-700" and the field name "customBankMetric"
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
