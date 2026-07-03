import { expect, test } from "../../fixtures/test"
import type { Page } from "../../fixtures/test"
import { UserResendInvitationPage } from "../../pages/UserResendInvitationPage"

// ---------------------------------------------------------------------------
// PRD1042-67 — US 28.23 | USER MANAGEMENT | Resend Invitation
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-67 Resend Invitation.md
// API: POST /api/v1/users/{id}/resend-invitation { reason: ResendReason }
// ResendReason enum: invitation_expired | not_received | user_request |
//                    administrative_action | other
//
// E2E-ready (live): AC-02 (Resend button absent for active user),
//                   AC-08 (API rejects resend for active user — server-authoritative)
// Fixme D19:        AC-01 happy-path (invited user needed), AC-02 suspended/deactivated/expired,
//                   AC-03 old link invalidated (D19 + token capture),
//                   AC-06 preserves scope (D19),
//                   AC-11 cross-tenant 404 (D19 + D20 — second bank tenant)
// Fixme blocked:    AC-05 (email delivery infra), AC-09 (single-active-token, token capture),
//                   AC-10 (token replay, token capture), AC-13 (throttle reset endpoint)
// Excluded:         AC-04, AC-07, AC-12, AC-15 (edge-case), AC-14 (separate-feature)
// ---------------------------------------------------------------------------

// Looks up a user's UUID from their email via GET /api/v1/users?search=<email>.
// Handles both response shapes: { data: { users: [...] } } and { users: [...] }.
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

test.describe("PRD1042-67 — Resend Invitation", () => {
  // Reactivate the persistent FO target user before each test so any suspended
  // state left by prior test runs does not affect the active-user assertions.
  test.beforeEach(async ({ authenticatedPage }) => {
    await ensureUserActive(
      authenticatedPage,
      process.env.E2E_SUPPORT_USER_EMAIL ?? ""
    )
  })

  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-01 (Scenario Outline — 2 Resend Reason variants)
  // Admin resends invitation to an eligible "invited" user; user stays in
  // "invited" state and Invitation Sent Date refreshes.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-02: Resend Invitation is blocked for ineligible lifecycle states
  //
  // Active user (live): DEV_FRONT_OFFICE_USER_EMAIL is active after beforeEach reactivation.
  // The Resend Invitation button must not appear on their profile page (UI gate),
  // and a direct API call must be rejected (server-side gate).
  //
  // Suspended / Deactivated / Expired (fixme): require D19-provisioned users
  // in the specific lifecycle state.
  // ---------------------------------------------------------------------------

  test("Resend Invitation button is not visible for an Active user (AC-02)", async ({
    authenticatedPage,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const foUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_SUPPORT_USER_EMAIL ?? ""
    )

    const resendPage = new UserResendInvitationPage(authenticatedPage)
    await resendPage.gotoProfile(foUserId)

    // "Resend Invitation" action must not appear — user is not in "invited" state
    await expect(resendPage.resendInvitationButton).not.toBeVisible()

    // User must remain "active" — no state mutation from this navigation
    // GET /api/v1/users/{id} returns user directly — status is at top level
    const statusResp = await authenticatedPage.request.get(
      `${apiBase}/api/v1/users/${foUserId}`
    )
    expect(statusResp.ok()).toBe(true)
    const statusBody = (await statusResp.json()) as { status?: string }
    expect(statusBody.status).toBe("active")
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-08: Backend rejects a manipulated resend-invitation request
  // The active FO user is an ineligible target (not in "invited" state).
  // A direct API call must be rejected server-side regardless of the UI guard.
  // ---------------------------------------------------------------------------

  test("Backend rejects resend-invitation API call for an Active user (AC-08)", async ({
    authenticatedPage,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const foUserId = await resolveUserId(
      authenticatedPage,
      process.env.E2E_SUPPORT_USER_EMAIL ?? ""
    )

    // Direct API call — bypasses the UI lifecycle-state guard
    const resendResp = await authenticatedPage.request.post(
      `${apiBase}/api/v1/users/${foUserId}/resend-invitation`,
      { data: { reason: "administrative_action" } }
    )

    // Server must reject — lifecycle state guard is server-authoritative (AC-08)
    expect(resendResp.ok()).toBe(false)

    // Response must not expose internal invitation token values
    const responseBody = (await resendResp.json()) as Record<string, unknown>
    expect(Object.keys(responseBody)).not.toContain("invitation_token")
    expect(Object.keys(responseBody)).not.toContain("token")

    // User status must remain "active" — no side-effect from rejected call
    const statusResp = await authenticatedPage.request.get(
      `${apiBase}/api/v1/users/${foUserId}`
    )
    expect(statusResp.ok()).toBe(true)
    const statusBody = (await statusResp.json()) as { status?: string }
    expect(statusBody.status).toBe("active")
  })
})
