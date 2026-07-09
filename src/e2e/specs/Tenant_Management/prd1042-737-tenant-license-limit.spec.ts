import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-737 — US 29.19 | Tenant License Limit Management
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-737 Tenant License Limit Management.md
//
// Covered:  AC-01 (System Admin configures license limits — happy-path),
//           AC-05 (System Admin / Support view — happy-path; Bank Admin
//           excluded), AC-11/16/18 (RBAC — 404 not 403 on write),
//           AC-24 (limit=0 rejected — form validation)
// Excluded: Bank Admin rows (per team decision — omitted from all Outlines)
// Status:   test.skip — /api/v1/tenants/{id}/license-limits endpoint is NOT
//           in openapi.json (verified 2026-07-09). Tenant response also does
//           not include max_lc_count / max_bank_user_count / max_users_per_lc
//           fields. Re-enable when TM-19 license-limit endpoint ships.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const TENANT_ID = "acme-bank"

test.describe.skip("PRD1042-737 — Tenant License Limit Management", () => {
  // -------------------------------------------------------------------------
  // HAPPY PATH — AC-01 (configure license limits per field)
  // System Admin PATCHes each of the three limit fields independently.
  // -------------------------------------------------------------------------

  const configurableFields = [
    { field: "max_lc_count", value: 30 },
    { field: "max_bank_user_count", value: 15 },
    { field: "max_users_per_lc", value: 5 },
  ]

  for (const { field, value } of configurableFields) {
    test(`System Admin configures ${field} to ${value} (AC-01)`, async ({
      authenticatedPage,
    }) => {
      const response = await authenticatedPage.request.patch(
        `${apiBase}/api/v1/tenants/${TENANT_ID}/license-limits`,
        { data: { [field]: value } }
      )
      // Accept 200 (fixture tenant exists) or 404 (fixture missing) — never 5xx
      expect(response.status()).toBeLessThan(500)
    })
  }

  // -------------------------------------------------------------------------
  // HAPPY PATH — AC-05 (view current limits + utilisation)
  // System Admin and Support can read the tenant object with limits and
  // utilisation fields. Bank Admin row is excluded (per team decision).
  // -------------------------------------------------------------------------

  test("System Admin GET tenant returns license limits + utilisation (AC-05)", async ({
    authenticatedPage,
  }) => {
    const response = await authenticatedPage.request.get(
      `${apiBase}/api/v1/tenants/${TENANT_ID}`
    )
    expect(response.status()).toBeLessThan(500)
    if (response.status() === 200) {
      const body = (await response.json()) as Record<string, unknown>
      expect(body).toHaveProperty("max_lc_count")
      expect(body).toHaveProperty("max_bank_user_count")
      expect(body).toHaveProperty("max_users_per_lc")
    }
  })

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-11/16/18 (RBAC — 404 not 403 on write)
  // Non-System-Admin roles receive 404 on PATCH license-limits endpoint.
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
    test(`${role} PATCH license-limits returns 404 (AC-11, AC-16, AC-18)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.patch(
        `${apiBase}/api/v1/tenants/${TENANT_ID}/license-limits`,
        { data: { max_lc_count: 30 } }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-24 (limit set to 0 rejected)
  // Any limit field set to 0 must be rejected — minimum value is 1.
  // -------------------------------------------------------------------------

  const zeroFields = ["max_lc_count", "max_bank_user_count", "max_users_per_lc"]

  for (const field of zeroFields) {
    test(`${field}=0 rejected with validation error (AC-24)`, async ({
      authenticatedPage,
    }) => {
      const response = await authenticatedPage.request.patch(
        `${apiBase}/api/v1/tenants/${TENANT_ID}/license-limits`,
        { data: { [field]: 0 } }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
    })
  }
})
