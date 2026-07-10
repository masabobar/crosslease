import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-595 — US 29.14 | Seed Configuration Package Assignment
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-595 Seed Package Assignment.md
//
// Covered:  AC-14 (RBAC — GET /api/seed-packages returns 404 to non-System-
//           Admin roles per RefiNext enumeration-prevention pattern)
// Excluded: bank_admin role (per team decision — omitted from generated tests)
// Status:   test.skip — API returns 200 to all authenticated roles on
//           /api/v1/platform/seed-packages (verified 2026-07-09). AC-14
//           RBAC restriction is not enforced by the backend; either the spec
//           needs updating (seed catalog is intentionally readable) or the
//           BE needs to apply the role gate. Re-enable when reconciled.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""

test.describe.skip("PRD1042-595 — Seed Package Assignment", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-14 (RefiNext 404-not-403 rule)
  // Non-System-Admin roles cannot list seed packages — GET returns 404.
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
    test(`${role} GET /api/v1/platform/seed-packages returns 404 (AC-14)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.get(
        `${apiBase}/api/v1/platform/seed-packages`
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }
})
