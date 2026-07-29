# PRD1042-807 — US 11.8 | Framework Agreement | Framework Document Attachment

Generated: 2026-07-24
Story: PRD1042-807 — US 11.8 | Framework Agreement | Framework Document Attachment
Epic: PRD1042-22 — Epic 11: Framework Agreement
DoR status: PASS (15 derived ACs + 2 CR-derived ACs, description present with permission matrix + upload modal spec, stakeholder-reviewed, Dev in progress)
ACs with Gherkin scenarios: 12 of 17 | Blocked: 2 (D-VirusScan-Force, D-DocMgmt-Down) | Excluded: 3 (edge-case or separate-feature — scope filter table only; AC-CR-B3 bundled)
Figma design: Node 33:8324 (ATTACH DOCUMENT) on canvas 10:15285, file aQGn5OLEjEGJO7xGzFikP5 — frame render available in fixtures (see "Design references" below). REST + MCP were quota-exhausted on 2026-07-24; frame was manually PNG-exported from Figma. Upload-modal copy anchors previously captured via `/nodes` fallback remain the source for AC-02 field labels. Modal in the exported PNG shows `Document type` as required — the exported frame is pre-CR; treat the required-marker as `pre-CR design — refresh needed` per CR PRD1042-1495 A6.
Updated per CR PRD1042-1495 (2026-07-24): Document Type is now OPTIONAL — "Uncategorized" is the default and acceptable value (A6/1495). All FA documents are optional in the first place until the client confirms a required set; the mandatory-documents list is configurable per tenant, not hard-coded (B3/1495). Design PNG shows the pre-CR required state.
Updated per CR PRD1042-22 Reconciliation v10 (2026-07-27): CR v10 B6 replaces hard-coded `FANoDocumentsError` with a configurable required-document set that DEFAULTS to non-blocking. Per §6 US 11.8: "Activation succeeds with no attached document while the configurable required set is empty. Activation is refused once a required document type is switched on. Document type is optional; uncategorised documents are accepted." Existing AC-CR-A6 (from 1495) covers document-type-optional. AC-CR-B3 (bundled edge-case) is now formally recognised as v10 B6 tenant-configurable behaviour. AC-08 5-role Outline marked [CR-PENDING B5].

---

## Design references

| File                                                                           | Content                                                                                                                                                                                                                                                                                                   | Applies to                                             |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `src/e2e/fixtures/figma-e11/rendered-nodes/frame-33-8324__ATTACH-DOCUMENT.png` | 4 states: (1) `Templates and documents` tab with existing `Framework documents` table, (2) `Attach framework document` modal open with drop zone + staged rows (`Document type` + `Document label (optional)`), (3) upload confirmation, (4) completed state with newly attached row visible in the table | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-09 |

Use this frame to verify: upload-modal field labels + Document Type enum dropdown values (AC-02), submit-button copy, size / type / count rejection messages (AC-03, AC-04, AC-05), the immutable-detach 409 message copy on Active/Suspended FAs (AC-06), and the completed-attachment row layout (AC-07 bundled fields). Virus-scan progress copy and 503 storage-failure banner remain design-blind — see Blocked ACs.

---

## Blocked ACs (no scenarios generated)

| AC    | Reason                                                                               | Blocking dependency                                  |
| ----- | ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| AC-12 | Requires ability to force virus scanner to fail on a specific upload — no forge/stub | D-VirusScan-Force — VirusScan negative outcome forge |
| AC-14 | Requires Document Management to be forced into unavailable/503 state during upload   | D-DocMgmt-Down — Document Mgmt storage-failure forge |

---

## AC Scope Filter

