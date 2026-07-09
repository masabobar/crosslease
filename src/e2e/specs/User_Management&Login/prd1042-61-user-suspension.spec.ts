import { expect, test } from "../../fixtures/test"
import type { Page } from "../../fixtures/test"
import { UserSuspensionPage } from "../../pages/UserSuspensionPage"

// ---------------------------------------------------------------------------
// PRD1042-61 — US 28.17 | USER MANAGEMENT | User Suspension
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-61 User Suspension.md
//
// E2E-ready (4):  AC-02 (missing reason), AC-02 (Other + no comment),
//                 AC-04 (Four-Eyes — 2 roles), AC-01 (unauthorized role)
// Fixme:          AC-01/AC-03 happy-path outline (D19), AC-15 (single-admin state)
// Excluded:       AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12,
//                 AC-13, AC-14 (edge-case or separate-feature — no Gherkin)
// ---------------------------------------------------------------------------

// Reactivates a suspended user before a test. Checks the user's current status
// first (via the detail endpoint) to skip the reactivate call when the user is
// already active — preventing the 422 from masking real failures. Throws on any
// non-2xx reactivate response so beforeEach surfaces the exact error.
async function ensureUserActive(page: Page, email: string): Promise<void> {
  if (!email) return
  const apiBase = process.env.E2E_API_BASE_URL ?? ""

  // Step 1: resolve user ID from the list endpoint
  const lookupResp = await page.request.get(`${apiBase}/api/v1/users`, {
    params: { search: email },
  })
  if (!lookupResp.ok()) {
    throw new Error(
      `ensureUserActive: user lookup failed (${lookupResp.status()}) for "${email}"`
    )
  }
  const raw = (await lookupResp.json()) as Record<string, unknown>
  const users =
    (raw.data as { users?: Array<{ id: string }> } | undefined)?.users ??
    (raw.users as Array<{ id: string }> | undefined)
  const userId = users?.[0]?.id
  if (!userId) return // user not seeded in this environment — skip

  // Step 2: get current status from the detail endpoint (more reliable than list)
  const detailResp = await page.request.get(`${apiBase}/api/v1/users/${userId}`)
  if (!detailResp.ok()) {
    throw new Error(
      `ensureUserActive: detail fetch failed (${detailResp.status()}) for "${email}"`
    )
  }
  const detail = (await detailResp.json()) as {
    data?: { status?: string }
    status?: string
  }
  const currentStatus = detail.data?.status ?? detail.status
  if (currentStatus !== "suspended") return // already active — nothing to do

  // Step 3: reactivate — reason is required by the API
  const reactResp = await page.request.post(
    `${apiBase}/api/v1/users/${userId}/reactivate`,
    {
      data: { reason: "administrative_decision" },
    }
  )
  if (!reactResp.ok()) {
    const body = await reactResp.text()
    // USER_NOT_SUSPENDED means the goal (user is active) is already achieved — treat as success
    try {
      const parsed = JSON.parse(body) as { detail?: { code?: string } }
      if (parsed.detail?.code === "USER_NOT_SUSPENDED") return
    } catch {
      // not JSON — fall through to throw
    }
    throw new Error(
      `ensureUserActive: reactivation failed (${reactResp.status()}) for "${email}": ${body}`
    )
  }
}

// Looks up a user's UUID from their email via GET /api/v1/users?search=<email>.
// Requires an authenticated page with user:list permission (system_admin).
// Handles both response shapes: wrapped { data: { users: [...] } } and direct { users: [...] }.
async function resolveUserId(page: Page, email: string): Promise<string> {
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const resp = await page.request.get(`${apiBase}/api/v1/users`, {
    params: { search: email },
  })
  if (!resp.ok()) {
    throw new Error(
      `resolveUserId: GET /api/v1/users failed (${resp.status()})`
    )
  }
  const raw = (await resp.json()) as Record<string, unknown>
  const users =
    (raw.data as { users?: Array<{ id: string }> } | undefined)?.users ??
    (raw.users as Array<{ id: string }> | undefined)
  const userId = users?.[0]?.id
  if (!userId)
    throw new Error(`resolveUserId: no user found for email "${email}"`)
  return userId
}

