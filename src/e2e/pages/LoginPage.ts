import type { Locator, Page } from "../fixtures/test"

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly emailFieldError: Locator
  readonly passwordFieldError: Locator
  readonly otpSubmitButton: Locator
  readonly otpHeadline: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByTestId("login-email-input")
    this.passwordInput = page.getByTestId("login-password-input")
    this.submitButton = page.getByTestId("login-submit-button")
    this.errorMessage = page.getByTestId("login-error-message")
    this.emailFieldError = page.getByText("This field is required.").first()
    this.passwordFieldError = page.getByText("This field is required.").nth(1)
    this.otpSubmitButton = page.getByTestId("otp-submit-button")
    this.otpHeadline = page.getByText("Check your email")
  }

  async goto(): Promise<void> {
    await this.page.goto("/login")
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  // Waits for the OTP step to appear, types the code, and submits.
  // InputOTP (input-otp library) uses a hidden native input; click-then-keyboard is the reliable interaction pattern.
  async enterOtp(code: string): Promise<void> {
    await this.otpSubmitButton.waitFor({ state: "visible" })
    await this.page.getByTestId("otp-form").click()
    await this.page.keyboard.type(code)
    await this.otpSubmitButton.click()
  }
}
