import { test, expect } from "../fixtures/test"
import { SecureLogoutPage } from "../pages/SecureLogoutPage"
import { createTestSession } from "../helpers/helper"

test.describe("PRD1042-69 — Secure Logout", () => {
  // ---------------------------------------------------------------------------
  // AC-01: Logout control visible and accessible for all roles
  // Profile button (header-profile-button) opens a dropdown containing the
  // logout button (header-logout-button). Tested per available role.
  // ---------------------------------------------------------------------------

  test("logout control is visible for system_admin (AC-01)", async ({
    authenticatedPage,
  }) => {
    const logoutPage = new SecureLogoutPage(authenticatedPage)
    await authenticatedPage.goto("platform-administration/user-management")
    await expect(logoutPage.profileButton).toBeVisible()
    await logoutPage.openProfileMenu()
    await expect(logoutPage.logoutButton).toBeVisible()
  })

  test("logout control is visible for front_office (AC-01)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_FRONT_OFFICE_USER_EMAIL ?? "")
    const logoutPage = new SecureLogoutPage(page)
    await expect(logoutPage.profileButton).toBeVisible()
    await logoutPage.openProfileMenu()
    await expect(logoutPage.logoutButton).toBeVisible()
    await context.close()
  })

  test("logout control is visible for back_office_risk (AC-01)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_BACK_OFFICE_USER_EMAIL ?? "")
    const logoutPage = new SecureLogoutPage(page)
    await expect(logoutPage.profileButton).toBeVisible()
    await logoutPage.openProfileMenu()
    await expect(logoutPage.logoutButton).toBeVisible()
    await context.close()
  })

  test("logout control is visible for support_user (AC-01)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_SUPPORT_USER_EMAIL ?? "")
    const logoutPage = new SecureLogoutPage(page)
    await expect(logoutPage.profileButton).toBeVisible()
    await logoutPage.openProfileMenu()
    await expect(logoutPage.logoutButton).toBeVisible()
    await context.close()
  })

  test("logout control is visible for auditor (AC-01)", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_AUDIT_USER_EMAIL ?? "")
    const logoutPage = new SecureLogoutPage(page)
    await expect(logoutPage.profileButton).toBeVisible()
    await logoutPage.openProfileMenu()
    await expect(logoutPage.logoutButton).toBeVisible()
    await context.close()
  })

  test("logout control is visible for leasing_company_user (AC-01)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_LCO_USER_EMAIL ?? "", "/lc")
    const logoutPage = new SecureLogoutPage(page)
    await expect(logoutPage.profileButton).toBeVisible()
    await logoutPage.openProfileMenu()
    await expect(logoutPage.logoutButton).toBeVisible()
    await context.close()
  })

  // ---------------------------------------------------------------------------
  // AC-01, AC-04: Successful logout redirects to /login; back-nav protection
  // Logout uses navigate(PATHS.LOGIN, { replace: true }) so /landing page is
  // replaced in history. Direct navigation to /landing page after logout must be
  // caught by the route guard and redirect back to /login.
  // ---------------------------------------------------------------------------

  // Isolated session — parallel token tests call POST /auth/logout which
  // invalidates the shared user.json session server-side. This test must own
  // its session so the race does not corrupt it.
  test("successful logout redirects to login and blocks re-entry (AC-01, AC-04)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_USER_EMAIL ?? "")

    const logoutPage = new SecureLogoutPage(page)
    await page.goto("/platform-administration/user-management")
    await expect(page).toHaveURL("/platform-administration/user-management")

    await logoutPage.logout()
    await page.waitForURL("/login")
    await expect(page).toHaveURL("/login")

    // Route guard must redirect an unauthenticated direct navigation to protected route
    await page.goto("/platform-administration/user-management")
    await page.waitForURL("/login")
    await expect(page).toHaveURL("/login")

    await context.close()
  })

  // ---------------------------------------------------------------------------
  // AC-02, AC-03: Access token invalidated server-side after logout
  // Captures session cookies before logout, then replays them in a fresh
  // context. Backend must return 401 — confirming server-side invalidation,
  // not just client-side cookie clearing.
  // ---------------------------------------------------------------------------

  // Isolated session — parallel logout tests invalidate the shared user.json
  // session server-side; each test that calls logout must own its session.
  test("access token is rejected after logout (AC-02, AC-03)", async ({
    browser,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_USER_EMAIL ?? "")

    await page.goto("/platform-administration/user-management")
    await page.waitForURL("/platform-administration/user-management")

    // Confirm session is active
    const activeResp = await page.request.get(`${apiBase}/api/v1/users/me`)
    expect(activeResp.status()).toBe(200)

    // Capture session cookies before invalidation
    const cookies = await context.cookies()

    // Logout — server invalidates the session
    await page.request.post(`${apiBase}/api/v1/auth/logout`)

    // Replay stale cookies in an isolated context to confirm server-side rejection
    const staleContext = await browser.newContext()
    await staleContext.addCookies(cookies)
    const staleResp = await staleContext.request.get(
      `${apiBase}/api/v1/users/me`
    )
    expect(staleResp.status()).toBe(401)

    await staleContext.close()
    await context.close()
  })

  // ---------------------------------------------------------------------------
  // AC-03: Refresh token invalidated after logout
  // After logout the refresh token must not allow obtaining a new access token,
  // closing the token-rotation re-entry path.
  // ---------------------------------------------------------------------------

  test("refresh token is rejected after logout (AC-03)", async ({
    browser,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.DEV_USER_EMAIL ?? "")

    await page.goto("/platform-administration/user-management")
    await page.waitForURL("/platform-administration/user-management")

    // Capture cookies (includes the refresh token cookie) before invalidation
    const cookies = await context.cookies()

    // Logout — server invalidates all tokens for this session
    await page.request.post(`${apiBase}/api/v1/auth/logout`)

    // Attempt token rotation with the stale refresh token
    const staleContext = await browser.newContext()
    await staleContext.addCookies(cookies)
    const refreshResp = await staleContext.request.post(
      `${apiBase}/api/v1/auth/refresh-token`
    )
    expect(refreshResp.status()).toBe(401)

    await staleContext.close()
    await context.close()
  })

  // ---------------------------------------------------------------------------
  // AC-09: Logout from all devices — pending UI implementation
  // Backend: POST /api/v1/auth/logout-all is ready.
  // Pending: "Logout from all devices" UI not yet implemented in Header / profile settings.
  // ---------------------------------------------------------------------------

  test("logout from all devices invalidates all active sessions (AC-09)", async () => {
    // Backend POST /api/v1/auth/logout-all is implemented.
    // UI trigger in profile/security settings panel not yet built in Header.tsx.
    test.fixme()
  })
})
