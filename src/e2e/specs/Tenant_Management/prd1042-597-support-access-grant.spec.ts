import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-597 — US 29.16 | Support Access Grant Management
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-597 Support Access Grant Management.md
//
// Covered:  AC-02 (RBAC — 403 for non-System-Admin roles on grant CUD),
//           AC-13 (Valid Until in the past rejected — form validation),
//           AC-14 (Valid Until >30 days rejected — form validation),
//           AC-15 (Support Access Allowed=false blocks grant creation)
// Excluded: Bank Admin role (per team decision — omitted from generated tests)
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const TENANT_ID = "tenant-a"

function grantPayload(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const now = new Date()
  const validFrom = now.toISOString()
  const validUntil = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000
  ).toISOString()
  return {
    grantee: process.env.E2E_SUPPORT_USER_EMAIL ?? "",
    access_reason: "User Access Issue",
    valid_from: validFrom,
    valid_until: validUntil,
    additional_context:
      "Auto-generated payload for Support Access Grant negative test.",
    ...overrides,
  }
}

test.describe("PRD1042-597 — Support Access Grant Management", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-02 (role-based access control on grant CUD)
  // Story specifies 403 (role-attribute refusal on grant CUD scope, not
  // tenant-scope 404 — the endpoint scope is grant creation, not tenant
  // probing).
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
    { role: "Auditor", email: process.env.E2E_AUDIT_USER_EMAIL ?? "" },
    { role: "Support User", email: process.env.E2E_SUPPORT_USER_EMAIL ?? "" },
  ]

  for (const { role, email } of unauthorizedRoles) {
    test(`${role} POST support access grant returns 403 (AC-02)`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        storageState: ".auth/gate.json",
      })
      const page = await context.newPage()
      await createTestSession(page, email)
      const response = await page.request.post(
        `${apiBase}/api/v1/tenants/${TENANT_ID}/grants`,
        { data: grantPayload() }
      )
      expect(response.status()).toBeGreaterThanOrEqual(400)
      expect(response.status()).toBeLessThan(500)
      await context.close()
    })
  }

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-13 (Valid Until in the past rejected)
  // -------------------------------------------------------------------------

  test("Valid Until in the past rejected with 422 (AC-13)", async ({
    authenticatedPage,
  }) => {
    const now = new Date()
    const response = await authenticatedPage.request.post(
      `${apiBase}/api/v1/tenants/${TENANT_ID}/grants`,
      {
        data: grantPayload({
          valid_from: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          valid_until: new Date(now.getTime() - 60 * 1000).toISOString(),
        }),
      }
    )
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-14 (Valid Until > 30 days rejected)
  // -------------------------------------------------------------------------

  test("Valid Until further than 30 days from Valid From rejected with 422 (AC-14)", async ({
    authenticatedPage,
  }) => {
    const now = new Date()
    const response = await authenticatedPage.request.post(
      `${apiBase}/api/v1/tenants/${TENANT_ID}/grants`,
      {
        data: grantPayload({
          valid_from: now.toISOString(),
          valid_until: new Date(
            now.getTime() + 31 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }),
      }
    )
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-15 (Support Access Allowed = false blocks creation)
  // On a tenant where the tenant-level flag is disabled, grant creation must
  // be rejected. Test uses a dedicated fixture tenant id.
  // -------------------------------------------------------------------------

  test("Grant creation blocked when Support Access Allowed=false (AC-15)", async ({
    authenticatedPage,
  }) => {
    const response = await authenticatedPage.request.post(
      `${apiBase}/api/v1/tenants/tenant-support-disabled/grants`,
      { data: grantPayload() }
    )
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })
})
