import type { Locator, Page } from "../fixtures/test"

// POM for the Audit Trail investigation surface — list (/platform-administration/audit-trail)
// and detail (/platform-administration/audit-trail/:eventId) routes.
// Used by PRD1042-782 (US 26.5 — Old/New Value Capture & Sensitive-Field Masking).
export class AuditTrailPage {
  readonly page: Page
  readonly listContainer: Locator
  readonly detailContainer: Locator
  readonly auditTable: Locator
  readonly loadError: Locator
  readonly firstRowLink: Locator

  constructor(page: Page) {
    this.page = page
    this.listContainer = page.getByTestId("audit-trail-page")
    this.detailContainer = page.getByTestId("audit-event-detail-page")
    this.auditTable = page.getByTestId("audit-table")
    this.loadError = page.getByTestId("audit-load-error")
    // First row link on the list — used to navigate to a detail view without
    // needing to know a specific event id up-front.
    this.firstRowLink = page
      .getByTestId("audit-table")
      .getByRole("link")
      .first()
  }

  async gotoList(): Promise<void> {
    await this.page.goto("/platform-administration/audit-trail")
  }

  async gotoDetail(eventId: string): Promise<void> {
    await this.page.goto(`/platform-administration/audit-trail/${eventId}`)
  }

  // Returns all interactive editing controls visible on the detail page.
  // The investigation surface is READ-ONLY — this locator is asserted empty
  // by AC-14 to prove no save/submit/edit affordance exists.
  editingControls(): Locator {
    return this.detailContainer.getByRole("button", {
      name: /save|submit|edit|update|delete/i,
    })
  }

  // Returns all form input controls inside the detail container via ARIA roles.
  // The read-only view must contain zero editable text inputs / comboboxes.
  editableInputs(): Locator {
    return this.detailContainer.getByRole("textbox")
  }

  // Returns any combobox-style selector on the detail page — must be empty
  // in the read-only investigation surface.
  editableSelects(): Locator {
    return this.detailContainer.getByRole("combobox")
  }
}
