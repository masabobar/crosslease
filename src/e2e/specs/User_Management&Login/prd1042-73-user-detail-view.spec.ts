import { expect, test } from "../../fixtures/test"
import { UserDetailPage } from "../../pages/UserDetailPage"

// ---------------------------------------------------------------------------
// PRD1042-73 — US 28.6 | User Management | User Detail View
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-73 User Detail View.md
//
// Implementation note (2026-06-23): clicking a user row opens a quick-view
// dialog — not a full-page navigation. The dialog is the current User Detail
// View. "Open full profile" navigates to the full-page view which returns
// "Failed to load user details" (Dev in progress). Tests assert on the dialog.
//
// Covered (runnable):  AC-01 (outline × 3 + self-profile), AC-02, AC-16
// Fixme (dev in progress): AC-07 (email editing not yet in dialog)
// Excluded (fixme):    AC-03–06, AC-08–15 — edge-case or separate-feature
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// HAPPY PATH — AC-01 (Scenario Outline — Power User)
// Power User opens a quick-view for another user: all three section labels
// (IDENTITY, ROLE & SCOPE, STATUS) are visible and lifecycle action buttons
// (Suspend, Deactivate) are present.
// Design ref: ADMIN frame line 903.
// ---------------------------------------------------------------------------

test("Power User opens User Detail quick-view — sections and lifecycle action buttons visible (AC-01)", async ({
  authenticatedPage,
}) => {
  const detailPage = new UserDetailPage(authenticatedPage)
  const targetEmail = process.env.E2E_AUDIT_USER_EMAIL ?? ""
  await authenticatedPage.goto("/platform-administration/user-management")
  await authenticatedPage.waitForLoadState("networkidle")
  // Use a known-active user (auditor) — auditor accounts are never suspended
  // by any test in this suite, making this assertion deterministic.
  await detailPage.openByEmail(targetEmail)

  await expect(detailPage.userDetailDialog).toBeVisible()
  // All three section labels must be present in the dialog
  await expect(detailPage.userDetailDialog).toContainText("IDENTITY")
  await expect(detailPage.userDetailDialog).toContainText("ROLE & SCOPE")
  await expect(detailPage.userDetailDialog).toContainText("STATUS")
  // Power User: lifecycle action buttons must be visible
  await expect(detailPage.suspendUserButton).toBeVisible()
  await expect(detailPage.deactivateUserButton).toBeVisible()
})

// ---------------------------------------------------------------------------
// HAPPY PATH — AC-01 (Scenario Outline — Support User)
// Support User opens the quick-view: sections visible, all action buttons hidden.
// Design ref: SUPPORT frame line 3276.
// ---------------------------------------------------------------------------

test("Support User opens User Detail quick-view — sections visible, action buttons hidden (AC-01)", async ({
  supportPage,
}) => {
  const detailPage = new UserDetailPage(supportPage)
  await supportPage.goto("/platform-administration/user-management")
  await supportPage.waitForLoadState("networkidle")
  await detailPage.openFromFirstRow()

  await expect(detailPage.userDetailDialog).toBeVisible()
  await expect(detailPage.userDetailDialog).toContainText("IDENTITY")
  await expect(detailPage.userDetailDialog).toContainText("ROLE & SCOPE")
  await expect(detailPage.userDetailDialog).toContainText("STATUS")
  // Support User: no modification buttons
  await expect(detailPage.suspendUserButton).not.toBeVisible()
  await expect(detailPage.deactivateUserButton).not.toBeVisible()
})

// ---------------------------------------------------------------------------
// HAPPY PATH — AC-01 (Scenario Outline — Auditor)
// Auditor opens the quick-view: sections visible, all action buttons hidden.
// Design ref: AUDITOR frame line 4684.
// ---------------------------------------------------------------------------

