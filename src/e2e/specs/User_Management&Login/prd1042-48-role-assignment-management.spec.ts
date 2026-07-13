import { expect, test } from "../../fixtures/test"
import { UserListPage } from "../../pages/UserListPage"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-48 — US 28.11 | User Management | Role Assignment & Management
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-48 Role Assignment & Management.md
//
// Gherkin updated 2026-07-08 (Ivan Mladenovic decision 2026-07-06): role model
// is now 7 canonical roles (added Power User (Bank Admin) — `bank_admin` wire
// value). Bank user role administration moved from System Admin to Bank Admin.
// See .claude/agent-memory/qa-lead/project-prd1042-48-bank-admin-update.md.
//
// Covered:  AC-01/AC-03 (5-role invite outline + Auditor Four-Eyes alert +
//                        7-role selector count), AC-15, AC-16
// Blocked:  AC-11 (D19)
// Gated:    AC-07/AC-04/AC-10/AC-12/AC-14 (pre-seeded active users or D20)
// Excluded: AC-02, AC-05, AC-06, AC-08, AC-09, AC-13 (edge-case or separate-feature)
//
// Pending automation — 4 new @e2e-ready Gherkin scenarios awaiting seeded
// `bank_admin` credentials (E2E_BANK_ADMIN_EMAIL / _PASSWORD) and, for the
// per-tenant privileged flows, a throwaway-user fixture (D19):
//   1. System Admin cannot change bank tenant user roles (AC-05, AC-07)
//   2. Bank Admin cannot be reached via role reassignment (AC-07, Outline × 6)
//   3. Bank Admin cannot change own tenant scope (AC-14)
//   4. Non-Bank-Admin roles cannot assign/change user roles (AC-05, AC-16, Outline × 5)
//
// Known open bugs:
//   PRD1042-826: Tenant→System promotions retain tenant-level visibility (AC-07/AC-08)
//   PRD1042-828: Auditor validity period enforcement — FIXED (AC-15 is now a regular test)
// ---------------------------------------------------------------------------

// UI role labels confirmed via prd1042-44 invite dialog tests.
// "Support" label may differ from "Support User" — adjust if select fails.
// Auditor is excluded from this loop: date pickers are BaseUI popover buttons
// (not <input>), so .fill() fails. Auditor is covered by a separate test below
// that verifies the Four-Eyes alert without attempting full submission.
const ROLE_INVITES = [
  {
    role: "Front Office",
    emailPrefix: "e2e-48-fo",
    firstName: "E2E",
    lastName: "FO48",
  },
  {
    role: "Back Office",
    emailPrefix: "e2e-48-bo",
    firstName: "E2E",
    lastName: "BO48",
  },
  {
    role: "Leasing Co. User",
    emailPrefix: "e2e-48-lcu",
    firstName: "E2E",
    lastName: "LCU48",
  },
  {
    role: "Support",
    emailPrefix: "e2e-48-sup",
    firstName: "E2E",
    lastName: "SUP48",
  },
  {
    role: "Admin",
    emailPrefix: "e2e-48-adm",
    firstName: "E2E",
    lastName: "ADM48",
  },
] as const

