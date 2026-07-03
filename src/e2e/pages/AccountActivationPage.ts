import type { Locator, Page } from "../fixtures/test"

export class AccountActivationPage {
  readonly page: Page
  // Activation form — shown when a valid, unused token is opened
  readonly emailDisplay: Locator
  readonly setPasswordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly activateButton: Locator
  // Error states — shown when token is expired, used, or account state is invalid
  readonly errorMessage: Locator
  readonly passwordMismatchError: Locator
  // Success state — shown after the activation form is submitted successfully
  readonly successConfirmation: Locator

  constructor(page: Page) {
    this.page = page
    // Email prefilled and non-editable; rendered as a disabled textbox
    this.emailDisplay = page.getByRole("textbox", { name: /email/i })
    this.setPasswordInput = page.getByLabel(/set password/i)
    this.confirmPasswordInput = page.getByLabel(/confirm password/i)
    // Button label is "Set Password" (PRD1042-68) or "Activate Account" (PRD1042-60) depending on context
    this.activateButton = page.getByRole("button", {
      name: /(set password|activate account)/i,
    })
    // Generic error banner for invalid/expired/used/blocked-state token scenarios
    this.errorMessage = page.getByRole("alert")
    // Inline field error rendered when password and confirm-password do not match
    this.passwordMismatchError = page.getByText(
      /passwords? do not match|passwords? must match/i
    )
    // Confirmation heading or message shown on the page after successful password setup
    this.successConfirmation = page.getByRole("heading", {
      name: /account activated|activation (complete|successful)|password set/i,
    })
  }

  async gotoWithToken(token: string): Promise<void> {
    await this.page.goto(`/activate?token=${encodeURIComponent(token)}`)
  }

  async fillActivationForm(
    password: string,
    confirmPassword: string = password
  ): Promise<void> {
    await this.setPasswordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword)
  }

  async submitForm(): Promise<void> {
    await this.activateButton.click()
  }
}
