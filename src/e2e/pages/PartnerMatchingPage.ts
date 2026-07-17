import type { Locator, Page } from "../fixtures/test"

export class PartnerMatchingPage {
  readonly page: Page
  // Match-evidence panel surfaced in the Partner creation flow for bank-internal roles.
  // Must never be visible to LC (leasing_company_user) — checked by AC-05.
  readonly matchEvidencePanel: Locator
  readonly matchedAnchors: Locator
  readonly classificationLabel: Locator

  constructor(page: Page) {
    this.page = page
    this.matchEvidencePanel = page.getByTestId("match-evidence-panel")
    this.matchedAnchors = page.getByTestId("matched-anchors")
    this.classificationLabel = page.getByTestId("match-classification")
  }

  async gotoLCPartnerArea() {
    await this.page.goto("/lc/partners")
    await this.page.waitForLoadState("networkidle")
  }
}