test.describe("PRD1042-48 — Role Assignment & Management", () => {
  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-03
  // The role selector must offer exactly the 7 predefined system roles and no
  // custom or ad-hoc roles. Verified by counting the dropdown options before
  // any role is selected. Post 2026-07-06 realignment: 6 → 7 (added Power User
  // (Bank Admin) — wire value `bank_admin`).
  // ---------------------------------------------------------------------------

  test("Role selector offers exactly 7 predefined system roles (AC-03)", async ({
    authenticatedPage,
  }) => {
    const userListPage = new UserListPage(authenticatedPage)
    await userListPage.goto()
    await userListPage.openCreateInviteDialog()

    const roleCount = await userListPage.countRoleOptions()
    expect(roleCount).toBe(7)
  })

  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-01, AC-03 (Scenario Outline — 5 roles)
  // Admin assigns each of the 5 non-Auditor predefined roles to a new user via
  // the invite dialog. Dialog closure confirms the API accepted the assignment.
  // Admin shows a Four-Eyes alert and creates the user in Pending state.
  // Auditor is covered separately below (date picker constraint).
  // ---------------------------------------------------------------------------

  for (const { role, emailPrefix, firstName, lastName } of ROLE_INVITES) {
    // Disabled 2026-07-09 — actually submits invitation and creates a user in
    // the test DB. Re-enable once a throwaway-user cleanup fixture (D19) exists.
    test.skip(`Admin assigns "${role}" role to a new user — role saved successfully (AC-01, AC-03)`, async ({
      authenticatedPage,
    }) => {
      const idSuffix = String(Date.now()).slice(-6)
      const email = `${emailPrefix}-${idSuffix}@bank-a.example`

      const userListPage = new UserListPage(authenticatedPage)
      await userListPage.goto()
      await userListPage.openCreateInviteDialog()
      await userListPage.selectInviteRole(role)
      await userListPage.fillInviteForm(
        email,
        firstName,
        `${lastName}${idSuffix}`
      )
      await userListPage.trySelectInviteScope("TEN-1")
      await userListPage.submitInviteDialog()

      // Dialog closure confirms the API accepted the role assignment.
      // Row-level role verification requires data-testid on table rows.
      await expect(userListPage.inviteDialog).not.toBeVisible()
    })
  }

  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-01, AC-03 (Auditor role)
  // Auditor date pickers are BaseUI popover buttons, not <input> elements, so
  // .fill() fails on them. Full submission is covered by AC-15 below once
  // calendar interaction helpers are available. This test verifies the
  // Auditor option is selectable and triggers the Four-Eyes alert.
  // ---------------------------------------------------------------------------

  test("Auditor role is available in the selector and shows Four-Eyes approval alert (AC-01, AC-03)", async ({
    authenticatedPage,
  }) => {
    const userListPage = new UserListPage(authenticatedPage)
    await userListPage.goto()
    await userListPage.openCreateInviteDialog()
    await userListPage.selectInviteRole("Auditor")
    await expect(userListPage.fourEyesAlert).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-15 (bug PRD1042-828 FIXED)
  // Auditor is a time-limited role. Saving an Auditor user without an access
  // validity period must be blocked. The dialog must stay open showing a
  // validation error instead of closing.
  // ---------------------------------------------------------------------------

  test("Auditor role without a validity period is blocked — save must be prevented (AC-15)", async ({
    authenticatedPage,
  }) => {
    const idSuffix = String(Date.now()).slice(-6)
    const email = `e2e-48-aud-nodates-${idSuffix}@bank-a.example`

    const userListPage = new UserListPage(authenticatedPage)
    await userListPage.goto()
    await userListPage.openCreateInviteDialog()
    await userListPage.selectInviteRole("Auditor")
    await userListPage.fillInviteForm(email, "E2E", `AudNoDates${idSuffix}`)
    await userListPage.trySelectInviteScope("TEN-1")
    // Intentionally omit date selection — validity period NOT provided
    await userListPage.submitInviteDialog()

    // Dialog must stay open — validity period is required for Auditor
    await expect(userListPage.inviteDialog).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-16
  // Role assignment is server-authoritative. A direct API call that violates
  // the role transition rules must be rejected with 422 regardless of what the
  // client sends. Test uses an invalid transition (system_admin → auditor) which
  // is not in the supported set: system_admin ↔ support_user, front_office ↔ back_office.
  //
  // NOTE: Gherkin AC-16 was updated 2026-07-08 to specify "valid Bank Admin
  // session" as the actor. This test still uses a System Admin session because
  // bank_admin credentials are not yet seeded. The server-side rejection is
  // actor-independent — the 422 fires on the invalid transition regardless of
  // who calls it — so the invariant still holds. Switch to bank_admin once
  // E2E_BANK_ADMIN_EMAIL/PASSWORD are provisioned.
  // ---------------------------------------------------------------------------

  test("Direct API role change violating transition rules is rejected with 422 (AC-16)", async ({
    browser,
  }) => {
    const apiBase = process.env.E2E_API_BASE_URL ?? ""
    const context = await browser.newContext({
      storageState: ".auth/gate.json",
    })
    const page = await context.newPage()
    await createTestSession(page, process.env.E2E_SYSTEM_ADMIN_EMAIL ?? "")

    // Resolve the current user's ID via /users/me
    const meResp = await page.request.get(`${apiBase}/api/v1/users/me`)
    expect(meResp.status()).toBe(200)
    const meBody = await meResp.json()
    const userId = meBody.data?.id as string

    // Attempt an invalid transition: system_admin → auditor (not a supported pair).
    // The server must reject this regardless of client-side controls.
    const changeResp = await page.request.post(
      `${apiBase}/api/v1/users/${userId}/change-role`,
      {
        data: { new_role: "auditor" },
      }
    )
    expect(changeResp.status()).toBe(422)

    const body = await changeResp.json()
    expect(body.detail?.code).toBe("VALIDATION_ERROR")

    await context.close()
  })
})
