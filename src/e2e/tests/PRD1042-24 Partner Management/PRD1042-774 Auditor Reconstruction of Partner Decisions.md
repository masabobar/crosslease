# PRD1042-774 — US 13.27 | Partner Management | Auditor Reconstruction of Partner Decisions

Generated: 2026-07-09
Story: PRD1042-774 — US 13.27 | Partner Management | Auditor Reconstruction of Partner Decisions
Epic: PRD1042-24 — Epic 13: Partner Management
DoR status: PASS (11 ACs, description present, stakeholder-reviewed, Ready for DEV Review)
ACs with Gherkin scenarios: 6 of 11 | Blocked: 0 | Excluded: 5 (edge-case — scope filter table only)
Figma design: Node 235:28523, file PQVvNvRcoFac0zdHGaLWCg — Screen "Auditor decision-timeline view (read-only)" (Stage 2 PARTIAL — linked node is the 2nd E13 scope-legend card, not a screen frame; the timeline view frame lives under a 21:xxxxx node that could not be enumerated. Scenarios driven from ACs.)

---

## AC Scope Filter

| AC    | Description                                                                                                                                                                     | Classification | Rationale                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| AC-01 | An auditor reconstructs the full chronological decision timeline (creation → confirmation → role transitions → identity changes → merges → archival) from the Audit Trail alone | `happy-path`   | Core success flow — the reconstruction Scenario Outline (authorised read-only roles)                         |
| AC-02 | Decision Timeline is composed of chronological, append-only events, each with actor evidence                                                                                    | `happy-path`   | Asserted within AC-01 (chronological order + actor evidence per event)                                       |
| AC-03 | Reconstruction is independent of live operational state — an Archived Partner's full history is reconstructable (archival does not delete events)                               | `happy-path`   | Independence-from-live-state Outline (Archived variant)                                                      |
| AC-04 | A Merged source Partner's decisions are reconstructable with a forward reference to the survivor                                                                                | `happy-path`   | Independence-from-live-state Outline (Merged-source variant); mirrors sibling US 13.13 (759)                 |
| AC-05 | Role gating: Auditor + Sys Admin (read-only) + Power User (diagnostic) allowed; FO / BO-Risk / LC denied → 403                                                                  | `main-error`   | RefiNext role-based access — allowed roles covered in AC-01 Outline; denied roles in the 403 Outline         |
| AC-06 | Read-only — the reconstruction view exposes no mutation path                                                                                                                    | `main-error`   | Read-only guarantee — the auditor cannot mutate Partner state from the reconstruction view                   |
| AC-07 | Auditor is tenant-scoped within the engagement window; an out-of-scope Partner returns 404                                                                                      | `main-error`   | RefiNext tenant isolation — out-of-scope read returns 404 (not 403), does not confirm existence              |
| AC-08 | Append-only invariant enforced (audit events are immutable)                                                                                                                     | `edge-case`    | System storage invariant, not UI-observable from the reconstruction view                                     |
| AC-09 | Auditor access session is logged (session-audited)                                                                                                                              | `edge-case`    | Internal audit-logging of the access itself; asserted indirectly, no dedicated E2E                           |
| AC-10 | Auditor validity is bounded to the engagement window (time-bound access)                                                                                                        | `edge-case`    | Timing behaviour (window expiry) — D21-adjacent (AUDITOR_VALIDITY); not a discrete functional assertion here |
| AC-11 | Reconstruction completes within the report-generation SLA                                                                                                                       | `edge-case`    | Non-functional performance target                                                                            |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07
**Blocked (no Gherkin):** none
**No Gherkin (edge-case or separate-feature):** AC-08, AC-09, AC-10, AC-11

---

## Scenarios summary

| Tag           | Scenario                                                                                            | AC                  | Priority | E2E                                               |
| ------------- | --------------------------------------------------------------------------------------------------- | ------------------- | -------- | ------------------------------------------------- |
| `@happy-path` | Authorised read-only roles reconstruct the full chronological decision timeline (Outline — 3 roles) | AC-01, AC-02, AC-05 | P0       | ⚙️ needs seeded Partner with full audit history   |
| `@happy-path` | Reconstruction is independent of live operational state (Outline — Archived, Merged-source)         | AC-03, AC-04        | P0       | ⚙️ needs seeded Archived + Merged-source Partners |
| `@main-error` | Unauthorised roles cannot reconstruct Partner decisions → 403 (Outline — FO, BO-Risk, LC)           | AC-05               | P0       | ⚙️ needs seeded Partner fixture                   |
| `@main-error` | Reconstruction view exposes no mutation path (read-only)                                            | AC-06               | P0       | ⚙️ needs seeded Partner with audit history        |
| `@main-error` | An out-of-scope Partner returns 404 for the auditor (tenant/engagement scope)                       | AC-07               | P0       | ⚙️ needs second scope + out-of-scope Partner      |

