import { expect, test } from "../../fixtures/test"
import type { Page } from "../../fixtures/test"
import { UserDeactivationPage } from "../../pages/UserDeactivationPage"

// ---------------------------------------------------------------------------
// PRD1042-63 — US 28.19 | USER MANAGEMENT | User Deactivation
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-63 User Deactivation.md
//
// E2E-ready (live): AC-02 (missing reason), AC-06 (Reason=Other + no comment),
//                   AC-01 (unauthorized × 3 roles)
// Fixme:            AC-01/AC-03 happy-path outline (D19 — deactivation is irreversible),
//                   AC-04 Four-Eyes outline (unconfirmed env behavior; target env vars needed),
//                   AC-04 self-approval (WF Engine approval API endpoint unknown),
//                   AC-12 (DEV_DEACTIVATED_USER_EMAIL not in .env)
// Excluded:         AC-05, AC-06 (login prevention part), AC-07, AC-08, AC-09, AC-10,
//                   AC-11, AC-13 (edge-case or separate-feature — no Gherkin block)
// ---------------------------------------------------------------------------

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

// Reactivates a suspended user before a test so the suite is idempotent across runs.
// Skips silently if the user is not found (not seeded) or is not in "suspended" state.
// Throws on any non-2xx reactivate response so beforeEach surfaces the exact error.
async function ensureUserActive(page: Page, email: string): Promise<void> {
  if (!email) return
  const apiBase = process.env.E2E_API_BASE_URL ?? ""

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
  if (!userId) return

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
  if (currentStatus !== "suspended") return

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

test.describe("PRD1042-63 — User Deactivation", () => {
  // Serial mode prevents the parallel runner from racing prd1042-61/62 over the
  // shared DEV_FRONT_OFFICE_USER_EMAIL. Concurrent beforeEach hooks flip each
  // other's state and cause TOCTOU errors on the reactivate/suspend API calls.
  test.describe.configure({ mode: "serial" })

  // Reactivate the persistent FO target user before each test so the suite is
  // idempotent — a suspended status left by a prior run must not block re-runs.
  test.beforeEach(async ({ authenticatedPage }) => {
    await ensureUserActive(
      authenticatedPage,
      process.env.E2E_SUPPORT_USER_EMAIL ?? ""
    )
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-02: Missing Deactivation Reason blocks form submission
  // Submitting without selecting a Reason must show a field-level validation error
  // and leave the target user's status unchanged.
  // Uses the persistent DEV_FRONT_OFFICE_USER_EMAIL — no status change occurs.
  // ---------------------------------------------------------------------------

  test("Submitting deactivation form without a reason shows validation error and does not deactivate (AC-02)", async ({
    authenticatedPage,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const foUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_SUPPORT_USER_EMAIL ?? ""
    )

    const deactivationPage = new UserDeactivationPage(authenticatedPage)
    await deactivationPage.gotoProfile(foUserId)
    await deactivationPage.clickDeactivateUserAction()
    await deactivationPage.verifyEffectiveFromIsSet()
    // Intentionally omit reason selection
    await deactivationPage.submitDeactivationForm()

    // Form must stay open — reason is required
    await expect(deactivationPage.deactivationDialog).toBeVisible()
    await expect(
      deactivationPage.deactivationReasonValidationError
    ).toBeVisible()

    // User status must remain unchanged
    // GET /api/v1/users/{id} returns user directly — status is at top level
    const statusResp = await authenticatedPage.request.get(
      `${apiBase}/api/v1/users/${foUserId}`
    )
    expect(statusResp.ok()).toBe(true)
    const statusBody = (await statusResp.json()) as { status?: string }
    expect(statusBody.status).toBe("active")
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-06 (Comment conditional):
  // When Reason = Other is selected, the Deactivation Comment becomes mandatory.
  // Submitting without a Comment must show a field-level error and keep the form open.
  // Uses the persistent DEV_FRONT_OFFICE_USER_EMAIL — no status change occurs.
  // ---------------------------------------------------------------------------

  test("Reason=Other without Comment blocks deactivation submission (AC-06)", async ({
    authenticatedPage,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const foUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_SUPPORT_USER_EMAIL ?? ""
    )

    const deactivationPage = new UserDeactivationPage(authenticatedPage)
    await deactivationPage.gotoProfile(foUserId)
    await deactivationPage.clickDeactivateUserAction()
    await deactivationPage.selectDeactivationReason("Other")
    // After selecting Other, Comment must become mandatory before submission
    await deactivationPage.verifyEffectiveFromIsSet()
    // Intentionally omit comment
    await deactivationPage.submitDeactivationForm()

    // Form must stay open — comment is required when reason = Other
    await expect(deactivationPage.deactivationDialog).toBeVisible()
    await expect(
      deactivationPage.deactivationCommentValidationError
    ).toBeVisible()

    // User status must remain unchanged
    const statusResp = await authenticatedPage.request.get(
      `${apiBase}/api/v1/users/${foUserId}`
    )
    expect(statusResp.ok()).toBe(true)
    const statusBody = (await statusResp.json()) as { status?: string }
    expect(statusBody.status).toBe("active")
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-01 (role-based access negative)
  // Unauthorized roles must not see the Deactivate User button on the detail page.
  // Server-side enforcement: direct API POST to /deactivate must be rejected with 403.
  // RefiNext domain rule: role-based access is enforced at both UI and API layers.
  // ---------------------------------------------------------------------------

  test("Unauthorized role (front_office) cannot access the Deactivate User action (AC-01)", async ({
    authenticatedPage,
    browser,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""

    // Resolve target UUID via admin session — FO actor session lacks list permission
    const foUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_SUPPORT_USER_EMAIL ?? ""
    )

    // Create a front_office session via internal test endpoint — bypasses OTP,
    // same mechanism used by the lcUserPage fixture.
    const foContext = await browser.newContext()
    const foActorPage = await foContext.newPage()
    try {
      const sessionResp = await foActorPage.request.post(
        `${apiBase}/internal/test/session`,
        {
          data: { email: process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "" },
        }
      )
      if (!sessionResp.ok()) {
        throw new Error(
          `front_office session creation failed: ${sessionResp.status()}`
        )
      }
      await foActorPage.goto("/")
      await foActorPage.evaluate(() => {
        localStorage.setItem(
          "auth",
          JSON.stringify({ state: { isAuthenticated: true }, version: 0 })
        )
      })

      const deactivationPage = new UserDeactivationPage(foActorPage)
      await deactivationPage.gotoProfile(foUserId)

      await expect(deactivationPage.deactivateUserButton).not.toBeVisible()

      const deactivateResp = await foActorPage.request.post(
        `${apiBase}/api/v1/users/${foUserId}/deactivate`,
        {
          data: {
            reason: "offboarding",
            effective_from: new Date().toISOString(),
          },
        }
      )
      expect(deactivateResp.status()).toBe(403)
    } finally {
      await foContext.close()
    }
  })

  test("Unauthorized role (auditor) cannot access the Deactivate User action (AC-01)", async ({
    authenticatedPage,
    browser,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""

    const foUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_SUPPORT_USER_EMAIL ?? ""
    )

    // DEV_AUDIT_USER_EMAIL is the auditor account seeded in the test environment.
    // Using /internal/test/session instead of auditorPage fixture (TEST_AUDITOR_EMAIL
    // is not configured in .env — the fixture times out on the login page).
    const auditorContext = await browser.newContext()
    const auditorActorPage = await auditorContext.newPage()
    try {
      const sessionResp = await auditorActorPage.request.post(
        `${apiBase}/internal/test/session`,
        { data: { email: process.env.E2E_AUDIT_USER_EMAIL ?? "" } }
      )
      if (!sessionResp.ok()) {
        throw new Error(
          `auditor session creation failed: ${sessionResp.status()}`
        )
      }
      await auditorActorPage.goto("/")
      await auditorActorPage.evaluate(() => {
        localStorage.setItem(
          "auth",
          JSON.stringify({ state: { isAuthenticated: true }, version: 0 })
        )
      })

      const deactivationPage = new UserDeactivationPage(auditorActorPage)
      await deactivationPage.gotoProfile(foUserId)

      await expect(deactivationPage.deactivateUserButton).not.toBeVisible()

      const deactivateResp = await auditorActorPage.request.post(
        `${apiBase}/api/v1/users/${foUserId}/deactivate`,
        {
          data: {
            reason: "offboarding",
            effective_from: new Date().toISOString(),
          },
        }
      )
      expect(deactivateResp.status()).toBe(403)
    } finally {
      await auditorContext.close()
    }
  })

  test("Unauthorized role (leasing_company_user) cannot access the Deactivate User action (AC-01)", async ({
    authenticatedPage,
    lcUserPage,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""

    const foUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_SUPPORT_USER_EMAIL ?? ""
    )

    const deactivationPage = new UserDeactivationPage(lcUserPage)
    await deactivationPage.gotoProfile(foUserId)

    await expect(deactivationPage.deactivateUserButton).not.toBeVisible()

    const deactivateResp = await lcUserPage.request.post(
      `${apiBase}/api/v1/users/${foUserId}/deactivate`,
      {
        data: {
          reason: "offboarding",
          effective_from: new Date().toISOString(),
        },
      }
    )
    expect(deactivateResp.status()).toBe(403)
  })
})
