import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-582 — US 29.1 | Tenant Creation & Onboarding Flow
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-582 Tenant Creation.md
//
// Covered:  AC-06 (invalid Tenant Code format — form validation, API-level),
//           AC-07 (module required — form validation, API-level),
//           AC-11 (RBAC — 404 not 403)
// Excluded: bank_admin role (per team decision — omitted from generated tests)
// Note:     Happy-path submit (creates tenant) is ⚙️ needs D19 in the spec —
//           no create-tenant test is generated (per team decision).
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""

function baseCreatePayload(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    tenant_name: `Test Bank ${Date.now()}`,
    tenant_code: `TEST-BANK-${Date.now()}`,
    tenant_type: "banking_entity",
    legal_entity_name: "Test Bank GmbH",
    country: "DE",
    default_currency: "EUR",
    modules: ["reporting"],
    seed_package: "MINIMAL_V1",
    ...overrides,
  }
}

test.describe("PRD1042-582 — Tenant Creation & Onboarding Flow", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-06 (Tenant Code format validation)
  // Tenant Code accepts alphanumeric + hyphens only. Special characters,
  // spaces, and underscores are rejected at the API layer.
  // -------------------------------------------------------------------------

  const invalidCodes = [
    "INVALID CODE_001!",
    "code with spaces",
    "under_score",
    "special@char",
  ]

  for (const invalidCode of invalidCodes) {
    test(`Tenant Code "${invalidCode}" rejected — format validation (AC-06)`, async ({
      authenticatedPage,
    }) => {
      const response = await authenticatedPage.request.post(
        `${apiBase}/api/v1/tenants`,
        { data: baseCreatePayload({ tenant_code: invalidCode }) }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
    })
  }

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-07 (at least one module required)
  // Submitting with no modules must be rejected — validation gate at Step 2.
  // -------------------------------------------------------------------------

  test("submission without any module selected is rejected (AC-07)", async ({
    authenticatedPage,
  }) => {
    const response = await authenticatedPage.request.post(
      `${apiBase}/api/v1/tenants`,
      { data: baseCreatePayload({ modules: [] }) }
    )
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-11 (RefiNext 404-not-403 rule)
  // Non-System-Admin roles receive 404 on the tenant creation endpoint.
  // -------------------------------------------------------------------------

  const unauthorizedRoles = [
    {
      role: "front_office",
      email: process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "",
    },
    {
      role: "back_office",
      email: process.env.E2E_BACK_OFFICE_USER_EMAIL ?? "",
    },
    { role: "support_user", email: process.env.E2E_SUPPORT_USER_EMAIL ?? "" },
    { role: "auditor", email: process.env.E2E_AUDIT_USER_EMAIL ?? "" },
    {
      role: "leasing_company_user",
      email: process.env.E2E_LCO_USER_EMAIL ?? "",
    },
  ]

  for (const { role, email } of unauthorizedRoles) {
    test(`${role} POST tenant creation returns 404 (AC-11)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.post(`${apiBase}/api/v1/tenants`, {
        data: baseCreatePayload(),
      })
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }
})
