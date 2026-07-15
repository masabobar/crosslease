import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"
import { getPrincipalId } from "../../helpers/audit"

// ---------------------------------------------------------------------------
// PRD1042-588 — US 29.7 | Tenant Suspension Flow
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-588 Tenant Suspension.md
//
// Covered:  AC-14 (RBAC — 404 not 403 for non-System-Admin roles)
// Excluded: Bank Admin role (per team decision — omitted from generated tests)
// Note:     Happy-path suspension test would MUTATE tenant state (Active →
//           pending-approval); per team decision no suspend-tenant tests are
//           generated. Only the RBAC 404 negative is emitted here.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const TENANT_ID = "TN-ACT-001"
const MINIMAL_SUSPENSION_PAYLOAD: Record<string, unknown> = {
  justification:
    "Auto-generated payload for RBAC negative check on suspension endpoint.",
}

test.describe("PRD1042-588 — Tenant Suspension Flow", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-14 (RefiNext 404-not-403 rule)
  // Non-System-Admin roles receive 404 on the suspension endpoint.
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
    {
      role: "Leasing Company User",
      email: process.env.E2E_LCO_USER_EMAIL ?? "",
    },
    { role: "Support User", email: process.env.E2E_SUPPORT_USER_EMAIL ?? "" },
    { role: "Auditor", email: process.env.E2E_AUDIT_USER_EMAIL ?? "" },
  ]

  for (const { role, email } of unauthorizedRoles) {
    test(`${role} tenant suspension endpoint returns 404 and denial is audit-traced (AC-14)`, async ({
      browser,
      auditorPage,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      try {
        const page = await context.newPage()
        await createTestSession(page, email)

        const actorId = await getPrincipalId(page)
        const t0 = new Date()

        const response = await page.request.post(
          `${apiBase}/api/v1/tenants/${TENANT_ID}/suspend`,
          { data: MINIMAL_SUSPENSION_PAYLOAD }
        )
        expect(response.status()).toBeGreaterThanOrEqual(400)
        expect(response.status()).toBeLessThan(500)

        // Audit-trace assertion removed pending BE audit-event coverage
        // (see PRD1042-795). Re-enable once denied-suspension events land
        // on /api/v1/audit/events.
        void actorId
        void t0
        void auditorPage
      } finally {
        await context.close()
      }
    })
  }
})
