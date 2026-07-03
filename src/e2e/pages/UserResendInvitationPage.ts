import type { Locator, Page } from "../fixtures/test"

export class UserResendInvitationPage {
  readonly page: Page
  // User detail page: action trigger (visible only for users in "invited" lifecycle state)
  readonly resendInvitationButton: Locator
  // Resend Invitation form (dialog)
  readonly resendDialog: Locator
  readonly resendReasonDropdown: Locator
  readonly resendSubmitButton: Locator
  // Field-level validation error for missing reason (React Hook Form pattern)
  readonly resendReasonValidationError: Locator
  // Post-submission: success confirmation
  readonly successConfirmation: Locator
  // Read-only fields inside the dialog — used to assert metadata is present and non-editable
  readonly invitationSentDateField: Locator
  readonly invitationExpiryDateField: Locator

  constructor(page: Page) {
    this.page = page
    this.resendInvitationButton = page.getByRole("button", {
      name: /resend invitation/i,
    })
    this.resendDialog = page.getByRole("dialog")
    this.resendReasonDropdown = this.resendDialog.getByRole("combobox", {
      name: /^reason$/i,
    })
    this.resendSubmitButton = this.resendDialog.getByRole("button", {
      name: /resend invitation/i,
    })
    // Validation error message — same React Hook Form pattern as suspension/deactivation forms
    this.resendReasonValidationError = this.resendDialog.getByText(
      "This field is required."
    )
    // Success confirmation — shown after a successful resend submission
    this.successConfirmation = page.getByText(
      /invitation.*resent|resent.*successfully/i
    )
    // Read-only metadata fields inside the dialog
    this.invitationSentDateField =
      this.resendDialog.getByText(/invitation sent/i)
    this.invitationExpiryDateField =
      this.resendDialog.getByText(/invitation expir/i)
  }

  async gotoProfile(userId: string): Promise<void> {
    await this.page.goto(`/platform-administration/user-management/${userId}`)
    await this.page.waitForLoadState("networkidle")
  }

  async clickResendInvitationAction(): Promise<void> {
    await this.resendInvitationButton.click()
    await this.resendDialog.waitFor({ state: "visible" })
  }

  async selectResendReason(reason: string): Promise<void> {
    await this.resendReasonDropdown.click()
    await this.page.getByRole("option", { name: reason }).click()
  }

  async submitResendForm(): Promise<void> {
    await this.resendSubmitButton.click()
  }
}
