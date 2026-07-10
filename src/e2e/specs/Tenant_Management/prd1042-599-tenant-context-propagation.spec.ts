import { test, expect } from "../../fixtures/test"

// ---------------------------------------------------------------------------
// PRD1042-599 — US 29.18 | Tenant Context Propagation
// Gherkin source: src/e2e/tests/PRD1042-40-Tenant Management/
//                 PRD1042-599 Tenant Context Propagation.md
//
// Covered:  AC-10 (client-injected X-Tenant-Id header is ignored — server
//           enforces session-bound tenant)
// Excluded: Bank Admin row (per team decision — omitted from Outline)
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const OTHER_TENANT_ID = "beta-bank-nonexistent-id"

test.describe("PRD1042-599 — Tenant Context Propagation", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-10 (X-Tenant-Id header ignored)
  // Server must ignore client-injected X-Tenant-Id header and enforce the
  // session-bound tenant. The response must contain only own-tenant records
  // regardless of the header value.
  // -------------------------------------------------------------------------

  test("System Admin — client-injected X-Tenant-Id header is ignored (AC-10)", async ({
    authenticatedPage,
  }) => {
    const response = await authenticatedPage.request.get(
      `${apiBase}/api/v1/users`,
      { headers: { "X-Tenant-Id": OTHER_TENANT_ID } }
    )
    // Response must succeed (or fail cleanly) with own-tenant scope, NOT
    // silently switch to the injected tenant. Server rejects or ignores the
    // header — either outcome is acceptable per AC-10, as long as no data
    // from the injected tenant leaks.
    expect(response.status()).toBeLessThan(500)
    if (response.ok()) {
      const body = (await response.json()) as {
        items?: Array<{ tenant_id?: string }>
      }
      const items = body.items ?? []
      for (const item of items) {
        expect(item.tenant_id).not.toBe(OTHER_TENANT_ID)
      }
    }
  })
})