test("Auditor opens User Detail quick-view — sections visible, action buttons hidden (AC-01)", async ({
  auditorPage,
}) => {
  const detailPage = new UserDetailPage(auditorPage)
  await auditorPage.goto("/platform-administration/user-management")
  await auditorPage.waitForLoadState("networkidle")
  await detailPage.openFromFirstRow()

  await expect(detailPage.userDetailDialog).toBeVisible()
  await expect(detailPage.userDetailDialog).toContainText("IDENTITY")
  await expect(detailPage.userDetailDialog).toContainText("ROLE & SCOPE")
  await expect(detailPage.userDetailDialog).toContainText("STATUS")
  // Auditor: no modification buttons
  await expect(detailPage.suspendUserButton).not.toBeVisible()
  await expect(detailPage.deactivateUserButton).not.toBeVisible()
})

// ---------------------------------------------------------------------------
// HAPPY PATH — AC-01 (self-profile sub-rule)
// When the authenticated user searches for their own record and opens the
// quick-view dialog, their own email address must appear in the IDENTITY
// section — guards against cross-user data bleed on self-profile access.
// Design ref: SELF PROFILE - support frame line 10362.
// ---------------------------------------------------------------------------

test("Authenticated user opens their own quick-view — own email visible in IDENTITY section (AC-01)", async ({
  supportPage,
}) => {
  const detailPage = new UserDetailPage(supportPage)
  const ownEmail = process.env.E2E_SUPPORT_USER_EMAIL ?? ""
  await supportPage.goto("/platform-administration/user-management")
  await supportPage.waitForLoadState("networkidle")
  await detailPage.openByEmail(ownEmail)

  await expect(detailPage.userDetailDialog).toBeVisible()
  await expect(detailPage.userDetailDialog).toContainText("IDENTITY")
  await expect(detailPage.userDetailDialog).toContainText("ROLE & SCOPE")
  await expect(detailPage.userDetailDialog).toContainText("STATUS")
  // The dialog must show the support user's own email — not another user's data
  await expect(detailPage.userDetailDialog).toContainText(ownEmail)
})

// ---------------------------------------------------------------------------
// MAIN ERROR — AC-02
// Unauthenticated direct URL access to any User Detail View must be blocked.
// The system must redirect to login and must not expose any profile data.
// Override storageState to gate-only so the app session is absent — without
// this the chromium-authenticated project injects a full user session and the
// route never redirects.
// ---------------------------------------------------------------------------

test.describe("AC-02 — unauthenticated redirect", () => {
  test.use({ storageState: ".auth/gate.json" })

  test("Unauthenticated direct URL access to User Detail View is redirected to login — no profile data exposed (AC-02)", async ({
    page,
  }) => {
    await page.goto("/platform-administration/user-management/test-user-id")
    await page.waitForLoadState("networkidle")

    // Must not remain on the detail route — redirect to login must have occurred
    await expect(page).not.toHaveURL(
      /platform-administration\/user-management\/test-user-id/
    )
    await expect(page).toHaveURL(/login|sign-in|auth/)
    // No user-detail dialog or profile data must be visible after the redirect
    await expect(page.getByRole("dialog")).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// MAIN ERROR — AC-16
// LC Users must see no User Management nav entry, no accessible route,
// and the users API must return 401/403.
// Design ref: SELF PROFILE - LC User frame line 10795.
// ---------------------------------------------------------------------------

test("Leasing Company User sees no User Management navigation entry and is blocked from the User Detail View route (AC-16)", async ({
  lcUserPage,
}) => {
  const detailPage = new UserDetailPage(lcUserPage)

  // 1. Nav must contain no "User management" link
  await expect(detailPage.navUserManagementLink).not.toBeVisible()

  // 2. Direct route access must redirect away — user must not land on the detail view
  await lcUserPage.goto("/platform-administration/user-management/any-user-id")
  await lcUserPage.waitForLoadState("networkidle")
  await expect(lcUserPage).not.toHaveURL(
    /platform-administration\/user-management\/any-user-id/
  )
  // No administration dialog or content must appear
  await expect(lcUserPage.getByRole("dialog")).not.toBeVisible()

  // 3. Users API must return unauthorized for LC users
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const apiResponse = await lcUserPage.request.get(`${apiBase}/api/v1/users`)
  expect([401, 403]).toContain(apiResponse.status())
})
