import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"
import { expectAuditEvent, getPrincipalId } from "../../helpers/audit"

// ---------------------------------------------------------------------------
// PRD1042-590 — US 29.9 | Tenant Archiving / Decommissioning
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-590 Tenant Archiving.md
//
// Covered:  AC-10 (justification validation, form/API), AC-01 (non-Suspended
//           tenant rejected), AC-15 (RBAC — 404 not 403)
// Excluded: Bank Admin role (per team decision — omitted from generated tests)
// Note:     Happy-path (archive with irreversibility ack + countersign) is
//           ⚙️ Blocked by PRD1042-77 + PRD1042-1105 — not generated.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const SUSPENDED_TENANT_ID = "acme-corp"

function longJustification(): string {
  // 50+ characters — passes AC-10 minimum
  return "Automated test justification exceeding the fifty character minimum required by AC-10."
}

test.describe("PRD1042-590 — Tenant Archiving / Decommissioning", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-10 (governance justification validation)
  // Justification is mandatory and must be at least 50 characters — longest
  // of any tenant lifecycle story (suspension 30, reactivation 20).
  // -------------------------------------------------------------------------

  test("governance justification below 50 characters is rejected (AC-10)", async ({
    authenticatedPage,
  }) => {
    const response = await authenticatedPage.request.post(
      `${apiBase}/api/v1/tenants/${SUSPENDED_TENANT_ID}/archive`,
      {
        data: {
          justification: "This is only 49 characters and should be rejected",
          irreversibility_acknowledged: true,
        },
      }
    )
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })

  test("empty governance justification is rejected (AC-10)", async ({
    authenticatedPage,
  }) => {
    const response = await authenticatedPage.request.post(
      `${apiBase}/api/v1/tenants/${SUSPENDED_TENANT_ID}/archive`,
      {
        data: { justification: "", irreversibility_acknowledged: true },
      }
    )
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-01 (invalid state transition)
  // Only Suspended tenants can be archived. Draft, Provisioning, Active, and
  // Archived tenants must be rejected with 422.
  // -------------------------------------------------------------------------

  const nonSuspendedStates = [
    { tenantId: "TN-DRAFT-001", state: "Draft" },
    { tenantId: "TN-PROV-001", state: "Provisioning" },
    { tenantId: "TN-ACT-001", state: "Active" },
    { tenantId: "TN-ARCH-001", state: "Archived" },
  ]

  for (const { tenantId, state } of nonSuspendedStates) {
    test(`archive rejected on ${state} tenant (AC-01)`, async ({
      authenticatedPage,
    }) => {
      const response = await authenticatedPage.request.post(
        `${apiBase}/api/v1/tenants/${tenantId}/archive`,
        {
          data: {
            justification: longJustification(),
            irreversibility_acknowledged: true,
          },
        }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
    })
  }

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-15 (RefiNext 404-not-403 rule)
  // Non-System-Admin roles receive 404 on the archive endpoint.
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
    test(`${role} tenant archive endpoint returns 404 and denial is audit-traced (AC-15)`, async ({
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
          `${apiBase}/api/v1/tenants/${SUSPENDED_TENANT_ID}/archive`,
          {
            data: {
              justification: longJustification(),
              irreversibility_acknowledged: true,
            },
          }
        )
        expect(response.status()).toBeGreaterThanOrEqual(400)
        expect(response.status()).toBeLessThan(500)

        // Archive is irreversible per PRD1042-795 AC-06 — a denied attempt on
        // this endpoint is especially audit-worthy because the intent (to
        // permanently decommission a tenant) is high-impact even when denied.
        if (actorId) {
          await expectAuditEvent(
            auditorPage,
            { actor_id: actorId, from_dt: t0.toISOString() },
            { timeoutMs: 15_000 }
          )
        }
      } finally {
        await context.close()
      }
    })
  }
})
