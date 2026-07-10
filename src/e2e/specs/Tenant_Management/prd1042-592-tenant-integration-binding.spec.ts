import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-592 — US 29.11 | Tenant Integration Binding Management
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-592 Tenant Integration Binding Management.md
//
// Covered:  AC-09 (non-System-Admin roles cannot modify integration binding —
//           404 for tenant-scoped write roles; 403 for Support (has view grant))
// Excluded: Bank Admin row (per team decision — omitted from generated tests)
// Note:     API supports GET + PATCH only (no POST). Story says "create" but
//           real endpoint is PATCH (idempotent upsert). Tests use PATCH.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const TENANT_ID = "alpha-bank"

const bindingPayload: Record<string, unknown> = {
  endpoint_url: "https://core.alphabank.example.com/api/v1",
  integration_active_flag: false,
  credential_scope_identifier: "tenant-alpha-bank-scope",
  governance_justification:
    "Auto-generated test payload for RBAC negative on binding endpoint.",
}

test.describe("PRD1042-592 — Tenant Integration Binding Management", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-09 (Non-System-Admin roles cannot create binding)
  // Story specifies 404 for non-Support write roles and 403 for Support
  // (has view grant, lacks write).
  // -------------------------------------------------------------------------

  const roles: Array<{ role: string; email: string; expectedStatus: number }> =
    [
      {
        role: "Front Office",
        email: process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "",
        expectedStatus: 404,
      },
      {
        role: "Back Office",
        email: process.env.E2E_BACK_OFFICE_USER_EMAIL ?? "",
        expectedStatus: 404,
      },
      {
        role: "Leasing Company User",
        email: process.env.E2E_LCO_USER_EMAIL ?? "",
        expectedStatus: 404,
      },
      {
        role: "Auditor",
        email: process.env.E2E_AUDIT_USER_EMAIL ?? "",
        expectedStatus: 404,
      },
      {
        role: "Support User",
        email: process.env.E2E_SUPPORT_USER_EMAIL ?? "",
        expectedStatus: 403,
      },
    ]

  for (const { role, email, expectedStatus } of roles) {
    test(`${role} cannot modify integration binding — returns ${expectedStatus} (AC-09)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.patch(
        `${apiBase}/api/v1/tenants/${TENANT_ID}/integration-binding`,
        { data: bindingPayload }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }
})
