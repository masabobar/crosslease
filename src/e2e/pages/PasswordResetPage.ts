import type { Locator, Page } from "../fixtures/test"

export class PasswordResetPage {
  readonly page: Page
  // Forgot Password page (/forgot-password)
  readonly forgotPasswordEmailInput: Locator
  readonly forgotPasswordSubmitButton: Locator
  readonly forgotPasswordSuccessMessage: Locator
  // Set New Password page (/reset-password?token=...)
  readonly setNewPasswordHeading: Locator
  readonly newPasswordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly updatePasswordButton: Locator
  readonly tokenErrorMessage: Locator
  readonly passwordValidationError: Locator

  constructor(page: Page) {
    this.page = page
    // Forgot Password form
    this.forgotPasswordEmailInput = page.getByRole("textbox", {
      name: /email/i,
    })
    this.forgotPasswordSubmitButton = page.getByRole("button", {
      name: /reset|send|continue|request/i,
    })
    // Confirmation shown after form submission — heading replaces the form
    this.forgotPasswordSuccessMessage = page.getByRole("heading", {
      name: /check your email/i,
    })
    // Set New Password form (Figma node 167:18629)
    this.setNewPasswordHeading = page.getByRole("heading", {
      name: /set a new password/i,
    })
    this.newPasswordInput = page.getByLabel(/create new password/i)
    this.confirmPasswordInput = page.getByLabel(/confirm password/i)
    this.updatePasswordButton = page.getByRole("button", {
      name: /update password/i,
    })
    // Generic error shown when token is invalid/expired/used
    this.tokenErrorMessage = page.getByRole("alert")
    this.passwordValidationError = page.getByRole("alert")
  }

  async gotoForgotPassword(): Promise<void> {
    await this.page.goto("/forgot-password")
    await this.page.waitForURL("/forgot-password")
  }

  async submitForgotPasswordRequest(email: string): Promise<void> {
    await this.forgotPasswordEmailInput.fill(email)
    await this.forgotPasswordSubmitButton.click()
  }

  async gotoResetPasswordWithToken(token: string): Promise<void> {
    await this.page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
  }

  async submitNewPassword(
    password: string,
    confirmPassword: string = password
  ): Promise<void> {
    await this.newPasswordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword)
    await this.updatePasswordButton.click()
  }
}
