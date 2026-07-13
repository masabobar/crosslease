# PRD1042-795 — US 26.18 | Audit Trail | Security Event Audit Coverage

Generated: 2026-07-10
Story: PRD1042-795 — US 26.18 | Audit Trail | Security Event Audit Coverage
Epic: PRD1042-37 — Epic 26: Audit Trail
DoR status: PASS (10 derived ACs, description present, spec v1.2 approved by Philipp Maute 2026-05-29, story Client-Approved 2026-06-16 per Philipp comment 37245, current Jira status Ready for DEV Review)
ACs with Gherkin scenarios: 6 of 10 | Blocked: 2 (D-AuditQuery, D-CrossTenantForge) | Excluded: 2 (edge-case or separate-feature — scope filter table only)
Figma design: Node 1:11090, file 7EkiVhANXOkn65k0jG4uEJ — Canvas "E26 -- Audit Trail" (Stage 2 FAILED — Figma Professional plan quota exhausted, WebFetch cannot pass X-Figma-Token; backend security-event story so design absence is expected shape — audit event emission is server-side per Epic 26 §2 "enforced at database level, not merely as UI-visible history")

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                                                                                                       | Blocking dependency                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| AC-08 | Fail-closed NFR — governed action must not commit if audit event emission fails; requires transaction-level fault injection harness with no E2E surface      | D-AuditFaultInject — audit-emission fault-injection endpoint |
| AC-09 | Sensitive-field masking in standard view vs full via privileged Auditor path — requires deterministic seeded PII record + dual-view read API not yet exposed | D-AuditQuery — Auditor-scoped audit-view API (US 26.10)      |

---

## AC Scope Filter

| AC    | Description                                                                                                    | Classification     | Rationale                                                                                                                                  |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-01 | ROLE_ASSIGNED/REVOKED emits Regulatory Critical event with authorizing actor identity (AC-AT-C4)               | `happy-path`       | Directly verifiable via UMA role change → audit query API; asserts actor_type=manual_user + authorizing principal_id                       |
| AC-02 | KYC_DETAIL_ACCESS by Auditor produces BOTH business-event record AND Audit Log Access Record (AC-AT-C5)        | `happy-path`       | Dual-write assertion; core Compliance/BAIT AT 9 requirement (privileged read inspection is itself audit-relevant)                          |
| AC-03 | Every failed cross-tenant access attempt emits security audit event in the REQUESTING user's tenant (AC-AT-C6) | `main-error`       | Core RefiNext tenant-isolation domain rule — 404 not 403; event lands in requesting tenant not target tenant                               |
| AC-04 | FORBIDDEN_TRANSITION captured at API layer; override decisions capture justification references                | `main-error`       | Invalid lifecycle transition attempt is a security-audit event; API-layer capture requirement                                              |
| AC-05 | EXPORT_EXECUTED captures what/by whom/destination; export permission cannot be self-granted (AC-AT-S3)         | `main-error`       | Self-grant rejection is the security event's own trigger; asserts governance guard on privilege escalation                                 |
| AC-06 | MISATTRIBUTION_REJECTED persists permanently as evidence (US 26.04)                                            | `main-error`       | Governance-critical — misattribution attempt cannot be purged; INSERT-only DB permission enforcement                                       |
| AC-07 | Security audit event view is RBAC-scoped: System/Power User + Auditor = ✓; Support = limited; FO/BO/LC = ✗     | `main-error`       | Standard RefiNext RBAC 404-not-403 pattern; scoped view of security events                                                                 |
| AC-08 | Security event emission is server-side enforced; capture is part of governed action; NO fail-open window       | `Blocked`          | Requires transaction-level fault-injection harness (D-AuditFaultInject); NFR anchored in Epic 26 §Non-Functional Requirements              |
| AC-09 | Sensitive identity fields masked in standard view; full access via privileged Auditor path only                | `Blocked`          | Requires D-AuditQuery (Auditor-scoped audit-view API from US 26.10) exposing standard vs privileged view distinction — not yet implemented |
| AC-10 | Session-access log for Auditor read of security events itself audited (BAIT AT 9)                              | `separate-feature` | Owned by US 26.19 (PRD1042-792) — Auditor Session Access Logging; not this story's emission scope                                          |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07
**Blocked (no Gherkin):** AC-08, AC-09
**No Gherkin (edge-case or separate-feature):** AC-10

---

## Scenarios summary

**Order: happy-path rows first, main-error rows second.** Never interleave.

