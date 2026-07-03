import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"
import { UserProvisioningPage } from "../../pages/UserProvisioningPage"

// Minimal well-formed payload used for unauthorized-role rejection tests.
// The auth/RBAC check runs before payload validation, so any syntactically valid
// body is sufficient to trigger the 403 response from the server.
const MINIMAL_VALID_PAYLOAD: Record<string, unknown> = {
  first_name: "Test",
  last_name: "User",
  email: "provision.test@bank.example",
  role: "front_office",
  tenant_id: null,
}

test.describe("PRD1042-59 — User Provisioning", () => {
  // ---------------------------------------------------------------------------
  // MAIN ERROR — AC-11 (RefiNext role-access domain rule)
  // Only Power User / System Admin may call POST /api/v1/users.
  // Auditor and Support User receive 403 regardless of the payload.
  // ---------------------------------------------------------------------------

  const unauthorizedRoles = [
    { role: "Auditor", email: process.env.E2E_AUDIT_USER_EMAIL ?? "" },
    { role: "Support User", email: process.env.E2E_SUPPORT_USER_EMAIL ?? "" },
  ]

  for (const { role, email } of unauthorizedRoles) {
    test(`${role} POST /api/v1/users returns 403 — unauthorized to provision users (AC-11)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const provisioningPage = new UserProvisioningPage(page)
      const { status } = await provisioningPage.postCreateUser(
        MINIMAL_VALID_PAYLOAD
      )
      expect(status).toBe(403)
      await context.close()
    })
  }
})
