import type { Locator, Page } from "../fixtures/test"

export class UserSuspensionPage {
  readonly page: Page
  // User detail page: action trigger
  readonly suspendUserButton: Locator
  // Suspension form (dialog)
  readonly suspensionDialog: Locator
  readonly suspensionReasonDropdown: Locator
  readonly suspensionCommentInput: Locator
  readonly effectiveFromInput: Locator
  readonly suspensionSubmitButton: Locator
  // Field-level validation errors inside the dialog
  readonly suspensionReasonValidationError: Locator
  readonly suspensionCommentValidationError: Locator
  // Post-submission: Four-Eyes governed-action banner on the detail page
  readonly fourEyesPendingBanner: Locator
  // Post-suspension: UI state on the user detail page
  readonly suspendedBanner: Locator
  readonly suspendedStatusBadge: Locator
  readonly reactivateButton: Locator

  constructor(page: Page) {
    this.page = page
    this.suspendUserButton = page.getByRole("button", { name: /suspend user/i })
    // Scoped to the suspension form dialog specifically (identified by its heading)
    // so it doesn't accidentally match the quick-view panel when both are open.
    this.suspensionDialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: /suspend user/i }),
    })
    this.suspensionReasonDropdown = this.suspensionDialog.getByRole(
      "combobox",
      {
        name: /^reason$/i,
      }
    )
    // "Comment (optional)" label — becomes mandatory when Reason = Other
    this.suspensionCommentInput = this.suspensionDialog.getByLabel(/comment/i)
    // "Effective from" is a BaseUI date-picker popover button — pre-filled with today's date.
    // Clicking it opens a calendar; .fill() is not supported on this element type.
    this.effectiveFromInput = this.suspensionDialog.getByTestId(
      "action-effective-from"
    )
    this.suspensionSubmitButton = this.suspensionDialog.getByRole("button", {
      name: /suspend user/i,
    })
    // Validation error messages rendered by React Hook Form's FormMessage as a <p> element.
    // Text confirmed from screenshot: "This field is required."
    // Both fields share the same error text. Reason and comment errors are mutually
    // exclusive in current form logic (comment is only required when reason=Other, so
    // reason can never be empty when comment is required). .first() prevents a
    // strict-mode violation on the rare path where both errors appear simultaneously.
    this.suspensionReasonValidationError = this.suspensionDialog
      .getByText("This field is required.")
      .first()
    this.suspensionCommentValidationError = this.suspensionDialog
      .getByText("This field is required.")
      .first()
    // Banner shown in the main content area when a suspension requires Four-Eyes approval.
    // Scoped to <main> to avoid matching the "Pending approvals" sidebar nav link.
    this.fourEyesPendingBanner = page
      .getByRole("main")
      .getByText(/four.eyes approval required|pending.*approval/i)

    // Suspended-state UI — visible on the user detail page after a successful suspension
    this.suspendedBanner = page.getByText(
      /this account is currently suspended/i
    )
    this.suspendedStatusBadge = page
      .getByRole("main")
      .getByText("Suspended")
      .first()
    this.reactivateButton = page.getByRole("button", { name: /reactivate/i })
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

  async clickSuspendUserAction(): Promise<void> {
    await this.suspendUserButton.click()
    await this.suspensionDialog.waitFor({ state: "visible" })
  }

  async selectSuspensionReason(reason: string): Promise<void> {
    await this.suspensionReasonDropdown.click()
    await this.page.getByRole("option", { name: reason }).click()
  }

  async fillSuspensionComment(comment: string): Promise<void> {
    await this.suspensionCommentInput.fill(comment)
  }

  // "Effective from" is pre-filled with today's date by the form.
  // Verifies the date picker is visible and already has a value before submission.
  async verifyEffectiveFromIsSet(): Promise<void> {
    await this.effectiveFromInput.waitFor({ state: "visible" })
  }

  async submitSuspensionForm(): Promise<void> {
    await this.suspensionSubmitButton.click()
  }
}