| Tag           | Scenario                                                                                       | AC    | Priority | E2E                         |
| ------------- | ---------------------------------------------------------------------------------------------- | ----- | -------- | --------------------------- |
| `@happy-path` | ROLE_ASSIGNED/REVOKED emits Regulatory Critical event with authorizing actor (Outline, 2 rows) | AC-01 | P0       | ⚙️ needs D-AuditQuery       |
| `@happy-path` | KYC_DETAIL_ACCESS by Auditor produces business event AND access log record (dual write)        | AC-02 | P0       | ⚙️ needs D-AuditQuery       |
| `@main-error` | Cross-tenant access blocked → security event lands in REQUESTING tenant, 404 not 403           | AC-03 | P0       | ⚙️ needs D20 + D-AuditQuery |
| `@main-error` | FORBIDDEN_TRANSITION attempt captured at API layer with override justification reference       | AC-04 | P0       | ⚙️ needs D-AuditQuery       |
| `@main-error` | Self-grant of export permission rejected; attempt captured as EXPORT/security event            | AC-05 | P0       | ⚙️ needs D-AuditQuery       |
| `@main-error` | MISATTRIBUTION_REJECTED persists permanently (INSERT-only, no purge)                           | AC-06 | P0       | ⚙️ needs D-AuditQuery       |
| `@main-error` | Security audit event view RBAC-scoped: unauthorized roles get 404 (Outline, 5 role rows)       | AC-07 | P0       | ⚙️ needs D-AuditQuery       |

Active scenario blocks: 7 (2 Outlines + 5 Scenarios)
E2E automation candidates: 0 of 7 scenarios ✅ — all seven depend on D-AuditQuery (Auditor-scoped audit-view API from US 26.10) and one additionally requires D20 (second seeded Bank Tenant B); marking scenarios `@pending` until dependencies land

---

## Feature file

