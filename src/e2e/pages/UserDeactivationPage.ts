import type { Locator, Page } from "../fixtures/test"

export class UserDeactivationPage {
  readonly page: Page
  // User detail page: action trigger
  readonly deactivateUserButton: Locator
  // Deactivation form (dialog)
  readonly deactivationDialog: Locator
  readonly deactivationReasonDropdown: Locator
  readonly deactivationCommentInput: Locator
  readonly effectiveFromInput: Locator
  readonly deactivationSubmitButton: Locator
  // Field-level validation errors inside the dialog
  readonly deactivationReasonValidationError: Locator
  readonly deactivationCommentValidationError: Locator
  // Post-submission: Four-Eyes governed-action banner on the detail page
  readonly fourEyesPendingBanner: Locator
  // Post-deactivation: UI state on the user detail page
  readonly deactivatedBanner: Locator
  readonly deactivatedStatusBadge: Locator
  // Restore Access action — must be absent for Deactivated users (AC-12)
  readonly restoreAccessButton: Locator

  constructor(page: Page) {
    this.page = page
    this.deactivateUserButton = page.getByRole("button", {
      name: /deactivate user/i,
    })
    this.deactivationDialog = page.getByRole("dialog")
    this.deactivationReasonDropdown = this.deactivationDialog.getByRole(
      "combobox",
      {
        name: /^reason$/i,
      }
    )
    // "Comment (optional)" label — becomes mandatory when Reason = Other
    this.deactivationCommentInput =
      this.deactivationDialog.getByLabel(/comment/i)
    // "Effective from" is a BaseUI date-picker popover button — same data-testid as suspension form.
    // Clicking it opens a calendar; .fill() is not supported on this element type.
    this.effectiveFromInput = this.deactivationDialog.getByTestId(
      "action-effective-from"
    )
    this.deactivationSubmitButton = this.deactivationDialog.getByRole(
      "button",
      {
        name: /deactivate user/i,
      }
    )
    // Validation error messages rendered by React Hook Form's FormMessage as a <p> element.
    // Text pattern confirmed from UserSuspensionPage: "This field is required."
    // Both fields share the same error text. Reason and comment errors are mutually
    // exclusive in current form logic (comment is only required when reason=Other, so
    // reason can never be empty when comment is required). .first() prevents a
    // strict-mode violation on the rare path where both errors appear simultaneously.
    this.deactivationReasonValidationError = this.deactivationDialog
      .getByText("This field is required.")
      .first()
    this.deactivationCommentValidationError = this.deactivationDialog
      .getByText("This field is required.")
      .first()
    // Banner shown in the main content area when deactivation requires Four-Eyes approval.
    // Scoped to <main> to avoid matching the "Pending approvals" sidebar nav link.
    this.fourEyesPendingBanner = page
      .getByRole("main")
      .getByText(/four.eyes approval required|pending.*approval/i)
    this.deactivatedBanner = page.getByText(
      /this account is.*deactivated|account has been deactivated/i
    )
    this.deactivatedStatusBadge = page
      .getByRole("main")
      .getByText("Deactivated")
      .first()
    // Scoped to <main> to avoid matching sidebar links
    this.restoreAccessButton = page
      .getByRole("main")
      .getByRole("button", { name: /restore access|reactivate/i })
  }

  async gotoProfile(userId: string): Promise<void> {
    await this.page.goto(`/platform-administration/user-management/${userId}`)
    await this.page.waitForLoadState("networkidle")
  }

  async clickDeactivateUserAction(): Promise<void> {
    await this.deactivateUserButton.click()
    await this.deactivationDialog.waitFor({ state: "visible" })
  }

  async selectDeactivationReason(reason: string): Promise<void> {
    await this.deactivationReasonDropdown.click()
    await this.page.getByRole("option", { name: reason }).click()
  }

  async fillDeactivationComment(comment: string): Promise<void> {
    await this.deactivationCommentInput.fill(comment)
  }

  // "Effective from" is pre-filled with today's date by the form.
  // Verifies the date picker is visible and already has a value before submission.
  async verifyEffectiveFromIsSet(): Promise<void> {
    await this.effectiveFromInput.waitFor({ state: "visible" })
  }

  async submitDeactivationForm(): Promise<void> {
    await this.deactivationSubmitButton.click()
  }
}