| AC       | Description                                                                                                                                                                                           | Classification     | Rationale                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01    | Power User (Bank Admin) attaches one or more signed FA PDFs via upload modal                                                                                                                          | `happy-path`       | Core success flow — Power User (Bank Admin) uploads a valid PDF                                                                                                                                                                                                                                                                                                                                                         |
| AC-02    | Upload modal collects File, Document Type (enum), optional Document Label ≤200 chars                                                                                                                  | `happy-path`       | Form field render + Document Type dropdown values assertion                                                                                                                                                                                                                                                                                                                                                             |
| AC-03    | Non-PDF MIME type rejected server-side                                                                                                                                                                | `main-error`       | Client validation + server enforcement                                                                                                                                                                                                                                                                                                                                                                                  |
| AC-04    | Files > 25 MB rejected                                                                                                                                                                                | `main-error`       | Size validation                                                                                                                                                                                                                                                                                                                                                                                                         |
| AC-05    | Upload beyond 10 documents per FA rejected                                                                                                                                                            | `main-error`       | Business rule ceiling                                                                                                                                                                                                                                                                                                                                                                                                   |
| AC-06    | Detach permitted only in Draft; Active/Suspended returns 409 "Documents on activated agreements are immutable."                                                                                       | `main-error`       | Lifecycle-state gate for detach                                                                                                                                                                                                                                                                                                                                                                                         |
| AC-07    | Attachment record persists file name, size, upload timestamp, uploaded-by actor, file hash                                                                                                            | `happy-path`       | Bundled into AC-01 happy path (assertions on document list row after upload)                                                                                                                                                                                                                                                                                                                                            |
| AC-08    | Only Power User (Bank Admin) can attach or detach; other roles hidden + 404 on direct API                                                                                                             | `main-error`       | Role-based access domain rule — hidden button + 404 API                                                                                                                                                                                                                                                                                                                                                                 |
| AC-09    | Document download available per role matrix                                                                                                                                                           | `happy-path`       | Download Outline across permitted roles                                                                                                                                                                                                                                                                                                                                                                                 |
| AC-10    | LC user cross-LC document access returns HTTP 404 (tenant isolation)                                                                                                                                  | `main-error`       | Tenant isolation domain rule — 404-not-403 pattern                                                                                                                                                                                                                                                                                                                                                                      |
| AC-11    | MFA-validated session required for upload; expired MFA blocks upload                                                                                                                                  | `main-error`       | Security requirement — session freshness gate                                                                                                                                                                                                                                                                                                                                                                           |
| AC-12    | Virus scan failure quarantines + rejects + audit fa.document.scan.failed                                                                                                                              | `Blocked`          | D-VirusScan-Force — no way to force virus-scan negative outcome in E2E                                                                                                                                                                                                                                                                                                                                                  |
| AC-13    | fa.document.attached / detached / FA_DOCUMENT_DOWNLOADED audit events emit with correct payload                                                                                                       | `separate-feature` | Audit event schema + payload validation belongs to Epic 26 (US 26.x) — FE upload/detach/download flows are covered here, audit-event assertions belong to audit-integration suite                                                                                                                                                                                                                                       |
| AC-14    | Document Management storage failure → HTTP 503; attachment record NOT created; client retry OK                                                                                                        | `Blocked`          | D-DocMgmt-Down — no way to force Document Management into 503 during E2E run                                                                                                                                                                                                                                                                                                                                            |
| AC-15    | Signed download URLs tenant-scoped, 5-minute TTL                                                                                                                                                      | `edge-case`        | Implementation detail — TTL enforcement is server-side, exposed only if user waits >5min; not a functional test                                                                                                                                                                                                                                                                                                         |
| AC-CR-A6 | [CR A6] Document Type is OPTIONAL; "Uncategorized" is default. Server accepts null / "uncategorized"                                                                                                  | `happy-path`       | New happy-path scenario — staged row submits without Document type selection and is accepted                                                                                                                                                                                                                                                                                                                            |
| AC-CR-B3 | [CR 1495 B3 + v10 B6] All FA documents optional in the first place; mandatory list configurable per tenant, not hard-coded; default is non-blocking (v10 B6 replaces hard-coded `FANoDocumentsError`) | `edge-case`        | Bundled into AC-01 activation-time invariant — activation does not require a specific document type when the tenant-configured required set is empty (v10 default). Activation is refused once a required document type is switched on (tenant-config toggle). Configuration-level (tenant flag) belongs to US 11.02 activation + tenant admin config screen — not E2E-observable within this document-attachment story |

**Gherkin generated for:** AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-CR-A6
**Blocked (no Gherkin):** AC-12, AC-14
**No Gherkin (edge-case or separate-feature):** AC-13, AC-15, AC-CR-B3 (bundled)

---

## Scenarios summary

