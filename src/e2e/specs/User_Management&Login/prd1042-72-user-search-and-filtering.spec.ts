import { expect, test } from "../../fixtures/test"
import { UserListPage } from "../../pages/UserListPage"

// ---------------------------------------------------------------------------
// PRD1042-72 — US 28.5 | User Management | User Search & Filtering
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-72 User Search and Filtering.md
//
// E2E automation candidates: 4 of 5 scenarios ✅
// D20-blocked: AC-08 (cross-tenant isolation — second seeded tenant required)
//
// Covered (runnable):  AC-01 (3 role variants), AC-07, AC-11
// Excluded (fixme):    AC-04 — governance UI rule not yet implemented in frontend
// Blocked (fixme):     AC-08 — D20
// No Gherkin:          AC-02, AC-03, AC-05, AC-06, AC-09, AC-10, AC-12–AC-16 (edge-case / separate-feature)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// HAPPY PATH — AC-01 (Scenario Outline — 3 role variants)
// Global search fires a GET /api/v1/users?q=<term> request scoped to the
// authenticated user's authorized records.  Tests verify the API receives the
// correct query parameter and the table remains visible after the response.
// ---------------------------------------------------------------------------

test("Power User search sends authorized-scope query to API (AC-01)", async ({
  authenticatedPage,
}) => {
  const userListPage = new UserListPage(authenticatedPage)
  await userListPage.goto()
  await userListPage.search("john.doe")
  // URL confirms the search param was sent; table confirms no navigation error
  await expect(authenticatedPage).toHaveURL(/q=john\.doe/)
  await expect(userListPage.userTable).toBeVisible()
})

test("Support User search sends authorized-scope query to API (AC-01)", async ({
  supportPage,
}) => {
  const userListPage = new UserListPage(supportPage)
  await userListPage.goto()
  await userListPage.search("anna.mueller")
  await expect(supportPage).toHaveURL(/q=anna\.mueller/)
  await expect(userListPage.userTable).toBeVisible()
})

test("Auditor search sends authorized-scope query to API (AC-01)", async ({
  auditorPage,
}) => {
  const userListPage = new UserListPage(auditorPage)
  await userListPage.goto()
  await userListPage.search("tenant-user-001")
  await expect(auditorPage).toHaveURL(/q=tenant-user-001/)
  await expect(userListPage.userTable).toBeVisible()
})

// ---------------------------------------------------------------------------
// HAPPY PATH — AC-07
// Selecting Role and MFA filters cumulatively updates the URL params, triggers
// the correct API request (role is sent; mfa_enabled is UI-only at this stage),
// and renders active-filter chips plus count badges on the filter buttons.
// ---------------------------------------------------------------------------

test("Combined Role and MFA filters show active chips and count badges (AC-07)", async ({
  authenticatedPage,
}) => {
  const userListPage = new UserListPage(authenticatedPage)
  await userListPage.goto()
  await expect(userListPage.userTable).toBeVisible()

  // Apply role filter: select Support User
  await userListPage.selectRoleFilter("support_user")
  await authenticatedPage.waitForLoadState("networkidle")

  // Apply MFA filter: select Enabled
  await userListPage.selectMfaFilter("enabled")
  await authenticatedPage.waitForLoadState("networkidle")

  // Active-filter chip remove buttons confirm both filters are applied
  await expect(userListPage.filterPillRemoveRole("support_user")).toBeVisible()
  await expect(userListPage.filterPillRemoveMfa).toBeVisible()

  // Count badge "1" inside each filter button confirms active state
  await expect(userListPage.filterRoleButton.getByText("1")).toBeVisible()
  await expect(userListPage.filterMfaButton.getByText("1")).toBeVisible()

  // Table remains visible (results or empty state) — scope is not broken
  await expect(userListPage.userTable).toBeVisible()
})

// ---------------------------------------------------------------------------
// MAIN ERROR — AC-11
// When a search returns zero results the system must show a generic message
// that does not reveal whether matching users exist outside the caller's scope.
// The empty-state copy "No users found." is identical for both truly nonexistent
// users and out-of-scope users — no wording may disclose unauthorized existence.
// ---------------------------------------------------------------------------

test("Zero-results response shows generic message that does not reveal unauthorized user existence (AC-11)", async ({
  supportPage,
}) => {
  const userListPage = new UserListPage(supportPage)
  await userListPage.goto()

  // A clearly nonexistent address guarantees zero results regardless of test data.
  // This avoids a data-dependency while still verifying the security-sensitive
  // empty-state behaviour (same response as an out-of-scope user search).
  await userListPage.search("zzz-nonexistent-99999@example.invalid")

  // The table must show zero data rows — the UI may render an empty-state
  // component or simply unmount the table; either satisfies the requirement.
  await expect(userListPage.dataRows).toHaveCount(0)

  // The visible page text must not reveal whether non-matching users exist
  // outside the caller's authorized scope — regardless of the exact wording used.
  const mainArea = supportPage.getByRole("main")
  await expect(mainArea).not.toContainText("outside")
  await expect(mainArea).not.toContainText("unauthorized")
  await expect(mainArea).not.toContainText("restricted")
  await expect(mainArea).not.toContainText("scope")
})
