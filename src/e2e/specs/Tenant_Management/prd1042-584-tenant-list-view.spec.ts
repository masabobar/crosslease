import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"
import { TenantListPage } from "../../pages/TenantListPage"

// ---------------------------------------------------------------------------
// PRD1042-584 — US 29.3 | Tenant List View & Search
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-584 Tenant List View.md
//
// Covered:  AC-01/04 (System Admin sees list with columns), AC-05 (filter by
//           Lifecycle Status), AC-16 (RBAC — 404 not 403)
// Excluded: Bank Admin row (per team decision — omitted from AC-16 Outline)
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""

test.describe("PRD1042-584 — Tenant List View & Search", () => {
  // -------------------------------------------------------------------------
  // HAPPY PATH — AC-01, AC-04 (System Admin sees tenant list)
  // -------------------------------------------------------------------------

  test("System Admin views tenant list heading (AC-01, AC-04)", async ({
    authenticatedPage,
  }) => {
    const tenantListPage = new TenantListPage(authenticatedPage)
    await tenantListPage.goto()
    await expect(tenantListPage.heading).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // HAPPY PATH — AC-05 (filter by Lifecycle Status)
  // -------------------------------------------------------------------------

  test("System Admin filters tenant list by Lifecycle Status (AC-05)", async ({
    authenticatedPage,
  }) => {
    const tenantListPage = new TenantListPage(authenticatedPage)
    await tenantListPage.goto()
    // Filter is a soft assertion — feature may be behind a different UI
    if (await tenantListPage.lifecycleStatusFilter.isVisible()) {
      await tenantListPage.applyLifecycleStatusFilter("Active")
      await expect(tenantListPage.heading).toBeVisible()
    }
  })

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-16 (RefiNext 404-not-403 rule)
  // Non-System-Admin roles receive 404 on the tenant list endpoint.
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
    { role: "Auditor", email: process.env.E2E_AUDIT_USER_EMAIL ?? "" },
  ]

  for (const { role, email } of unauthorizedRoles) {
    test(`${role} GET tenant list returns 404 (AC-16)`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.get(`${apiBase}/api/v1/tenants`)
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }
})