Active scenario blocks: 5 (3 Outlines + 2 Scenarios)
E2E automation candidates: 0 of 5 scenarios ✅

---

## Feature file

```gherkin
@partner-management @us-13.27 @p0
Feature: Auditor Reconstruction of Partner Decisions (US 13.27 — PRD1042-774)
  As an auditor
  I want to independently reconstruct every Partner decision from the Audit Trail
  So that regulatory evidence does not depend on live operational state

  Background:
    Given a Partner "P-300" has a full governance history in the Audit Trail
    And that history includes creation, confirmation, a role transition, an identity change, a merge, and archival events

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-02, AC-05 (allowed roles)
  # The authorised read-only roles (Auditor, Sys Admin read-only, Power User
  # diagnostic) reconstruct the full decision timeline from the Audit Trail
  # alone. Events appear in chronological order, each carrying actor evidence.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-02 @ac-05 @p0
  Scenario Outline: Authorised read-only roles reconstruct the full chronological decision timeline (AC-01, AC-02, AC-05)
    Given I am logged in as <role>
    When I open the decision-timeline reconstruction for Partner "P-300"
    Then I should see the decision events in chronological order
    And the timeline should include "creation", "confirmation", "role transition", "identity change", "merge", and "archival"
    And each event should show its actor evidence

    Examples:
      | role                    |
      | Auditor                 |
      | System Administrator    |
      | Power User              |

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-03, AC-04
  # Reconstruction is independent of live operational state: an Archived Partner
  # still yields its full history (archival does not delete events), and a Merged
  # source Partner is reconstructable with a forward reference to the survivor.
  # ---------------------------------------------------------------------------

  @happy-path @ac-03 @ac-04 @p0
  Scenario Outline: Reconstruction is independent of live operational state (AC-03, AC-04)
    Given Partner "<partner>" is in state "<state>"
    When I open the decision-timeline reconstruction for Partner "<partner>" as an Auditor
    Then the full decision history should be reconstructable
    And "<extra_assertion>"

    Examples:
      | partner | state         | extra_assertion                                              |
      | P-301   | Archived      | archival should not have removed any historical event        |
      | P-302   | Merged-source | a forward reference to the survivor Partner should be shown   |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05 (RefiNext role-based access, auto-applied)
  # The roles excluded by the permission matrix (FO, BO/Risk, LC) cannot access
  # the reconstruction — the request is rejected with 403.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0
  Scenario Outline: Unauthorised roles cannot reconstruct Partner decisions (AC-05)
    Given I am logged in as <role>
    When I GET "/api/partners/P-300/decision-timeline"
    Then the response status should be 403

    Examples:
      | role         |
      | front_office |
      | back_office  |
      | leasing_company_user |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06 (read-only guarantee)
  # The reconstruction view is strictly read-only — it offers no mutation path,
  # and a mutation attempt against the reconstruction surface is rejected.
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0
  Scenario: Reconstruction view exposes no mutation path (AC-06)
    Given I am viewing the decision-timeline reconstruction for Partner "P-300" as an Auditor
    Then no mutation control should be present on the reconstruction view
    And any attempt to mutate Partner "P-300" from this surface should be rejected

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-07 (RefiNext tenant isolation, auto-applied)
  # The auditor is tenant-scoped within the engagement window. A reconstruction
  # request for a Partner outside that scope returns 404 — not 403 — so the
  # platform does not confirm the existence of out-of-scope Partners.
  # ---------------------------------------------------------------------------

  @main-error @ac-07 @p0
  Scenario: An out-of-scope Partner returns 404 for the auditor (AC-07)
    Given I am logged in as an Auditor scoped to my engagement
    And a Partner "P-OTHER" exists outside my engagement scope
    When I GET "/api/partners/P-OTHER/decision-timeline"
    Then the response status should be 404
    And the response should not reveal that the Partner exists
```
