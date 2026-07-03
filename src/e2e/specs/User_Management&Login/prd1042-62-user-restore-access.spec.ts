import { expect, test } from "../../fixtures/test"
import type { Page } from "../../fixtures/test"
import { UserRestoreAccessPage } from "../../pages/UserRestoreAccessPage"

// ---------------------------------------------------------------------------
// PRD1042-62 — US 28.18 | USER MANAGEMENT | User Restore Access
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-62 User Restore Access.md
//
// Active (2):  AC-01/AC-05 happy path (system_admin), AC-12 unauthorized role
// Fixme:       AC-01/AC-05 outline row 2 (power_user — role not in UserRole enum),
//              AC-01 "Other" comment validation, AC-06a Four-Eyes (2 roles),
//              AC-06a self-approval, AC-02 non-suspended (4 statuses — D19)
// Excluded:    AC-03, AC-04, AC-06b, AC-07, AC-08, AC-09, AC-10, AC-11
//              (edge-case or separate-feature — no Gherkin)
// ---------------------------------------------------------------------------

// Suspends a user via API if they are not already suspended. Checks status
// first via the detail endpoint to avoid sending a redundant suspend call.
// Throws on any non-2xx response so beforeEach surfaces the exact API error.
async function ensureUserSuspended(page: Page, email: string): Promise<void> {
  if (!email) return
  const apiBase = process.env.E2E_API_BASE_URL ?? ""

  const lookupResp = await page.request.get(`${apiBase}/api/v1/users`, {
    params: { search: email },
  })
  if (!lookupResp.ok()) {
    throw new Error(
      `ensureUserSuspended: user lookup failed (${lookupResp.status()}) for "${email}"`
    )
  }
  const raw = (await lookupResp.json()) as Record<string, unknown>
  const users =
    (raw.data as { users?: Array<{ id: string }> } | undefined)?.users ??
    (raw.users as Array<{ id: string }> | undefined)
  const userId = users?.[0]?.id
  if (!userId) return // user not seeded in this environment — skip

  const detailResp = await page.request.get(`${apiBase}/api/v1/users/${userId}`)
  if (!detailResp.ok()) {
    throw new Error(
      `ensureUserSuspended: detail fetch failed (${detailResp.status()}) for "${email}"`
    )
  }
  const detail = (await detailResp.json()) as {
    data?: { status?: string }
    status?: string
  }
  const currentStatus = detail.data?.status ?? detail.status
  if (currentStatus === "suspended") return // already suspended — nothing to do

  // POST /suspend requires reason + effective_from (ISO datetime)
  const suspendResp = await page.request.post(
    `${apiBase}/api/v1/users/${userId}/suspend`,
    {
      data: {
        reason: "administrative_decision",
        effective_from: new Date().toISOString(),
      },
    }
  )
  if (!suspendResp.ok()) {
    const body = await suspendResp.text()
    // USER_ALREADY_SUSPENDED means the goal is achieved — treat as success
    try {
      const parsed = JSON.parse(body) as { detail?: { code?: string } }
      if (parsed.detail?.code === "USER_ALREADY_SUSPENDED") return
    } catch {
      // not JSON — fall through to throw
    }
    throw new Error(
      `ensureUserSuspended: suspension failed (${suspendResp.status()}) for "${email}": ${body}`
    )
  }
}

// Reactivates a suspended user. Idempotent — skips if already active.
async function ensureUserActive(page: Page, email: string): Promise<void> {
  if (!email) return
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const lookupResp = await page.request.get(`${apiBase}/api/v1/users`, {
    params: { search: email },
  })
  if (!lookupResp.ok()) return
  const raw = (await lookupResp.json()) as Record<string, unknown>
  const users =
    (raw.data as { users?: Array<{ id: string }> } | undefined)?.users ??
    (raw.users as Array<{ id: string }> | undefined)
  const userId = users?.[0]?.id
  if (!userId) return
  const detailResp = await page.request.get(`${apiBase}/api/v1/users/${userId}`)
  if (!detailResp.ok()) return
  const detail = (await detailResp.json()) as {
    data?: { status?: string }
    status?: string
  }
  const currentStatus = detail.data?.status ?? detail.status
  if (currentStatus !== "suspended") return
  const reactResp = await page.request.post(
    `${apiBase}/api/v1/users/${userId}/reactivate`,
    { data: { reason: "administrative_decision" } }
  )
  if (!reactResp.ok()) {
    const body = await reactResp.text()
    try {
      const parsed = JSON.parse(body) as { detail?: { code?: string } }
      if (parsed.detail?.code === "USER_NOT_SUSPENDED") return
    } catch {
      /* not JSON */
    }
  }
}

