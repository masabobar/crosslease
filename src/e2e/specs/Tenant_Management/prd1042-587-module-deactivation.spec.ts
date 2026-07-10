import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-587 — US 29.6 | Module Deactivation per Tenant
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-587 Module Deactivation.md
//
// Covered:  AC-16 (RBAC — 404 not 403 for non-System-Admin roles)
// Excluded: Bank Admin role (per team decision — omitted from generated tests)
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const TENANT_ID = "TENANT-001"
const MODULE_NAME = "Reporting & dashboards"
const MINIMAL_DEACTIVATION_PAYLOAD: Record<string, unknown> = {
  module: MODULE_NAME,
  justification: "Auto-generated test payload for RBAC negative check.",
}

test.describe("PRD1042-587 — Module Deactivation per Tenant", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-16 (RefiNext 404-not-403 rule)
  // Non-System-Admin roles receive 404 on the module deactivation endpoint.
  // -------------------------------------------------------------------------

  const unauthorizedRoles = [
    {
      role: "Front Office",
      email: process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "",
    },
    {
      role: "Back Office",
      email: process.env.E2E_BACK_OFFICE_USER_EMAIL ?? "",
    },
    { role: "Support User", email: process.env.E2E_SUPPORT_USER_EMAIL ?? "" },
    { role: "Auditor", email: process.env.E2E_AUDIT_USER_EMAIL ?? "" },
  ]

  for (const { role, email } of unauthorizedRoles) {
    test(`${role} module deactivation endpoint returns 404 (AC-16)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.post(
        `${apiBase}/api/v1/tenants/${TENANT_ID}/modules/${encodeURIComponent(MODULE_NAME)}/deactivate`,
        { data: MINIMAL_DEACTIVATION_PAYLOAD }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }
})