| Tag           | Scenario                                                                                                  | AC           | Priority | E2E                   |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------ | -------- | --------------------- |
| `@happy-path` | Power User (Bank Admin) stages a valid PDF and submits; row appears in Framework documents (AC-01, AC-07) | AC-01, AC-07 | P0       | ✅                    |
| `@happy-path` | Attach framework document modal renders drop zone, Document type, Document label (multi-file staging)     | AC-02        | P0       | ✅                    |
| `@happy-path` | Uncategorized document upload (no Document type selected) is accepted per CR A6                           | AC-CR-A6     | P0       | ✅                    |
| `@happy-path` | Authorized role downloads attached document (Outline — 4 roles)                                           | AC-09        | P0       | ✅                    |
| `@main-error` | Non-PDF upload is rejected                                                                                | AC-03        | P0       | ✅                    |
| `@main-error` | Oversize (>25 MB) upload is rejected                                                                      | AC-04        | P0       | ✅                    |
| `@main-error` | 11th document upload on same FA is rejected                                                               | AC-05        | P0       | ✅                    |
| `@main-error` | Detach on Active FA returns 409 with immutable message                                                    | AC-06        | P0       | ✅                    |
| `@main-error` | Non-permitted role cannot attach — button hidden, direct API returns 404 (Outline — 5 roles)              | AC-08        | P0       | ✅                    |
| `@main-error` | Support user cannot download attached document                                                            | AC-09        | P0       | ✅                    |
| `@main-error` | LC user cross-LC document download returns 404                                                            | AC-10        | P0       | ⚙️ needs D20          |
| `@main-error` | Upload without valid MFA session is blocked                                                               | AC-11        | P0       | ⚙️ needs D-MFA-StepUp |

Active scenario blocks: 12 (2 Outlines + 10 Scenarios)
E2E automation candidates: 10 of 12 scenarios ✅

---

## Design specification (source of truth)

Framework Document Attachment as built in Figma frame `33:8324`. Scenarios below anchor to this specification. Where the AC Scope Filter table (below) shows AC text from Jira that does not match this design, the design takes precedence for test assertions.

**Entry point:** the `Framework documents` section on the `Templates and documents` tab of the FA Detail page (there is no standalone "Documents" tab). The section header carries an `Attach documents` button (plural) top-right.

**Modal — `Attach framework document`:**

| Element                       | Verbatim copy                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------- |
| Title                         | `Attach framework document`                                                       |
| Subtitle                      | `Upload signed framework agreement documents. PDF only, up to 25 MB per file.`    |
| Empty drop zone               | `Drag and drop your PDF file here or click to browse`                             |
| Drop-zone helper              | `PDF only. Max 25 MB per file. Up to 10 documents.`                               |
| Staging counter (bottom-left) | `X / 10 documents`                                                                |
| Per-staged-row fields         | File icon + filename, `Document type` dropdown, `Document label (optional)` input |
| Footer buttons                | `Cancel` (left), `Attach documents` (primary, right)                              |

**Interaction model:** multi-file staging. Users drag multiple PDFs into the drop zone; each becomes a staged row with its own `Document type` (**optional per CR A6** — defaults to "Uncategorized" if not selected) and `Document label` (optional). The `Attach documents` footer button submits the entire batch in one transaction. Per CR A6, the primary button is enabled once at least one file is staged (independent of whether Document type has been selected).

**Document type dropdown values (verbatim from staged rows):** `Original agreement`, `Addendum`, `Side letter`. Per CR A6, an implicit `Uncategorized` value is applied server-side when no selection is made (the exported PNG shows only the explicit three values — the Uncategorized default is a server-side behavior, not a visible dropdown entry). Case-sensitive (lowercase `t`/`l`).

**Success feedback:** green toast at the top-right of the viewport reading `Documents attached successfully`. The modal closes and the new documents appear in the `Framework documents` table with columns `File name / Type / Label / File size / Uploaded at / Uploaded by`, plus a download icon per row.

**10-document ceiling** (AC-05): enforced by the staging counter (footer button disables at 10) and by server rejection on submit.

---

## Feature file

