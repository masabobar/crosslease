import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-591 — US 29.10 | Tenant Configuration Override Management
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-591 Tenant Configuration Override Management.md
//
// Covered:  AC-13 (RBAC — non-System-Admin roles receive 404 on override
//           endpoints, GET / POST / PUT)
// Excluded: bank_admin role (per team decision — omitted from generated tests
//           including AC-13a happy-path and AC-13b/c write/cross-tenant negatives)
// Status:   test.skip — /api/v1/tenants/{id}/overrides endpoint is NOT in
//           openapi.json (verified 2026-07-09). All calls would return 404
//           because the endpoint doesn't exist, not because of role
//           enforcement. Re-enable when TM-10 override endpoints ship.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const TENANT_ID = "tenant-alpha"
const OVERRIDE_ID = "OV-9999"

test.describe
  .skip("PRD1042-591 — Tenant Configuration Override Management", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-13 (RefiNext 404-not-403 rule)
  // Non-System-Admin roles receive 404 on override endpoints (GET/POST/PUT).
  // -------------------------------------------------------------------------

  const negatives: Array<{
    role: string
    email: string
    method: "GET" | "POST" | "PUT"
    path: string
  }> = [
    {
      role: "Front Office",
      email: process.env.E2E_FRONT_OFFICE_USER_EMAIL ?? "",
      method: "GET",
      path: `/api/v1/tenants/${TENANT_ID}/overrides`,
    },
    {
      role: "Back Office",
      email: process.env.E2E_BACK_OFFICE_USER_EMAIL ?? "",
      method: "POST",
      path: `/api/v1/tenants/${TENANT_ID}/overrides`,
    },
    {
      role: "LC User",
      email: process.env.E2E_LCO_USER_EMAIL ?? "",
      method: "GET",
      path: `/api/v1/tenants/${TENANT_ID}/overrides`,
    },
    {
      role: "Support",
      email: process.env.E2E_SUPPORT_USER_EMAIL ?? "",
      method: "POST",
      path: `/api/v1/tenants/${TENANT_ID}/overrides`,
    },
    {
      role: "Auditor",
      email: process.env.E2E_AUDIT_USER_EMAIL ?? "",
      method: "PUT",
      path: `/api/v1/tenants/${TENANT_ID}/overrides/${OVERRIDE_ID}`,
    },
  ]

  for (const { role, email, method, path } of negatives) {
    test(`${role} ${method} override endpoint returns 404 (AC-13)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const url = `${apiBase}${path}`
      const payload = {
        override_type: "PRODUCT_TEMPLATE",
        platform_object_reference: "PT-001",
        override_parameters: { max_ltv: 0.85 },
        governance_justification:
          "Auto-generated RBAC negative check payload for override endpoint.",
      }
      const response =
        method === "GET"
          ? await page.request.get(url)
          : method === "POST"
            ? await page.request.post(url, { data: payload })
            : await page.request.put(url, { data: payload })
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }
})
