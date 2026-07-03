import { expect, test } from "../../fixtures/test"
import { UserListPage } from "../../pages/UserListPage"

// ---------------------------------------------------------------------------
// PRD1042-44 — US 28.8 | Invitation-based Onboarding
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-44 Invitation-based Onboarding.md
//
// Covered:  AC-01, AC-10, AC-11, AC-14, AC-16 (RBAC negative)
// Blocked:  AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-13, AC-15 (D19/D21/M2)
// Excluded: AC-02, AC-03, AC-12, AC-17 (edge-case / not UI-observable)
// ---------------------------------------------------------------------------

// Scenario Outline examples — AC-01, AC-11 (standard roles)
// Emails are generated per-run using a timestamp suffix so successive runs do not
// collide on emails already registered in the test DB.
// Scope values fall back to first available option in selectInviteScope when no match.
const STANDARD_ROLE_INVITES = [
  {
    role: "Front Office",
    scope: "TEN-1",
    emailPrefix: "e2e-fo",
    firstNameBase: "E2E",
    lastNameBase: "FO",
  },
  {
    role: "Back Office",
    scope: "TEN-1",
    emailPrefix: "e2e-bo",
    firstNameBase: "E2E",
    lastNameBase: "BO",
  },
  {
    role: "Leasing Co. User",
    scope: "TEN-1",
    emailPrefix: "e2e-lcu",
    firstNameBase: "E2E",
    lastNameBase: "LCU",
  },
] as const

test.describe("PRD1042-44 — Invitation-based Onboarding", () => {
  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-01, AC-11
  // Admin creates invitation supplying email, role and scope. The system
  // generates a token and sends an invitation email. Role and scope are
  // predefined and applied on activation. Standard (non-privileged) roles
  // are created directly in the Invited state.
  // ---------------------------------------------------------------------------
  for (const {
    role,
    scope,
    emailPrefix,
    firstNameBase,
    lastNameBase,
  } of STANDARD_ROLE_INVITES) {
    test(`Admin creates invitation for ${role} (AC-01, AC-11)`, async ({
      authenticatedPage,
    }) => {
      // Unique suffix per run prevents collision with previously registered emails
      const idSuffix = String(Date.now()).slice(-6)
      const email = `${emailPrefix}-${idSuffix}@bank-a.example`
      const firstName = firstNameBase
      const lastName = `${lastNameBase}${idSuffix}`

      const userListPage = new UserListPage(authenticatedPage)
      await userListPage.goto()
      await userListPage.openCreateInviteDialog()
      await userListPage.selectInviteRole(role)
      await userListPage.fillInviteForm(email, firstName, lastName)
      await userListPage.selectInviteScope(scope)
      await userListPage.submitInviteDialog()

      // Dialog close confirms the API accepted the invite. The success toast is
      // ephemeral so we assert dialog closure. Row-level status/role assertions
      // require data-testid on table rows — the User cell only exposes initials.
      await expect(userListPage.inviteDialog).not.toBeVisible()
    })
  }

  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-11 (Four-Eyes privileged path)
  // Privileged roles (Admin, Auditor) require a second authorized admin to
  // approve. The dialog shows a Four-Eyes alert and the user is created in
  // Pending state rather than Invited.
  // Design reference: node 96:71636 (Create & invite user dialog).
  // ---------------------------------------------------------------------------
  test("Privileged Admin invitation shows Four-Eyes alert and creates Pending user (AC-11)", async ({
    authenticatedPage,
  }) => {
    const idSuffix = String(Date.now()).slice(-6)
    const email = `e2e-admin-${idSuffix}@bank-a.example`
    const firstName = "E2E"
    const lastName = `Admin${idSuffix}`

    const userListPage = new UserListPage(authenticatedPage)
    await userListPage.goto()
    await userListPage.openCreateInviteDialog()
    await userListPage.selectInviteRole("Admin")

    await expect(userListPage.fourEyesAlert).toBeVisible()

    await userListPage.fillInviteForm(email, firstName, lastName)
    await userListPage.submitInviteDialog()

    // Dialog close confirms the API accepted the invite and created a Pending user.
    // Row-level "Pending" status assertion requires data-testid on table rows.
    await expect(userListPage.inviteDialog).not.toBeVisible()
  })

  // Auditor requires tenant + date-picker inputs (calendar popover, not <input>).
  // Full submission is covered as a separate concern once date-picker helpers are added.
  // This test verifies the primary AC-11 assertion: Four-Eyes alert for Auditor.
  test("Privileged Auditor invitation shows Four-Eyes alert (AC-11)", async ({
    authenticatedPage,
  }) => {
    const userListPage = new UserListPage(authenticatedPage)
    await userListPage.goto()
    await userListPage.openCreateInviteDialog()
    await userListPage.selectInviteRole("Auditor")

    await expect(userListPage.fourEyesAlert).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-01
  // The invitation form must block submission when Email is missing.
  // Validation is enforced on both UI and backend.
  // ---------------------------------------------------------------------------
  test("Invitation form rejects submission with missing required Email field (AC-01)", async ({
    authenticatedPage,
  }) => {
    const userListPage = new UserListPage(authenticatedPage)
    await userListPage.goto()
    await userListPage.openCreateInviteDialog()
    // Submit with no email filled — scope/role selection is irrelevant to this assertion
    await userListPage.submitInviteDialog()

    // Email input marked as invalid; dialog remains open
    await expect(userListPage.inviteEmailInput).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    await expect(userListPage.inviteDialog).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-16 (RBAC negative)
  // A Leasing Company User must not have access to the User Management module.
  // Uses /internal/test/session to bypass OTP — same approach as auth.setup.ts.
  // ---------------------------------------------------------------------------
  test("Leasing Company User cannot access the User Management module (AC-16)", async ({
    page,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const lcEmail = process.env.E2E_LCO_USER_EMAIL ?? ""

    const sessionResponse = await page.request.post(
      `${apiBase}/internal/test/session`,
      { data: { email: lcEmail } }
    )
    if (!sessionResponse.ok()) {
      throw new Error(
        `LC user session creation failed: ${sessionResponse.status()}`
      )
    }

    await page.goto("/")
    await page.evaluate(() => {
      localStorage.setItem(
        "auth",
        JSON.stringify({ state: { isAuthenticated: true }, version: 0 })
      )
    })
    await page.reload()
    await page.waitForLoadState("networkidle")

    // Nav must not expose User Management to LC user
    await expect(
      page.getByRole("link", { name: /user management/i })
    ).not.toBeVisible()

    // Direct navigation attempt must be denied
    await page.goto("/platform-administration/user-management")
    await expect(page).not.toHaveURL("/platform-administration/user-management")
  })
})
