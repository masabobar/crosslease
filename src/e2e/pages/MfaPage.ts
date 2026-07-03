import type { Locator, Page } from "../fixtures/test"

export class MfaPage {
  readonly page: Page

  // MFA Verify page (/mfa/verify) — reached after password auth for MFA-enrolled users
  readonly verifyForm: Locator
  readonly codeInput: Locator
  readonly verifyErrorMessage: Locator
  readonly verifyBackButton: Locator
  readonly verifySubmitButton: Locator

  // MFA Enroll page (/mfa/enroll) — reached on first login for roles with mandatory MFA
  // Step 1: QR code scan + TOTP activation code entry
  readonly qrCode: Locator
  readonly secretKey: Locator
  readonly activateForm: Locator
  readonly activateCodeInput: Locator
  readonly enrollErrorMessage: Locator
  readonly enrollBackButton: Locator
  readonly enrollActivateButton: Locator

  // Step 2: Recovery codes display (shown after successful activation)
  readonly recoveryCodes: Locator
  // Each individual code item — scoped inside the recovery codes container
  readonly recoveryCodeItems: Locator
  readonly copyRecoveryCodesButton: Locator
  readonly recoveryContinueButton: Locator

  constructor(page: Page) {
    this.page = page
    // Verify page
    this.verifyForm = page.getByTestId("mfa-verify-form")
    // Single input handles both 6-digit TOTP codes and 20-char hex recovery codes —
    // the component auto-detects which type was entered based on length and character set.
    this.codeInput = page.getByTestId("mfa-code-input")
    this.verifyErrorMessage = page.getByTestId("mfa-verify-error-message")
    this.verifyBackButton = page.getByTestId("mfa-verify-back-button")
    this.verifySubmitButton = page.getByTestId("mfa-verify-submit-button")
    // Enroll page — step 1
    this.qrCode = page.getByTestId("mfa-qr-code")
    this.secretKey = page.getByTestId("mfa-secret-key")
    this.activateForm = page.getByTestId("mfa-activate-form")
    this.activateCodeInput = page.getByTestId("mfa-activate-code-input")
    this.enrollErrorMessage = page.getByTestId("mfa-enroll-error-message")
    this.enrollBackButton = page.getByTestId("mfa-enroll-back-button")
    this.enrollActivateButton = page.getByTestId("mfa-enroll-activate-button")
    // Enroll page — step 2 (recovery codes)
    this.recoveryCodes = page.getByTestId("mfa-recovery-codes")
    this.recoveryCodeItems =
      this.recoveryCodes.getByTestId(/^mfa-recovery-code-/)
    this.copyRecoveryCodesButton = page.getByTestId(
      "mfa-copy-recovery-codes-button"
    )
    this.recoveryContinueButton = page.getByTestId(
      "mfa-recovery-continue-button"
    )
  }

  async gotoVerify(): Promise<void> {
    await this.page.goto("/mfa/verify")
    await this.page.waitForLoadState("networkidle")
  }

  async gotoEnroll(): Promise<void> {
    await this.page.goto("/mfa/enroll")
    await this.page.waitForLoadState("networkidle")
  }

  // Submit a code on the MFA verify page.
  // Pass a 6-digit numeric string for TOTP, or a 20-char hex string for a recovery code.
  async submitCode(code: string): Promise<void> {
    await this.codeInput.fill(code)
    await this.verifySubmitButton.click()
  }

  // Enter and submit a 6-digit activation code during enrollment.
  async submitActivationCode(code: string): Promise<void> {
    await this.activateCodeInput.fill(code)
    await this.enrollActivateButton.click()
  }

  // Read all displayed recovery codes from the container.
  // Returns an array of code strings after activation is confirmed.
  async getRecoveryCodes(): Promise<string[]> {
    const count = await this.recoveryCodeItems.count()
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      codes.push((await this.recoveryCodeItems.nth(i).textContent()) ?? "")
    }
    return codes.map(c => c.trim()).filter(Boolean)
  }
}
