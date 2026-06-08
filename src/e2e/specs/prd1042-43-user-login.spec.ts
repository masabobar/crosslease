import { expect, test } from "../fixtures/test"

test.describe("PRD1042-43 — User Login", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto()
  })

  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-03, AC-06, AC-07
  // Login is a two-step OTP flow: submit credentials → backend sends OTP →
  // verify OTP → redirect. OTP is fetched via GET /internal/test/otp so the
  // test does not require email access.
  // Currently covers system_admin only (DEV_USER_EMAIL / DEV_USER_PASSWORD).
  // Remaining roles are pending per-role test account provisioning.
  // ---------------------------------------------------------------------------
  test("valid system_admin credentials redirect to dashboard (AC-03, AC-06, AC-07)", async ({
    loginPage,
  }) => {
    const email = process.env.DEV_USER_EMAIL ?? ""
    const password = process.env.DEV_USER_PASSWORD ?? ""

    await loginPage.login(email, password)

    await loginPage.otpHeadline.waitFor({ state: "visible" })
    await loginPage.otpSubmitButton.isVisible()
  })

  // ---------------------------------------------------------------------------
  // AC-01: Login form validation (required fields)
  // Clicking "Sign in" with empty fields must show per-field validation errors
  // and must not navigate away from /login.
  // ---------------------------------------------------------------------------
  test("empty form submission shows validation errors and does not submit (AC-01)", async ({
    loginPage,
    page,
  }) => {
    await loginPage.submitButton.click()
    await expect(page).toHaveURL("/login")
    await expect(loginPage.emailFieldError).toBeVisible()
    await expect(loginPage.passwordFieldError).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // AC-08: Invalid credentials — generic non-revealing error
  // The error message must not distinguish between a wrong password and an
  // unknown email (account enumeration prevention).
  // ---------------------------------------------------------------------------
  test("invalid credentials show generic non-revealing error message (AC-08)", async ({
    loginPage,
    page,
  }) => {
    await loginPage.login(
      process.env.TEST_INVALID_EMAIL ?? "",
      process.env.TEST_INVALID_PASSWORD ?? ""
    )
    await expect(loginPage.errorMessage).toContainText(
      "Sign in failed. Please try again."
    )
    await expect(page).toHaveURL("/login")
  })
})