```gherkin
@framework-agreement @us-11.8 @p0
Feature: Framework Document Attachment (US 11.8 — PRD1042-807)
  As a Power User (Bank Admin)
  I want to attach signed framework agreement documents to a Framework Agreement
  So that the legal contract evidence is bound to the operational configuration object

  Background:
    Given the RefiNext platform is up and healthy
    And a Framework Agreement "FA-Draft-001" exists in Draft state bound to Leasing Company "New Group Trade"
    And a Framework Agreement "FA-Active-001" (agreement name "RV-SSKM-2026-001") exists in Active state bound to Leasing Company "New Group Trade"
    And "FA-Active-001" has one attached document "Framework agreement_signed.pdf" (2.4 MB, "Original agreement", label "Master copy")

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-01, AC-07
  # Power User (Bank Admin) stages a valid PDF in the modal and submits;
  # attachment record persists file name, size, upload timestamp, uploaded-by
  # actor, and file hash. Success toast confirms.
  # ---------------------------------------------------------------------------

  @happy-path @ac-01 @ac-07 @p0 @e2e-ready
  Scenario: Power User (Bank Admin) attaches a valid PDF and metadata persists (AC-01, AC-07)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Draft-001" detail on the "Templates and documents" tab
    And the "Framework documents" section is empty
    When I click the "Attach documents" button in the "Framework documents" section header
    Then a modal titled "Attach framework document" should open with subtitle "Upload signed framework agreement documents. PDF only, up to 25 MB per file."
    When I drag file "test-agreement.pdf" (application/pdf, 3 MB) into the drop zone
    Then a staged row should appear for "test-agreement.pdf" with a "Document type" dropdown and a "Document label (optional)" input
    And the counter at the bottom-left of the modal should read "1 / 10 documents"
    When I select Document type "Original agreement" for the staged row
    And I enter Document label "Signed 2026-07-01" for the staged row
    And I click the "Attach documents" button in the modal footer
    Then the modal should close
    And a success toast "Documents attached successfully" should appear at the top-right of the viewport
    And the "Framework documents" section table should now display 1 row
    And the row should show file name "test-agreement.pdf", Type "Original agreement", Label "Signed 2026-07-01", File size "3 MB", Uploaded at (timestamp within the last minute), Uploaded by "Power User (Bank Admin)"
    And the row should carry a file hash reference (opaque identifier — not empty)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-02
  # "Attach framework document" modal collects File (drop zone), Document type
  # (dropdown per staged row), and optional Document label (input per staged row).
  # Empty state shows the drop-zone instruction and file-constraint helper text verbatim.
  # ---------------------------------------------------------------------------

  @happy-path @ac-02 @p0 @e2e-ready
  Scenario: Attach framework document modal renders drop zone, Document type, Document label (AC-02)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Draft-001" detail on the "Templates and documents" tab
    When I click the "Attach documents" button in the "Framework documents" section header
    Then a modal titled "Attach framework document" should be visible
    And a drop zone with the instruction "Drag and drop your PDF file here or click to browse" should be present
    And directly below the drop zone, helper text "PDF only. Max 25 MB per file. Up to 10 documents." should be visible
    And a counter reading "0 / 10 documents" should be visible at the bottom-left of the modal
    And the modal footer should show a "Cancel" button and a primary "Attach documents" button
    And the "Attach documents" primary button should be disabled while no files are staged
    When I stage 1 valid PDF via the drop zone
    Then a staged row should appear with a "Document type" dropdown containing at least the values "Original agreement", "Addendum", "Side letter"
    And the staged row should include a "Document label (optional)" text input with max length 200 characters
    And the "Attach documents" primary button should become enabled once at least one file is staged (Document type selection is OPTIONAL per CR PRD1042-1495 A6)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-CR-A6
  # Per CR PRD1042-1495 A6 (2026-07-20, Philipp Maute): Document type is OPTIONAL.
  # A staged row submitted without a Document type selection is accepted and
  # persisted with default value "Uncategorized" (server-side). Uncategorized
  # documents are valid — the client no longer forces a dropdown selection.
  # ---------------------------------------------------------------------------

  @happy-path @ac-cr-a6 @p0 @e2e-ready
  Scenario: Uncategorized document upload (no Document type) is accepted per CR A6 (AC-CR-A6)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Draft-001" detail on the "Templates and documents" tab
    When I click the "Attach documents" button in the "Framework documents" section header
    And I drag file "unclassified.pdf" (application/pdf, 1.5 MB) into the drop zone
    Then a staged row should appear for "unclassified.pdf"
    And the "Attach documents" primary button should be enabled (no Document type selection required per CR A6)
    When I leave the Document type dropdown untouched (no selection)
    And I click the "Attach documents" button in the modal footer
    Then the modal should close
    And a success toast "Documents attached successfully" should appear
    And the "Framework documents" section table should now include a row for "unclassified.pdf"
    And the row's Type column should display "Uncategorized" (server-side default per CR PRD1042-1495 A6)

  # ---------------------------------------------------------------------------
  # HAPPY PATH — AC-09
  # Document download works for all permitted roles per matrix.
  # (Support is intentionally excluded — covered separately in the main-error block.)
  # ---------------------------------------------------------------------------

  @happy-path @ac-09 @p0 @e2e-ready
  Scenario Outline: Authorized role downloads attached document (AC-09)
    Given I am logged in as <role> <scope>
    When I open "FA-Active-001" detail on the "Templates and documents" tab
    And I click the download icon on the row for "Framework agreement_signed.pdf" within the "Framework documents" section
    Then the download should complete successfully with HTTP 200
    And the response Content-Type should be application/pdf

    Examples:
      | role                     | scope                          |
      | Power User (Bank Admin)  |                                |
      | Front Office             |                                |
      | Back Office              |                                |
      | LC User                  | bound to "New Group Trade"     |
      | Auditor                  |                                |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-03
  # Non-PDF MIME type rejected at server (client may also block, but server enforces).
  # ---------------------------------------------------------------------------

  @main-error @ac-03 @p0 @e2e-ready
  Scenario: Non-PDF upload is rejected (AC-03)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Draft-001" detail on the "Templates and documents" tab
    When I click the "Attach documents" button in the "Framework documents" section header
    And I attempt to stage file "not-a-pdf.txt" (text/plain, 1 KB) in the drop zone
    Then the file should be rejected client-side per the "PDF only" helper text, OR
    And if the client accepts the file and I submit, the server should reject the upload with an error message referencing MIME type or PDF requirement
    And no new document row should appear in the "Framework documents" section

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-04
  # Oversize files (> 25 MB) rejected server-side; client SHOULD pre-check
  # against the "Max 25 MB per file" helper text.
  # ---------------------------------------------------------------------------

  @main-error @ac-04 @p0 @e2e-ready
  Scenario: Oversize (>25 MB) upload is rejected (AC-04)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Draft-001" detail on the "Templates and documents" tab
    When I click the "Attach documents" button in the "Framework documents" section header
    And I stage file "huge-agreement.pdf" (application/pdf, 26 MB) in the drop zone
    And I select Document type "Original agreement" for the staged row
    And I click the "Attach documents" button in the modal footer
    Then the upload should be rejected with an error message referencing the 25 MB per-file size limit
    And no new document row should appear in the "Framework documents" section

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-05
  # Maximum 10 documents per FA. Client enforces via the modal counter
  # ("X / 10 documents"); server enforces on submit.
  # ---------------------------------------------------------------------------

  @main-error @ac-05 @p0 @e2e-ready
  Scenario: 11th document upload on same FA is rejected (AC-05)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And a Framework Agreement "FA-Draft-Full" exists in Draft state with exactly 10 attached documents
    When I open "FA-Draft-Full" detail on the "Templates and documents" tab
    And I click the "Attach documents" button in the "Framework documents" section header
    Then the modal counter should read "0 / 10 documents" but reflect that the FA already holds 10 attached documents (server-tracked)
    When I stage file "eleventh.pdf" (application/pdf, 1 MB) in the drop zone
    And I select Document type "Addendum" for the staged row
    And I click the "Attach documents" button in the modal footer
    Then the upload should be rejected with an explicit error referencing the 10-document per-FA ceiling
    And the "Framework documents" section table should still display exactly 10 document rows

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-06
  # Detach permitted only in Draft state.
  # On Active or Suspended FA, detach returns HTTP 409 with the immutable message.
  # (Detach affordance in the Framework documents table is design-blind — not
  # visible in the exported frame; API-level assertion below is authoritative.)
  # ---------------------------------------------------------------------------

  @main-error @ac-06 @p0 @e2e-ready
  Scenario: Detach on Active FA returns 409 with immutable message (AC-06)
    Given I am logged in as Power User (Bank Admin) with a valid MFA-validated session
    And I am viewing "FA-Active-001" detail on the "Templates and documents" tab
    When I attempt to DELETE "/api/framework-agreements/FA-Active-001/documents/{docId}" for "Framework agreement_signed.pdf"
    Then the HTTP response status should be 409
    And the response body should include the message "Documents on activated agreements are immutable."
    And the document row for "Framework agreement_signed.pdf" should remain visible in the "Framework documents" section

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-08
  # Role-based access: only Power User (Bank Admin) attaches or detaches.
  # UX: "Attach documents" button hidden inside the Framework documents section header.
  # API: direct POST returns 404 (tenant/role gate).
  # ---------------------------------------------------------------------------

  # [CR-PENDING B5] — CR PRD1042-22 v10 §5 flags 4 contested permission-matrix
  # cells. Current 5-role 404 Outline retained pending Philipp Maute decision.

  @main-error @ac-08 @p0 @e2e-ready @cr-pending-b5
  Scenario Outline: Non-permitted role cannot attach — button hidden, direct API returns 404 (AC-08)
    Given I am logged in as <role>
    When I open "FA-Draft-001" detail on the "Templates and documents" tab
    Then within the "Framework documents" section, the "Attach documents" button should NOT be present in the DOM
    When I attempt to POST to "/api/framework-agreements/FA-Draft-001/documents" with a valid PDF multipart body
    Then the HTTP response status should be 404
    And the response body should NOT include the string "403" or "Forbidden"

    Examples:
      | role         |
      | Front Office |
      | Back Office  |
      | LC User      |
      | Support      |
      | Auditor      |

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-09 (Support-role exclusion)
  # Support user cannot download attached documents (per permission matrix).
  # ---------------------------------------------------------------------------

  @main-error @ac-09 @p0 @e2e-ready
  Scenario: Support user cannot download attached document (AC-09)
    Given I am logged in as Support with a grant scoped to "New Group Trade"
    When I open "FA-Active-001" detail on the "Templates and documents" tab
    Then the download icon for "Framework agreement_signed.pdf" should NOT be present in the DOM
    When I attempt to GET "/api/framework-agreements/FA-Active-001/documents/{docId}/download"
    Then the HTTP response status should be 404

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-10
  # Tenant isolation (RefiNext CRITICAL domain rule).
  # LC user attempting to download a document on a DIFFERENT LC's FA returns 404.
  # ---------------------------------------------------------------------------

  @main-error @ac-10 @p0
  Scenario: LC user cross-LC document download returns 404 (AC-10)
    Given a Framework Agreement "FA-Beta-001" exists bound to Leasing Company "Beta Leasing GmbH" with an attached document "beta-agreement.pdf"
    And I am logged in as an LC user bound to "New Group Trade"
    When I attempt to GET "/api/framework-agreements/FA-Beta-001/documents/{docId}/download"
    Then the HTTP response status should be 404
    And the response body should NOT include the string "FA-Beta-001" or "Beta Leasing GmbH" or "beta-agreement.pdf"
    And the response body should NOT include the string "403" or "Forbidden"

  # ---------------------------------------------------------------------------
  # MAIN ERROR — AC-11
  # MFA-validated session required for upload; expired MFA freshness blocks
  # upload before or at the "Attach documents" submit call.
  # ---------------------------------------------------------------------------

  @main-error @ac-11 @p0
  Scenario: Upload without valid MFA session is blocked (AC-11)
    Given I am logged in as Power User (Bank Admin) with an expired MFA freshness window
    And I am viewing "FA-Draft-001" detail on the "Templates and documents" tab
    When I click the "Attach documents" button in the "Framework documents" section header
    And I stage file "test-agreement.pdf" (application/pdf, 2 MB) in the drop zone
    And I select Document type "Original agreement" for the staged row
    And I click the "Attach documents" button in the modal footer
    Then the upload should be blocked with a step-up MFA prompt or an authorization error
    And no new document row should appear in the "Framework documents" section
```

**Framework:** Cucumber + Playwright | **Language:** Gherkin