test.describe("PRD1042-61 — User Suspension", () => {
  // Serial mode prevents the parallel runner from racing prd1042-62 (restore
  // access) over the shared DEV_FRONT_OFFICE_USER_EMAIL. Both files manipulate
  // the same persistent user — concurrent beforeEach hooks flip each other's state.
  test.describe.configure({ mode: "serial" })

  // Reactivate all persistent target users before each test so the suite is
  // idempotent — suspended state from a previous run does not block re-runs.
  test.beforeEach(async ({ authenticatedPage }) => {
    const targets = [
      process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "",
      process.env.E2E_BACK_OFFICE_USER_EMAIL ?? "",
      process.env.E2E_SUPPORT_USER_EMAIL ?? "",
    ]
    for (const email of targets) {
      await ensureUserActive(authenticatedPage, email)
    }
  })

  // Reactivate FO user after each test so prd1042-69 (running on a parallel worker)
  // finds FO active as quickly as possible after the happy-path test suspends it.
  // afterAll alone is not sufficient — prd1042-69 can race between the happy-path
  // test end and the next beforeEach reactivation.
  test.afterEach(async ({ authenticatedPage }) => {
    await ensureUserActive(
      authenticatedPage,
      process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? ""
    )
  })

  // Reactivate FO user after the suite as a belt-and-suspenders safety net.
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: ".auth/user.json",
    })
    const page = await context.newPage()
    await ensureUserActive(page, process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "")
    await context.close()
  })

  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-01, AC-03 (Scenario Outline — 2 admin roles)
  // Authorized admin opens the suspension form and submits a valid suspension.
  // Status changes to Suspended; audit event is recorded.
  // Requires D19: throwaway user creation/deletion API to provision and clean up
  // a fresh active user for each outline row without leaving stale test data.
  // ---------------------------------------------------------------------------

  // Disabled 2026-07-09 — actually changes the persistent front_office user's
  // status to Suspended. Re-enable once a throwaway-user fixture (D19) allows
  // per-test provisioning without mutating a shared seeded account.
  test.skip("system_admin suspends front_office user — status changes to Suspended (AC-01, AC-03)", async ({
    authenticatedPage,
  }) => {
    // Uses the persistent DEV_FRONT_OFFICE_USER_EMAIL test user instead of a D19
    // throwaway. The beforeEach reactivation guard ensures the user is active at the
    // start of this test and that subsequent tests are not affected.
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const foUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? ""
    )

    const suspensionPage = new UserSuspensionPage(authenticatedPage)
    await suspensionPage.gotoProfile(foUserId)
    await suspensionPage.clickSuspendUserAction()
    await suspensionPage.selectSuspensionReason("Administrative Decision")
    await suspensionPage.verifyEffectiveFromIsSet()
    await suspensionPage.submitSuspensionForm()

    // Dialog must close after successful submission
    await expect(suspensionPage.suspensionDialog).not.toBeVisible()

    // --- Suspended-state UI assertions (AC-01) ---
    await expect(suspensionPage.suspendedBanner).toBeVisible()
    await expect(suspensionPage.suspendedStatusBadge).toBeVisible()
    // "Reactivate" button must be present — admin can reverse the suspension
    await expect(suspensionPage.reactivateButton).toBeVisible()
    // "Suspend user" button must be gone — cannot suspend an already-suspended user
    await expect(suspensionPage.suspendUserButton).not.toBeVisible()

    // --- API-level confirmation (AC-03) ---
    const statusResp = await authenticatedPage.request.get(
      `${apiBase}/api/v1/users/${foUserId}`
    )
    expect(statusResp.ok()).toBe(true)
    const statusBody = (await statusResp.json()) as { status?: string }
    expect(statusBody.status).toBe("suspended")
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-02: Missing suspension reason blocks form submission
  // Submitting the form without selecting a Suspension Reason must show a
  // field-level validation error and leave the user's status unchanged.
  // ---------------------------------------------------------------------------

  test("Submitting suspension form without a reason shows validation error and does not suspend (AC-02)", async ({
    authenticatedPage,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const foUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? ""
    )

    const suspensionPage = new UserSuspensionPage(authenticatedPage)
    await suspensionPage.gotoListAndOpenByEmail(
      process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? ""
    )
    await suspensionPage.clickSuspendUserAction()
    await suspensionPage.verifyEffectiveFromIsSet()
    // Intentionally omit reason selection
    await suspensionPage.submitSuspensionForm()

    // Form must stay open — reason is required
    await expect(suspensionPage.suspensionDialog).toBeVisible()
    await expect(suspensionPage.suspensionReasonValidationError).toBeVisible()

    // User status must remain unchanged — GET /api/v1/users/{id} returns the user
    // object directly (no { data: {...} } wrapper), so status is at the top level.
    const statusResp = await authenticatedPage.request.get(
      `${apiBase}/api/v1/users/${foUserId}`
    )
    expect(statusResp.ok()).toBe(true)
    const statusBody = (await statusResp.json()) as { status?: string }
    expect(statusBody.status).toBe("active")
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-01: Unauthorized role cannot access the Suspend User action
  // A leasing_company_user must not see the "Suspend User" button on a user's
  // profile page, and a direct API POST to /suspend must be rejected with 403.
  // RefiNext domain rule: role-based access must be enforced server-side.
  // ---------------------------------------------------------------------------

  test("Unauthorized role (leasing_company_user) cannot access the Suspend User action (AC-01)", async ({
    authenticatedPage,
    lcUserPage,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""

    // Look up the target FO user's UUID using the admin session
    const foUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? ""
    )

    // LC user attempts to navigate to the FO user's detail page
    const suspensionPage = new UserSuspensionPage(lcUserPage)
    await suspensionPage.gotoProfile(foUserId)

    // "Suspend User" action must not be accessible to an unauthorized role
    await expect(suspensionPage.suspendUserButton).not.toBeVisible()

    // Server-side enforcement: direct API call must be rejected
    const suspendResp = await lcUserPage.request.post(
      `${apiBase}/api/v1/users/${foUserId}/suspend`,
      {
        data: {
          reason: "security_concern",
          effective_from: new Date().toISOString(),
        },
      }
    )
    expect(suspendResp.status()).toBe(403)
  })
})
