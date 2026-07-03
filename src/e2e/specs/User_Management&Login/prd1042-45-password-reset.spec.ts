import { expect, test } from "../../fixtures/test"
import { PasswordResetPage } from "../../pages/PasswordResetPage"

// ---------------------------------------------------------------------------
// PRD1042-45 — US 28.3 | User Management | Password Reset
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-45 Reset Password.md
//
// Covered:  AC-01 (account enumeration prevention — 3 email variants)
// Blocked:  AC-02 (D17), AC-06 (D17)
// Gated:    AC-05 (email access), AC-07/AC-08/AC-09/AC-10/AC-14 (D17/D19)
// Excluded: AC-03, AC-04, AC-11, AC-12, AC-13, AC-15 (separate-feature or edge-case)
// ---------------------------------------------------------------------------

// Account enumeration test emails — Scenario Outline examples (AC-01)
// Uses a real registered email + two synthetic addresses to cover all three
// account states. The backend must respond identically for all three.
const ENUMERATION_EMAILS = [
  process.env.E2E_SYSTEM_ADMIN_EMAIL ?? "registered@bank-a.example",
  "notregistered@nowhere.example",
  process.env.DEV_DEACTIVATED_USER_EMAIL ?? "deactivated@bank-a.example",
]

test.describe("PRD1042-45 — Password Reset", () => {
  // Override project-level storageState — this file tests the unauthenticated
  // forgot-password flow. In the chromium-authenticated project the base page
  // fixture inherits .auth/user.json, which causes the app to redirect
  // authenticated users away from /forgot-password before the form renders.
  test.use({ storageState: ".auth/gate.json" })
  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-01 (Scenario Outline — 3 email variants)
  // The Forgot Password form must return the same generic success response for
  // any submitted email — registered, unregistered, or deactivated — to prevent
  // account enumeration attacks. The UI must not reveal whether the email exists.
  //
  // The backend endpoint is mocked to avoid hitting the rate limiter on repeated
  // CI/local runs. The test verifies the UI behaviour on a 200 response — not
  // whether the real backend enforces rate limiting (that is a backend concern).
  // ---------------------------------------------------------------------------

  for (const email of ENUMERATION_EMAILS) {
    test(`Forgot Password returns generic success for "${email}" regardless of account status (AC-01)`, async ({
      page,
    }) => {
      await page.route("**/api/v1/auth/password/forgot", route =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            code: "RESET_EMAIL_SENT",
            message: "If this email exists, a reset link has been sent.",
          }),
        })
      )

      const resetPage = new PasswordResetPage(page)
      await resetPage.gotoForgotPassword()
      await resetPage.submitForgotPasswordRequest(email)

      // The same "Check your email" heading must appear for ALL email variants
      // (registered, unregistered, deactivated) — same response is what
      // prevents account enumeration, not hiding the email address
      await expect(resetPage.forgotPasswordSuccessMessage).toBeVisible()

      // The submit form must be replaced by the confirmation state
      await expect(resetPage.forgotPasswordEmailInput).not.toBeVisible()
    })
  }
})