// Looks up a user's UUID from their email via GET /api/v1/users?search=<email>.
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

test.describe("PRD1042-62 — User Restore Access", () => {
  // Serial mode prevents the parallel runner from racing prd1042-61 (suspension)
  // over the shared DEV_FRONT_OFFICE_USER_EMAIL. Both files manipulate the same
  // persistent user — concurrent beforeEach hooks flip each other's state.
  test.describe.configure({ mode: "serial" })

  // Ensure BO user is active before each test (idempotent cleanup from prior run).
  // Suspension is done inline at the start of each test that requires it, keeping
  // the suspended window to the test body only — minimising cross-file race risk
  // with prd1042-69 which reads BO user state for logout visibility checks.
  test.beforeEach(async ({ authenticatedPage }) => {
    await ensureUserActive(
      authenticatedPage,
      process.env.E2E_BACK_OFFICE_USER_EMAIL ?? ""
    )
  })

  // Reactivate BO user after each test so other files (e.g. prd1042-69) running
  // on parallel workers find the user active immediately after the test completes.
  test.afterEach(async ({ authenticatedPage }) => {
    await ensureUserActive(
      authenticatedPage,
      process.env.E2E_BACK_OFFICE_USER_EMAIL ?? ""
    )
  })

  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-01, AC-05 (system_admin row of Scenario Outline)
  // system_admin opens the Restore Access form on a Suspended user, selects a
  // reason, submits, and the user transitions to Active.
  // Uses the persistent DEV_BACK_OFFICE_USER_EMAIL test user. The beforeEach
  // suspension guard ensures the user is Suspended at test start.
  // ---------------------------------------------------------------------------

  test("system_admin reactivates suspended back_office user — status changes to Active (AC-01, AC-05)", async ({
    authenticatedPage,
  }) => {
    // Suspend BO user inline — keeps the suspension window to this test body only,
    // minimising cross-file race risk with prd1042-69.
    await ensureUserSuspended(
      authenticatedPage,
      process.env.E2E_BACK_OFFICE_USER_EMAIL ?? ""
    )

    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const boUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_BACK_OFFICE_USER_EMAIL ?? ""
    )

    const restorePage = new UserRestoreAccessPage(authenticatedPage)
    await restorePage.gotoProfile(boUserId)
    await restorePage.clickReactivate()
    await restorePage.selectRestoreReason("Suspension Period Ended")
    await restorePage.submitRestoreForm()

    // Dialog must close after successful submission
    await expect(restorePage.restoreAccessDialog).not.toBeVisible()

    // --- Active-state UI assertions (AC-01) ---
    await expect(restorePage.activeStatusBadge).toBeVisible()
    await expect(restorePage.reactivateButton).not.toBeVisible()
    await expect(restorePage.suspendButton).toBeVisible()

    // --- API-level confirmation (AC-05) ---
    // GET /api/v1/users/{id} returns the user object directly — status is at top level.
    const statusResp = await authenticatedPage.request.get(
      `${apiBase}/api/v1/users/${boUserId}`
    )
    expect(statusResp.ok()).toBe(true)
    const statusBody = (await statusResp.json()) as { status?: string }
    expect(statusBody.status).toBe("active")
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-12: Unauthorized role cannot initiate Restore Access
  // A leasing_company_user must not see the "Reactivate" button on a user's
  // profile page, and a direct API POST to /reactivate must be rejected with 403.
  // RefiNext domain rule: role-based access must be enforced server-side.
  // ---------------------------------------------------------------------------

  test("unauthorized role (leasing_company_user) cannot initiate Restore Access (AC-12)", async ({
    authenticatedPage,
    lcUserPage,
  }) => {
    // Suspend BO user inline — keeps the suspension window to this test body only.
    await ensureUserSuspended(
      authenticatedPage,
      process.env.E2E_BACK_OFFICE_USER_EMAIL ?? ""
    )

    const apiBase = process.env.E2E_API_BASE_URL ?? ""

    // Look up the target BO user's UUID using the admin session
    const boUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_BACK_OFFICE_USER_EMAIL ?? ""
    )

    // LC user navigates to the suspended BO user's detail page
    const restorePage = new UserRestoreAccessPage(lcUserPage)
    await restorePage.gotoProfile(boUserId)

    // "Reactivate" action must not be accessible to an unauthorized role
    await expect(restorePage.reactivateButton).not.toBeVisible()

    // Server-side enforcement: direct API call must be rejected
    const reactivateResp = await lcUserPage.request.post(
      `${apiBase}/api/v1/users/${boUserId}/reactivate`,
      {
        data: { reason: "administrative_decision" },
      }
    )
    expect(reactivateResp.status()).toBe(403)
  })
})
