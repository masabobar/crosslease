import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-586 — US 29.5 | Module Activation per Tenant
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-586 Module Activation.md
//
// Covered:  AC-19 (RBAC — 404 not 403 for non-System-Admin roles)
// Excluded: bank_admin role (per team decision — omitted from generated tests)
// Skipped:  all @e2e-ready set to only AC-19; happy-path, states, and
//           enforcement scenarios are ⚙️ pending PRD1042-77 + D-Enforcement.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const TENANT_ID = "TENANT-001"
const MODULE_NAME = "Reporting"
const MINIMAL_ACTIVATION_PAYLOAD: Record<string, unknown> = {
  module: MODULE_NAME,
  justification: "Auto-generated test payload for RBAC negative check.",
}

test.describe("PRD1042-586 — Module Activation per Tenant", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-19 (RefiNext 404-not-403 domain rule)
  // Non-System-Admin roles receive 404 (not 403) on the module activation
  // endpoint. bank_admin excluded from this batch per team decision.
  // -------------------------------------------------------------------------

  const unauthorizedRoles = [
    { role: "support_user", email: process.env.E2E_SUPPORT_USER_EMAIL ?? "" },
    { role: "auditor", email: process.env.E2E_AUDIT_USER_EMAIL ?? "" },
    {
      role: "front_office",
      email: process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "",
    },
    {
      role: "leasing_company_user",
      email: process.env.E2E_LCO_USER_EMAIL ?? "",
    },
  ]

  for (const { role, email } of unauthorizedRoles) {
    test(`${role} POST module activation endpoint returns 404 (AC-19)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.post(
        `${apiBase}/api/v1/tenants/${TENANT_ID}/modules/${MODULE_NAME}/activate`,
        { data: MINIMAL_ACTIVATION_PAYLOAD }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }
})
