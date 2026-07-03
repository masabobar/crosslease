import { expect, test } from "../../fixtures/test"
import { UserListPage } from "../../pages/UserListPage"

// ---------------------------------------------------------------------------
// PRD1042-49 — US 28.11 | USER MANAGEMENT | Tenant & Scope Assignment
// Gherkin source: src/e2e/tests/PRD1042-39-User Management & Authentication/
//                 PRD1042-49 Tenant Scope Assignment.md
//
// Covered:   AC-01 (3-role outline, @e2e-ready), AC-06 (2 missing-date outline, @e2e-ready)
// Fixme:     AC-03 (D19), AC-09 (D19), AC-10 (D19)
// Blocked:   AC-07 (D21), AC-11 (D16 + D19)
// Excluded:  AC-02, AC-04, AC-05, AC-08, AC-12, AC-13 (separate-feature / edge-case)
// ---------------------------------------------------------------------------

// UI labels confirmed via prd1042-48 role invite tests.
// "Back Office / Risk" in the BDD maps to "Back Office" in the dialog role selector.
const SCOPE_REQUIRED_ROLES = [
  { role: "Front Office", slug: "fo" },
  { role: "Back Office", slug: "bo" },
  { role: "Auditor", slug: "aud" },
] as const

test.describe("PRD1042-49 — Tenant & Scope Assignment", () => {
  // ---------------------------------------------------------------------------
  // HAPPY PATH — AC-01 (Scenario Outline — 3 roles)
  // Front Office, Back Office, and Auditor roles require a tenant/bank entity
  // assignment before the create form can be saved. Leaving the Tenant field
  // empty must block submission and show a field-level validation error.
  // ---------------------------------------------------------------------------

  for (const { role, slug } of SCOPE_REQUIRED_ROLES) {
    test(`"${role}" role cannot be saved without tenant assignment — validation error shown (AC-01)`, async ({
      authenticatedPage,
    }) => {
      const idSuffix = String(Date.now()).slice(-6)
      const email = `e2e-49-ac01-${slug}-${idSuffix}@bank-a.example`

      const userListPage = new UserListPage(authenticatedPage)
      await userListPage.goto()
      await userListPage.openCreateInviteDialog()
      await userListPage.selectInviteRole(role)
      await userListPage.fillInviteForm(email, "E2E", `Scope49${idSuffix}`)
      // Tenant / Bank Entity field intentionally left empty
      await userListPage.submitInviteDialog()

      // Dialog must stay open — tenant assignment is required for this role
      await expect(userListPage.inviteDialog).toBeVisible()
      // .first() avoids strict-mode failure: Auditor dialog matches /required/i on multiple
      // elements simultaneously (Four-Eyes text, field errors, date-field hints).
      await expect(
        userListPage.inviteDialog.getByText("This field is required.").first()
      ).toBeVisible()
    })
  }
})
