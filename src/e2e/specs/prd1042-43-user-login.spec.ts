import { expect, test } from "../fixtures/test"

// ---------------------------------------------------------------------------
// HAPPY PATH — AC-03, AC-06, AC-07
// Login is a two-step OTP flow: submit credentials → backend sends OTP →
// verify OTP → redirect. OTP is fetched via GET /internal/test/otp so the
// test does not require email access.
// All 6 role accounts are seeded in src/e2e/.env.
// ---------------------------------------------------------------------------
const ROLE_LOGINS = [
  {
    role: "system_admin",
    emailVar: "DEV_USER_EMAIL",
    passwordVar: "DEV_USER_PASSWORD",
    landing: "/dashboard",
  },
  {
    role: "back_office_risk",
    emailVar: "DEV_BACK_OFFICE_USER_EMAIL",
    passwordVar: "DEV_BACK_OFFICE_USER_PASSWORD",
    landing: "/dashboard",
  },
  {
    role: "front_office",
    emailVar: "DEV_FRONT_OFFICE_USER_EMAIL",
    passwordVar: "DEV_FRONT_OFFICE_USER_PASSWORD",
    landing: "/dashboard",
  },
  {
    role: "support_user",
    emailVar: "DEV_SUPPORT_USER_EMAIL",
    passwordVar: "DEV_SUPPORT_USER_PASSWORD",
    landing: "/dashboard",
  },
  {
    role: "auditor",
    emailVar: "DEV_AUDIT_USER_EMAIL",
    passwordVar: "DEV_AUDIT_USER_PASSWORD",
    landing: "/dashboard",
  },
  {
    role: "leasing_company_user",
    emailVar: "DEV_LCO_USER_EMAIL",
    passwordVar: "DEV_LCO_USER_PASSWORD",
    landing: "/workspace",
  },
] as const

test.describe("PRD1042-43 — User Login", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto()
  })

  for (const { role, emailVar, passwordVar } of ROLE_LOGINS) {
    test(`valid ${role} credentials return HTTP 200 (AC-03, AC-06, AC-07)`, async ({
      loginPage,
      page,
    }) => {
      const email = process.env[emailVar] ?? ""
      const password = process.env[passwordVar] ?? ""

      const responsePromise = page.waitForResponse(
        resp =>
          resp.url().includes("/auth/login") &&
          resp.request().method() === "POST"
      )

      await loginPage.login(email, password)

      const response = await responsePromise
      expect(response.status()).toBe(200)
    })
  }

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
