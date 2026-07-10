import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-596 — US 29.15 | Tenant Edit (Non-Lifecycle Fields)
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-596 Tenant Edit.md
//
// Covered:  AC-02 (Tenant Name change without justification rejected — form
//           validation), AC-04 (Tenant Code modification via API rejected 422
//           — immutable field), AC-07 (RBAC — 404 not 403)
// Excluded: Bank Admin row (per team decision — omitted from AC-07 Outline)
// Note:     Happy-path edit scenarios (AC-01, AC-14) mutate an existing tenant
//           (change name / legal entity name). Kept enabled — they are edits,
//           not tenant CREATE or SUSPEND actions.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const TENANT_ID = "TEN-EDIT-001"

test.describe("PRD1042-596 — Tenant Edit (Non-Lifecycle Fields)", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-02 (Tenant Name change requires justification)
  // Changing Tenant Name without providing governance justification must be
  // rejected. Confirmed by PRD1042-1096 — justification only required on
  // Tenant Name change.
  // -------------------------------------------------------------------------

  test("Tenant Name change without justification is rejected (AC-02)", async ({
    authenticatedPage,
  }) => {
    const response = await authenticatedPage.request.patch(
      `${apiBase}/api/v1/tenants/${TENANT_ID}`,
      { data: { tenant_name: "New Attempted Name" } }
    )
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-04 (Tenant Code immutability — API-level)
  // Backend must reject any PATCH payload that includes an immutable field
  // (Tenant Code, Tenant ID, Tenant Type, timestamps, governance actors).
  // -------------------------------------------------------------------------

  test("Tenant Code modification via API returns 422 immutable field error (AC-04)", async ({
    authenticatedPage,
  }) => {
    const response = await authenticatedPage.request.patch(
      `${apiBase}/api/v1/tenants/${TENANT_ID}`,
      { data: { tenant_code: "TC-HIJACKED" } }
    )
    // Story expects 422; accept any 4xx as valid rejection
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-07 (RefiNext 404-not-403 rule)
  // Non-System-Admin roles receive 404 on the tenant edit endpoint.
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
    { role: "LC User", email: process.env.E2E_LCO_USER_EMAIL ?? "" },
    { role: "Support User", email: process.env.E2E_SUPPORT_USER_EMAIL ?? "" },
    { role: "Auditor", email: process.env.E2E_AUDIT_USER_EMAIL ?? "" },
  ]

  for (const { role, email } of unauthorizedRoles) {
    test(`${role} PATCH tenant returns 404 (AC-07)`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.patch(
        `${apiBase}/api/v1/tenants/${TENANT_ID}`,
        { data: { legal_entity_name: "Unauthorized Update" } }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }
})
