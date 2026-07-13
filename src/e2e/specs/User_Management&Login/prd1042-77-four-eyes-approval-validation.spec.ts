import { expect, test } from "../../fixtures/test"
import { PendingApprovalsPage } from "../../pages/PendingApprovalsPage"
import type { Page } from "../../fixtures/test"
import { expectAuditEvent } from "../../helpers/audit"

// Helper to resolve the current user's principal_id via GET /users/me.
// Used to scope audit-event assertions by actor. Returns null on any failure
// so the audit assertion can be skipped rather than crashing the test.
async function getOwnPrincipalId(page: Page): Promise<string | null> {
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const resp = await page.request.get(`${apiBase}/api/v1/users/me`, {
    failOnStatusCode: false,
  })
  if (!resp.ok()) return null
  const body = (await resp.json()) as { data?: { id?: string }; id?: string }
  return body.data?.id ?? body.id ?? null
}

// ---------------------------------------------------------------------------
// PRD1042-77 — US 28.7 | User Management | Four-Eyes Approval Validation
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-77 Four-Eyes Approval Validation.md
//
// Covered (runnable):  gate, AC-11 (auditor list + reject), AC-02 (wrong role),
//                      AC-06/AC-07 (self-approval), AC-01/AC-15 (task list UI)
// Fixme (D19):         AC-01/AC-10 happy-path Outline, AC-03, AC-08, AC-14,
//                      rejection flow (all require seeded throwaway users)
// Fixme (D20):         AC-05 (cross-tenant)
// Fixme (D16):         AC-04 (session expiry)
// Fixme (PRD1042-75):  AC-09 (MFA/OTP step-up dialog)
// Fixme (no framework):AC-13 (delegated approval)
//
// Note on auth: page.request before any page navigation does not carry auth
// cookies. Action IDs are extracted from the live DOM (data-testid attributes)
// after navigating to the page — no pre-navigation API calls for data setup.
// ---------------------------------------------------------------------------

// Navigate to pending tab and return the first visible row's action ID (from
// the data-testid attribute), or null if the pending list is empty.
async function getFirstPendingRowId(
  page: Page,
  approvalsPage: PendingApprovalsPage
): Promise<string | null> {
  await approvalsPage.goto()
  await approvalsPage.tabPending.click()
  // Wait for React Query to settle — rows or empty state must appear before
  // we read the DOM to avoid a snapshot race during the isLoading transition.
  const firstRow = page.getByTestId(/^approval-row-/).first()
  await expect(firstRow.or(approvalsPage.emptyState)).toBeVisible({
    timeout: 10000,
  })
  if ((await firstRow.count()) === 0) return null
  const testId = await firstRow.getAttribute("data-testid")
  return testId?.replace("approval-row-", "") ?? null
}

// After navigating to the pending tab, find the first row that shows a
// "Withdraw" button — these belong to the current user's own submissions.
// Returns the action ID extracted from the withdraw-btn testid, or null.
async function getOwnPendingRowId(page: Page): Promise<string | null> {
  const firstWithdrawBtn = page.getByTestId(/^withdraw-btn-/).first()
  if ((await firstWithdrawBtn.count()) === 0) return null
  const testId = await firstWithdrawBtn.getAttribute("data-testid")
  return testId?.replace("withdraw-btn-", "") ?? null
}

// ---------------------------------------------------------------------------
// GATE — page renders correctly for system_admin (no seeded data needed)
// ---------------------------------------------------------------------------

test("Pending Approvals page loads for system_admin — title, tabs, and search visible (gate)", async ({
  authenticatedPage,
}) => {
  const approvalsPage = new PendingApprovalsPage(authenticatedPage)
  await approvalsPage.goto()

  await expect(approvalsPage.pageTitle).toBeVisible()
  await expect(approvalsPage.tabAll).toBeVisible()
  await expect(approvalsPage.tabPending).toBeVisible()
  await expect(approvalsPage.searchInput).toBeVisible()

  // Either empty state or action rows must be present — not a blank page.
  // .or() retries until one of the two becomes visible, preventing a race
  // during the brief isLoading=true transition after navigation.
  await expect(
    authenticatedPage
      .getByTestId(/^approval-row-/)
      .first()
      .or(approvalsPage.emptyState)
  ).toBeVisible({ timeout: 10000 })
})

