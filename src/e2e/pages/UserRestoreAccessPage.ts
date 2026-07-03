import type { Locator, Page } from "../fixtures/test"

export class UserRestoreAccessPage {
  readonly page: Page
  // Profile page — trigger (only visible when user is Suspended)
  readonly reactivateButton: Locator
  // Restore Access dialog
  readonly restoreAccessDialog: Locator
  readonly restoreReasonDropdown: Locator
  readonly restoreCommentInput: Locator
  // "Effective from" date-picker — same data-testid pattern as UserSuspensionPage.
  // Figma design confirmed an "Effective From" field in the form description;
  // present if the UI exposes it (API ReactivateUserRequest does not include it).
  readonly effectiveFromInput: Locator
  // Button copy unverified from Figma render — name pattern covers all variants
  readonly submitButton: Locator
  // Validation errors (React Hook Form renders these as plain <p> elements)
  readonly reasonValidationError: Locator
  readonly commentValidationError: Locator
  // Post-restore state on the user detail page
  readonly activeStatusBadge: Locator
  readonly suspendButton: Locator
  // Post-submit Four-Eyes banner (scoped to <main> to avoid sidebar "Pending approvals" nav link)
  readonly fourEyesPendingBanner: Locator

  constructor(page: Page) {
    this.page = page
    this.reactivateButton = page
      .getByRole("main")
      .getByRole("button", { name: /reactivate/i })
    // Scoped to the restore-access form dialog specifically (identified by its heading)
    // so it doesn't match the quick-view panel when both are open.
    this.restoreAccessDialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: /reactivate|restore access/i }),
    })
    this.restoreReasonDropdown = this.restoreAccessDialog.getByRole(
      "combobox",
      {
        name: /^reason$/i,
      }
    )
    this.restoreCommentInput = this.restoreAccessDialog.getByLabel(/comment/i)
    this.effectiveFromInput = this.restoreAccessDialog.getByTestId(
      "action-effective-from"
    )
    this.submitButton = this.restoreAccessDialog.getByRole("button", {
      name: /reactivate|restore/i,
    })
    // Both fields share the same error text. Reason and comment errors are mutually
    // exclusive in current form logic (comment is only required when reason=Other, so
    // reason can never be empty when comment is required). .first() prevents a
    // strict-mode violation on the rare path where both errors appear simultaneously.
    this.reasonValidationError = this.restoreAccessDialog
      .getByText("This field is required.")
      .first()
    this.commentValidationError = this.restoreAccessDialog
      .getByText("This field is required.")
      .first()
    this.activeStatusBadge = page.getByRole("main").getByText("Active").first()
    this.suspendButton = page.getByRole("button", { name: /suspend user/i })
    this.fourEyesPendingBanner = page
      .getByRole("main")
      .getByText(/four.eyes approval required|pending.*approval/i)
  }

  async gotoProfile(userId: string): Promise<void> {
    await this.page.goto(`/platform-administration/user-management/${userId}`)
    await this.page.waitForLoadState("networkidle")
  }

  async gotoListAndOpenByEmail(email: string): Promise<void> {
    await this.page.goto("/platform-administration/user-management")
    await this.page.waitForLoadState("networkidle")
    const responsePromise = this.page.waitForResponse(
      resp =>
        /\/api\/v1\/users(\?|$)/.test(resp.url()) &&
        resp.request().method() === "GET",
      { timeout: 15000 }
    )
    await this.page.getByTestId("user-search-input").fill(email)
    await responsePromise
    await this.page.waitForLoadState("networkidle")
    const firstRow = this.page.getByTestId(/^user-row-/).first()
    await firstRow.waitFor({ state: "visible" })
    await firstRow.click()
  }

  async clickReactivate(): Promise<void> {
    await this.reactivateButton.click()
    await this.restoreAccessDialog.waitFor({ state: "visible" })
  }

  async selectRestoreReason(reason: string): Promise<void> {
    await this.restoreReasonDropdown.click()
    await this.page.getByRole("option", { name: reason }).click()
  }

  async fillComment(comment: string): Promise<void> {
    await this.restoreCommentInput.fill(comment)
  }

  // Verifies the "Effective From" date-picker is visible and pre-filled.
  // Only call when you know the form renders this field.
  async verifyEffectiveFromIsSet(): Promise<void> {
    await this.effectiveFromInput.waitFor({ state: "visible" })
  }

  async submitRestoreForm(): Promise<void> {
    await this.submitButton.click()
  }
}