```gherkin
@audit-trail @us-26.18 @p0 @security-event @backend
Feature: Security Event Audit Coverage (US 26.18 — PRD1042-795)
  As a Security / Compliance Officer
  I want role changes, access violations, forbidden transitions, KYC access, exports and misattribution
    attempts captured as Regulatory Critical events
  So that security and governance posture is fully reconstructable

  Background:
    Given the AuditReceptionService is running and consuming security.*, role.*, kyc.access.*, export.* channels
    And the SecurityEventValidator enforces closed actor_type enumeration
      (manual_user, system_dd_counter, system_propagation, system_scheduler,
       integration_callback, system_lifecycle, migration)
    And audit tables are INSERT-only at DB permission level
      (application service account has INSERT + SELECT permissions only — no UPDATE/DELETE)
    And every security event captured under this story has classification "Regulatory Critical" per Epic 26 §6.7

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01
  # UMA role change (assignment or revocation) MUST emit a Regulatory Critical
  # security event with the authorizing actor's identity captured. The event
  # includes principal_id of the change requester AND the authorizing actor
  # (Four-Eyes second actor where applicable). AC anchored at AC-AT-C4.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @p0 @pending
  Scenario Outline: <event_type> emits Regulatory Critical event with authorizing actor identity (AC-01)
    Given a System Admin authenticated in Bank Tenant "TENANT-A"
    And a target user "USR-TEST-01" exists in "TENANT-A"
    When the System Admin performs "<event_type>" on "USR-TEST-01"
    Then a security audit event of type "<event_type>" is emitted
    And the event carries classification "Regulatory Critical"
    And the event carries actor_type "manual_user"
    And the event carries principal_id of the acting System Admin
    And the event carries authorizing_actor_id equal to the second-approver principal_id
    And the event carries an immutable UTC timestamp
    And querying the audit log for the event_type returns exactly one matching record

    Examples:
      | event_type     |
      | ROLE_ASSIGNED  |
      | ROLE_REVOKED   |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02
  # KYC detail access by an Auditor role produces TWO audit records: the
  # business-event record (KYC_DETAIL_ACCESS) AND a separate Audit Log Access
  # Record (BAIT AT 9 — privileged read inspection is itself audit-relevant).
  # Both writes are Regulatory Critical. AC anchored at AC-AT-C5.
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @p0 @pending
  Scenario: KYC_DETAIL_ACCESS by Auditor produces business-event record AND access log record (AC-02)
    Given an Auditor authenticated in Bank Tenant "TENANT-A"
    And a Partner "PTR-KYC-01" with KYC detail record exists in "TENANT-A"
    When the Auditor reads KYC detail for "PTR-KYC-01"
    Then a security audit event of type "KYC_DETAIL_ACCESS" is emitted
    And the KYC_DETAIL_ACCESS event carries classification "Regulatory Critical"
    And the KYC_DETAIL_ACCESS event carries actor_type "manual_user" with the Auditor's principal_id
    And a separate Audit Log Access Record is also written
    And the Audit Log Access Record captures the principal_id, session_start, queried_entity_type="Partner",
        queried_entity_id="PTR-KYC-01", filter_parameters, and result_row_count
    And both records are stored in INSERT-only tables

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Cross-tenant access is blocked at the API layer (US 26.12). The security
  # event is emitted in the REQUESTING user's tenant (not the target tenant)
  # so that the acting party's tenant retains full evidence of the attempt.
  # Response is 404 not 403 (RefiNext tenant-isolation domain rule — prevents
  # enumeration). AC anchored at AC-AT-C6.
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0 @pending
  Scenario: Cross-tenant access blocked, security event lands in REQUESTING tenant with 404 (AC-03)
    Given a Front Office user authenticated in Bank Tenant "TENANT-A"
    And a Contract "CTR-B-01" exists in Bank Tenant "TENANT-B" with no cross-tenant allow-list entry
    When the Front Office user requests GET "/api/contracts/CTR-B-01"
    Then the HTTP response status is 404
    And no Contract data is returned in the response body
    And a security audit event of type "CROSS_TENANT_BLOCKED" is emitted in "TENANT-A"
    And the event carries classification "Regulatory Critical"
    And the event carries actor_type "manual_user" with the Front Office user's principal_id
    And the event carries requesting_tenant_id "TENANT-A"
    And the event carries target_tenant_id "TENANT-B"
    And querying the audit log in "TENANT-B" returns zero CROSS_TENANT_BLOCKED events for this attempt

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # Invalid lifecycle transition attempts are captured at the API layer as
  # FORBIDDEN_TRANSITION security events. When an override was involved, the
  # event captures the justification reference (governance-critical audit).
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0 @pending
  Scenario: FORBIDDEN_TRANSITION captured at API layer with override justification reference (AC-04)
    Given a Back Office user authenticated in Bank Tenant "TENANT-A"
    And a Financing "FIN-01" is in status "Draft"
    And the Financing state machine does NOT permit direct transition from "Draft" to "Active"
    When the Back Office user requests POST "/api/financings/FIN-01/transition"
      with body { "target_status": "Active", "override_justification_ref": "OVR-2026-07-10-001" }
    Then the HTTP response status is 422
    And the response error code is "FORBIDDEN_TRANSITION"
    And a security audit event of type "FORBIDDEN_TRANSITION" is emitted
    And the event carries classification "Regulatory Critical"
    And the event carries entity_type "Financing" and entity_id "FIN-01"
    And the event carries attempted_from_status "Draft" and attempted_to_status "Active"
    And the event carries override_justification_ref "OVR-2026-07-10-001"
    And the Financing status remains "Draft"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # Export permission cannot be self-granted (AC-AT-S3). The attempt is
  # rejected AND the rejection itself emits a security event. The event
  # captures actor, target permission, and attempted-scope so that the
  # privilege-escalation attempt is queryable.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0 @pending
  Scenario: Self-grant of export permission rejected and captured as security event (AC-05)
    Given a Bank Admin authenticated in Bank Tenant "TENANT-A"
    And the Bank Admin does NOT currently hold the "export.execute" permission
    When the Bank Admin requests POST "/api/permissions/grant"
      with body { "target_user_id": "<self>", "permission": "export.execute" }
    Then the HTTP response status is 403
    And the response error code is "SELF_GRANT_EXPORT_FORBIDDEN"
    And a security audit event of type "EXPORT_PERMISSION_SELF_GRANT_ATTEMPT" is emitted
    And the event carries classification "Regulatory Critical"
    And the event carries actor_type "manual_user" with the Bank Admin's principal_id
    And the event carries attempted_permission "export.execute"
    And the event carries attempted_target_user_id equal to the Bank Admin's principal_id
    And the Bank Admin does NOT hold "export.execute" after the attempt

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # Misattribution attempts (spoofing actor identity, tampering with actor_type)
  # persist PERMANENTLY as evidence per US 26.04. INSERT-only DB permission
  # ensures these records cannot be purged even by System Admin.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @pending
  Scenario: MISATTRIBUTION_REJECTED persists permanently and cannot be purged (AC-06)
    Given an integration client authenticated in Bank Tenant "TENANT-A"
    And the client attempts to emit an audit event with actor_type "manual_user"
      while its authenticated context is actor_type "integration_callback"
    When the SecurityEventValidator processes the emission
    Then the misattributed emission is rejected
    And a security audit event of type "MISATTRIBUTION_REJECTED" is emitted
    And the event carries classification "Regulatory Critical"
    And the event carries claimed_actor_type "manual_user"
    And the event carries actual_actor_type "integration_callback"
    And the event carries the integration client's principal_id
    When a System Admin subsequently attempts DELETE on the MISATTRIBUTION_REJECTED record
    Then the database-layer permission denies the DELETE
    And the record remains queryable in the audit log

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07
  # Security audit event visibility is RBAC-scoped per the Permission Matrix:
  #   System Admin / Power User  → full view
  #   Auditor                    → full view
  #   Support                    → limited view (own tenant, non-sensitive fields)
  #   Front Office / Back Office / LC User → NO view (404-not-403 uniform)
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0 @pending
  Scenario Outline: Unauthorized roles cannot view security audit events (AC-07)
    Given a <role> user authenticated in Bank Tenant "TENANT-A"
    And at least one security audit event of type "ROLE_ASSIGNED" exists in "TENANT-A"
    When the <role> user requests GET "/api/audit/security-events?event_type=ROLE_ASSIGNED"
    Then the HTTP response status is 404
    And the response body does NOT enumerate any security-event records
    And the response body does NOT reveal that the endpoint exists

    Examples:
      | role                 |
      | Front Office         |
      | Back Office          |
      | Leasing Company User |
      | Bank Admin           |
      | Support (limited)    |
```
