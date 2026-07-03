import { expect, test } from "../../fixtures/test"
import { SecureLogoutPage } from "../../pages/SecureLogoutPage"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-47 — US 28.10 | User Management | Session Management
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-47 Session Management.md
//
// Covered:  AC-04, AC-05, AC-06 (×2)
// Blocked:  AC-02 (D20 — second Bank Tenant B not seeded)
// Excluded: AC-01, AC-03, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13
//           (separate-feature or edge-case — see scope filter table in .md)
// ---------------------------------------------------------------------------

test.describe("PRD1042-47 — Session Management", () => {
  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-04
  // When a session has expired server-side, any navigation to a protected route
  // must redirect the user to /login. Server-side expiry is simulated by
  // intercepting all /api/v1/ responses with 401. The auth client detects the
  // 401, attempts a token refresh (also intercepted with 401), then clears
  // isAuthenticated and performs a client-side redirect to /login.
  // Note: D16 (TEST_TOKEN_TTL_SECONDS env override) is not available — mocking
  // 401 responses is the practical equivalent for E2E purposes.
  // ---------------------------------------------------------------------------

  test("Expired session redirects user to login page on any navigation attempt (AC-04)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.E2E_SYSTEM_ADMIN_EMAIL ?? "")

    // Simulate server-side session expiry: intercept all API v1 calls with 401.
    // The auth interceptor will retry the refresh token endpoint (also 401),
    // then clear isAuthenticated and redirect to /login client-side.
    await page.route("**/api/v1/**", route =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          detail: { code: "INVALID_TOKEN", message: "Session expired" },
        }),
      })
    )

    await page.goto("/platform-administration/user-management")
    await expect(page).toHaveURL("/login")

    await context.close()
  })

  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-05
  // The logout action must immediately terminate the session. After clicking
  // logout, the user must be redirected to /login and the session must be
  // invalidated server-side so that any subsequent API call is rejected.
  // Cross-spec note: prd1042-69-secure-logout.spec.ts covers this flow in
  // detail (AC-01/AC-04 of that story). This test traces the same behaviour
  // from the PRD1042-47 Session Management story perspective.
  // ---------------------------------------------------------------------------

  test("User clicks logout and session is terminated immediately (AC-05)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.E2E_SYSTEM_ADMIN_EMAIL ?? "")

    const logoutPage = new SecureLogoutPage(page)
    await page.goto("/platform-administration/user-management")
    await expect(page).toHaveURL("/platform-administration/user-management")

    await logoutPage.logout()

    await expect(page).toHaveURL("/login")

    await context.close()
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-06 (post-logout access)
  // After logout the session is terminated. Any attempt to directly access a
  // protected route must be blocked by the route guard and redirected to /login.
  // ---------------------------------------------------------------------------

  test("After logout, accessing a protected resource requires re-authentication (AC-06)", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.E2E_SYSTEM_ADMIN_EMAIL ?? "")

    const logoutPage = new SecureLogoutPage(page)
    await page.goto("/platform-administration/user-management")
    await logoutPage.logout()
    await expect(page).toHaveURL("/login")

    // Direct URL navigation to a protected resource post-logout must be denied
    await page.goto("/platform-administration/user-management")
    await expect(page).toHaveURL("/login")

    await context.close()
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-06 (token replay)
  // After logout, a previously valid session token replayed in a fresh context
  // must be rejected with 401 — confirming server-side invalidation rather than
  // client-side cookie clearing only.
  // ---------------------------------------------------------------------------

  test("After logout, replaying the invalidated session token is rejected (AC-06)", async ({
    browser,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.E2E_SYSTEM_ADMIN_EMAIL ?? "")

    await page.goto("/platform-administration/user-management")
    await expect(page).toHaveURL("/platform-administration/user-management")

    // Confirm session is active before logout
    const activeResp = await page.request.get(`${apiBase}/api/v1/users/me`)
    expect(activeResp.status()).toBe(200)

    // Capture session cookies (HTTP-only) before invalidation
    const cookies = await context.cookies()

    // Logout — server invalidates the session for all captured tokens
    await page.request.post(`${apiBase}/api/v1/auth/logout`)

    // Replay stale cookies in an isolated context — must be rejected server-side
    const staleContext = await browser.newContext()
    await staleContext.addCookies(cookies)
    const staleResp = await staleContext.request.get(
      `${apiBase}/api/v1/users/me`
    )
    expect(staleResp.status()).toBe(401)

    await staleContext.close()
    await context.close()
  })
})
