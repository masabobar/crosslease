import type { Locator, Page } from "../fixtures/test"

export class PendingApprovalsPage {
  readonly page: Page
  readonly pageTitle: Locator
  readonly searchInput: Locator
  readonly tabAll: Locator
  readonly tabPending: Locator
  readonly tabApproved: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    this.page = page
    this.pageTitle = page.getByRole("heading", { level: 1 })
    this.searchInput = page.getByTestId("search-input")
    this.tabAll = page.getByTestId("tab-all")
    this.tabPending = page.getByTestId("tab-pending")
    this.tabApproved = page.getByTestId("tab-approved")
    this.emptyState = page.getByTestId("empty-state")
  }

  async goto(): Promise<void> {
    await this.page.goto("/platform-administration/pending-approvals")
    await this.page.waitForLoadState("networkidle")
  }

  approvalRow(actionId: string): Locator {
    return this.page.getByTestId(`approval-row-${actionId}`)
  }

  reviewButton(actionId: string): Locator {
    return this.page.getByTestId(`review-btn-${actionId}`)
  }

  withdrawButton(actionId: string): Locator {
    return this.page.getByTestId(`withdraw-btn-${actionId}`)
  }
}