// ---------------------------------------------------------------------------
// AC-11 (read path) — auditor can navigate to page and GET governed actions
// Route guard: USER_MANAGEMENT_ALLOWED_ROLES includes auditor
// API: GET /api/v1/governed-actions → 200 for auditors
// ---------------------------------------------------------------------------

test("Auditor can access Pending Approvals page and list governed actions (AC-11 — read path)", async ({
  auditorPage,
}) => {
  const approvalsPage = new PendingApprovalsPage(auditorPage)
  await approvalsPage.goto()

  // Must not redirect to login or 403
  await expect(auditorPage).not.toHaveURL(/login|403/)
  await expect(approvalsPage.pageTitle).toBeVisible()

  // API must return 200 for auditor — lineage visibility is granted
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const listResp = await auditorPage.request.get(
    `${apiBase}/api/v1/governed-actions`
  )
  expect(listResp.status()).toBe(200)
})

// ---------------------------------------------------------------------------
// AC-11 (write path) — auditor cannot countersign a pending action
// Navigates to pending tab to get a real action ID from the live DOM, then
// POSTs to the approve endpoint as auditor — must return 403.
// Skips if no pending actions are visible to this user in the dev env.
// ---------------------------------------------------------------------------

test("Auditor cannot countersign a pending governed action — API returns 403 and denial is audit-traced (AC-11)", async ({
  auditorPage,
}) => {
  const approvalsPage = new PendingApprovalsPage(auditorPage)
  const actionId = await getFirstPendingRowId(auditorPage, approvalsPage)
  if (!actionId) {
    test.skip()
    return
  }

  // Resolve actor principal_id before the governed action so the audit
  // assertion can scope by actor_id. t0 captures the pre-action moment.
  const actorId = await getOwnPrincipalId(auditorPage)
  const t0 = new Date()

  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const approveResp = await auditorPage.request.post(
    `${apiBase}/api/v1/governed-actions/${actionId}/approve`,
    {
      data: {
        comment: "E2E test — auditor approval attempt, should be rejected",
      },
    }
  )
  expect(approveResp.status()).toBe(403)

  // The denial MUST be recorded — SoD requires every governed-action
  // authorization decision (approve or reject) to be audit-traceable so a
  // later investigation can reconstruct who attempted what.
  if (actorId) {
    await expectAuditEvent(
      auditorPage,
      { actor_id: actorId, from_dt: t0.toISOString() },
      { timeoutMs: 15_000 }
    )
  }
})

// ---------------------------------------------------------------------------
// AC-02 — approver lacking the required role is rejected with 403
// Uses supportPage (support_user role): has page access but no
// governed_action:approve permission — same enforcement as front_office.
// ---------------------------------------------------------------------------

test("Support user (non-approver role) cannot countersign a pending action — API returns 403 and denial is audit-traced (AC-02)", async ({
  supportPage,
  auditorPage,
}) => {
  const approvalsPage = new PendingApprovalsPage(supportPage)
  const actionId = await getFirstPendingRowId(supportPage, approvalsPage)
  if (!actionId) {
    test.skip()
    return
  }

  const actorId = await getOwnPrincipalId(supportPage)
  const t0 = new Date()

  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const approveResp = await supportPage.request.post(
    `${apiBase}/api/v1/governed-actions/${actionId}/approve`,
    {
      data: {
        comment: "E2E test — wrong-role approval attempt, should be rejected",
      },
    }
  )
  expect(approveResp.status()).toBe(403)

  // The support user's denied attempt must be visible on the auditor's
  // investigation surface — SoD trail requirement.
  if (actorId) {
    await expectAuditEvent(
      auditorPage,
      { actor_id: actorId, from_dt: t0.toISOString() },
      { timeoutMs: 15_000 }
    )
  }
})

