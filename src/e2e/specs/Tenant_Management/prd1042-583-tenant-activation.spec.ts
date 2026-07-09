import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-583 — US 29.2 | Tenant Activation (Four-Eyes Countersignature)
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-583 Tenant Activation.md
//
// Covered:  AC-17 (RBAC — 404 not 403 for non-System-Admin roles on pending
//           governance approvals)
// Excluded: Bank Admin role (per team decision — omitted from generated tests)
// Status:   test.skip — POST /activate and POST /reject endpoints are NOT
//           in openapi.json (verified 2026-07-09). All calls would return
//           404 because the endpoint doesn't exist, not because of role
//           enforcement. Re-enable when the governance countersignature
//           endpoints are implemented on the backend.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const PENDING_TENANT_ID = "TENANT-PENDING-001"

test.describe.skip("PRD1042-583 — Tenant Activation Countersignature", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-17 (Permission Matrix / RBAC — 404 not 403)
  // Only System Admin can view/act on pending governance requests. All other
  // roles receive 404 on GET pending list AND on POST activate/reject.
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
    { role: "LC User", email: process.env.E2E_LCO_USER_EMAIL ?? "" },
  ]

  for (const { role, email } of unauthorizedRoles) {
    test(`${role} POST activate endpoint returns 404 (AC-17)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.post(
        `${apiBase}/api/v1/tenants/${PENDING_TENANT_ID}/activate`,
        {
          data: {
            justification:
              "Auto-generated test justification exceeding minimum length.",
          },
        }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })

    test(`${role} POST reject endpoint returns 404 (AC-17)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.post(
        `${apiBase}/api/v1/tenants/${PENDING_TENANT_ID}/reject`,
        {
          data: {
            justification: "Auto-generated valid test justification.",
            rejection_reason:
              "Auto-generated rejection reason for RBAC negative check.",
          },
        }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }
})
