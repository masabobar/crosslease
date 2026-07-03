import { expect, test } from "../../fixtures/test"
import { MfaPage } from "../../pages/MfaPage"

// ---------------------------------------------------------------------------
// PRD1042-525 — US 28.2 | User Management | MVP MFA Authentication & Enrollment
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-525 MFA Authentication and Enrollment.md
//
// Covered (runnable):  gate — direct navigation to /mfa/verify without token
// Fixme (TOTP infra):  AC-01/02/05 (TOTP secret + code generation required)
//                      AC-03 (invalid TOTP — need enrolled user + known secret)
//                      AC-12 (pending-MFA bypass — need partial-MFA session)
// Fixme (D19):         AC-04 (first-login enrollment — throwaway user required)
//                      AC-07 (admin MFA reset — admin reset endpoint required)
//                      AC-14 (enrollment screen UI — fresh enrolling user required)
//                      AC-15 (recovery code flow — D19 + code capture required)
// Fixme (D-NEW):       AC-04b (policy-triggered enrollment)
//                      AC-16  (recovery rate limit — throttle reset endpoint)
// Fixme (D20):         AC-06 (tenant MFA policy)
// Fixme (R1):          AC-08 (API/SSO parity)
// Fixme (edge-case):   AC-09 (OTP expiry — D16), AC-11 (secret exposure)
// Fixme (separate):    AC-10 (lockout — PRD1042-46), AC-13 (audit logging)
//
// Implementation note: MfaVerifyPage (/mfa/verify) and MfaEnrollPage (/mfa/enroll)
// require a `mfa_token` passed via React Router location.state. Direct URL
// navigation without that state renders a "session expired" error — this is
// the only flow testable without live TOTP infrastructure today.
//
// Recovery codes: the verify page uses a SINGLE code input for both 6-digit
// TOTP codes AND 20-char hex recovery codes — auto-detected by length.
// There is no separate "Use a recovery code" button in the current implementation.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GATE — direct navigation without a pending MFA token
// Verifies the MFA verify and enroll routes are reachable and handle the
// no-token case gracefully (no verify form rendered, back-to-login available).
// ---------------------------------------------------------------------------

test("Direct navigation to /mfa/verify without a pending login token does not render the verification form (gate)", async ({
  page,
}) => {
  const mfaPage = new MfaPage(page)
  await mfaPage.gotoVerify()

  // The form requires a mfa_token passed via React Router state.
  // Direct URL navigation has no state → the form must not render.
  await expect(mfaPage.verifyForm).not.toBeVisible()
  await expect(mfaPage.verifySubmitButton).not.toBeVisible()
  // A recovery path (Back to login) must be reachable from the error state.
  await expect(
    page.getByRole("button", { name: /back.to.login|back/i })
  ).toBeVisible()
})

test("Direct navigation to /mfa/enroll without a pending enrollment token does not render the QR code (gate)", async ({
  page,
}) => {
  const mfaPage = new MfaPage(page)
  await mfaPage.gotoEnroll()

  // The enrollment form requires a mfa_token in React Router state.
  // Without it the QR code and activation form must not render.
  await expect(mfaPage.qrCode).not.toBeVisible()
  await expect(mfaPage.activateForm).not.toBeVisible()
  await expect(
    page.getByRole("button", { name: /back.to.login|back/i })
  ).toBeVisible()
})