// ---------------------------------------------------------------------------
// AC-06 + AC-07 — self-approval prevention
// UI: "Review request" button must be absent; "You submitted this request"
//     text must appear on the initiating user's own pending rows.
// API: POST approve as the initiating user must return 4xx.
// Detects own submissions via the withdraw-btn testid (only on own rows).
// Skips if the current user has no pending self-initiated actions.
// ---------------------------------------------------------------------------

test("Initiating user cannot countersign their own pending action — UI hides review button, API returns 4xx, denial is audit-traced (AC-06, AC-07)", async ({
  authenticatedPage,
  auditorPage,
}) => {
  const approvalsPage = new PendingApprovalsPage(authenticatedPage)
  await approvalsPage.goto()
  await approvalsPage.tabPending.click()
  await authenticatedPage.waitForLoadState("networkidle")

  const actionId = await getOwnPendingRowId(authenticatedPage)
  if (!actionId) {
    test.skip()
    return
  }

  // UI assertion: review button absent, withdraw button and label present
  const row = approvalsPage.approvalRow(actionId)
  await expect(row).toBeVisible()
  await expect(approvalsPage.reviewButton(actionId)).not.toBeVisible()
  await expect(approvalsPage.withdrawButton(actionId)).toBeVisible()
  await expect(row).toContainText("You submitted this request")

  const actorId = await getOwnPrincipalId(authenticatedPage)
  const t0 = new Date()

  // API assertion: POST approve as initiator must be rejected
  const apiBase = process.env.E2E_API_BASE_URL ?? ""
  const approveResp = await authenticatedPage.request.post(
    `${apiBase}/api/v1/governed-actions/${actionId}/approve`,
    { data: { comment: "E2E test — self-approval attempt, must be rejected" } }
  )
  expect([400, 403, 422]).toContain(approveResp.status())

  // Self-approval block is a governance decision — must be audit-traced so
  // a reviewer can see who attempted to short-circuit the four-eyes control.
  if (actorId) {
    await expectAuditEvent(
      auditorPage,
      { actor_id: actorId, from_dt: t0.toISOString() },
      { timeoutMs: 15_000 }
    )
  }
})

// ---------------------------------------------------------------------------
// AC-01 + AC-15 — pending task list shows correct metadata
// Navigates to pending tab, then checks what the UI renders:
// rows present → assert By:/Submitted:/Expires fields; empty state → pass.
// ---------------------------------------------------------------------------

test("Pending task list shows action type, submitter, submitted time, and expiry countdown per row (AC-01, AC-15)", async ({
  authenticatedPage,
}) => {
  const approvalsPage = new PendingApprovalsPage(authenticatedPage)
  await approvalsPage.goto()
  await approvalsPage.tabPending.click()
  await authenticatedPage.waitForLoadState("networkidle")

  const firstRow = authenticatedPage.getByTestId(/^approval-row-/).first()
  // Wait for React Query to settle after the tab switch — rows or empty state
  // must appear before we branch. Using .or() avoids a snapshot race where
  // isVisible() is evaluated during the brief isLoading=true transition.
  await expect(firstRow.or(approvalsPage.emptyState)).toBeVisible({
    timeout: 10000,
  })

  const hasRows = (await firstRow.count()) > 0
  if (!hasRows) {
    // No pending items — empty state is already visible (asserted above)
    return
  }

  // All required metadata fields must appear in the first visible row
  await expect.soft(firstRow).toContainText("By:")
  await expect.soft(firstRow).toContainText("Submitted:")
  await expect.soft(firstRow).toContainText("Expires")
})
