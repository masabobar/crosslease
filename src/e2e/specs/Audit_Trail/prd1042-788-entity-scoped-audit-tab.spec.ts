import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"
import {
  EntityAuditTabPage,
  type EntityType,
} from "../../pages/EntityAuditTabPage"

// ---------------------------------------------------------------------------
// PRD1042-788 — US 26.11 | AUDIT TRAIL | Entity-Scoped Audit Tab in
//                Operational Cockpits
// Gherkin source: src/e2e/tests/PRD1042-37-Audit Trail/
//                 PRD1042-788 Entity-Scoped Audit Tab.md
//
// SCENARIO STATUS (Scenarios summary E2E column drives inclusion)
// ---------------------------------------------------------------
// ✅  AC-01, AC-02 — Authorized roles see the read-only audit tab
// ⚙️  AC-02       — FO/BO scope-positive path         (needs D-Scope-Fixture)
// ⚙️  AC-03       — Sensitive fields masked per role  (needs US 26.05 config)
// ✅  AC-04       — LC users never see the audit tab
// ✅  AC-06       — LC tokens receive no audit data (API)
// ✅  AC-07       — No mutation affordance; mutation API calls rejected
//
// BLOCKED ACs (no Gherkin block in source, listed in header)
// ----------------------------------------------------------
// AC-05 — Cross-scope enumeration (needs D-Scope-Fixture, Epic 30)
//
// EXCLUSIONS APPLIED (per task instructions)
// ------------------------------------------
//   - bank_admin role                : not present in source Gherkin — n/a
//   - Create / invite operations     : not present in source Gherkin — n/a
//   - Deactivate / suspend operations: not present in source Gherkin — n/a
// The AC-07 mutation-attempt scenario probes POST/PUT/DELETE against audit
// endpoints (not user lifecycle mutations) and is retained.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""

const CONTRACT_ID = "CTR-100001"
const FINANCING_ID = "FIN-100001"
const PARTNER_ID = "PRT-100001"
const DOCUMENT_ID = "DOC-100001"

const LC_CONTRACT_ID = "CTR-100020"
const LC_FINANCING_ID = "FIN-100020"
const LC_PARTNER_ID = "PRT-100020"
const LC_DOCUMENT_ID = "DOC-100020"

const LC_API_ENDPOINTS: readonly string[] = [
  "/audit/entity/Contract/CTR-100030",
  "/audit/entity/Financing/FIN-100030",
  "/audit/entity/Partner/PRT-100030",
]

const MUTATION_CONTRACT_ID = "CTR-100040"

test.describe("PRD1042-788 — Entity-Scoped Audit Tab in Operational Cockpits", () => {
  // -------------------------------------------------------------------------
  // HAPPY PATH — AC-01, AC-02
  // Authorized roles (System Admin, Auditor, Front Office, Back Office) can
  // open a cockpit for an in-scope entity and see the read-only audit tab
  // with a paginated list of records. No mutation controls exposed.
  // -------------------------------------------------------------------------

  type AuthorizedCase = {
    role: string
    fixture:
      | "authenticatedPage"
      | "auditorPage"
      | "bankProcessorPage"
      | "supportPage"
    entityType: EntityType
    entityId: string
  }

  const authorizedCases: readonly AuthorizedCase[] = [
    {
      role: "System Admin",
      fixture: "authenticatedPage",
      entityType: "Contract",
      entityId: CONTRACT_ID,
    },
    {
      role: "Auditor",
      fixture: "auditorPage",
      entityType: "Financing",
      entityId: FINANCING_ID,
    },
    {
      role: "Front Office",
      fixture: "bankProcessorPage",
      entityType: "Partner",
      entityId: PARTNER_ID,
    },
    {
      role: "Back Office",
      // Back Office user reuses the front_office fixture until a dedicated
      // BO fixture is added; the assertion pattern is identical.
      fixture: "bankProcessorPage",
      entityType: "Document",
      entityId: DOCUMENT_ID,
    },
  ]

  for (const { role, fixture, entityType, entityId } of authorizedCases) {
    test(`${role} sees read-only audit tab on ${entityType} cockpit (AC-01, AC-02)`, async ({
      authenticatedPage,
      auditorPage,
      bankProcessorPage,
    }) => {
      const page =
        fixture === "authenticatedPage"
          ? authenticatedPage
          : fixture === "auditorPage"
            ? auditorPage
            : bankProcessorPage
      const auditTab = new EntityAuditTabPage(page)
      await auditTab.goto(entityType, entityId)

      // The audit-history tab must be present and selectable.
      await expect(auditTab.auditHistoryTab).toBeVisible()
      await auditTab.openAuditTab()

      // Read-only invariant: no mutation controls on the tab surface.
      await expect.soft(auditTab.editControl).toHaveCount(0)
      await expect.soft(auditTab.deleteControl).toHaveCount(0)
      await expect.soft(auditTab.createControl).toHaveCount(0)
      await expect.soft(auditTab.saveControl).toHaveCount(0)
      await expect.soft(auditTab.unmaskControl).toHaveCount(0)
    })
  }

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-04
  // Absolute visibility rule: LC users must NEVER see the audit tab on any
  // cockpit. UI-layer denial across all four entity cockpits.
  // -------------------------------------------------------------------------

  const lcCockpits: ReadonlyArray<{
    entityType: EntityType
    entityId: string
  }> = [
    { entityType: "Contract", entityId: LC_CONTRACT_ID },
    { entityType: "Financing", entityId: LC_FINANCING_ID },
    { entityType: "Partner", entityId: LC_PARTNER_ID },
    { entityType: "Document", entityId: LC_DOCUMENT_ID },
  ]

  for (const { entityType, entityId } of lcCockpits) {
    test(`LC user does not see audit tab on ${entityType} cockpit (AC-04)`, async ({
      lcUserPage,
    }) => {
      const auditTab = new EntityAuditTabPage(lcUserPage)
      await auditTab.goto(entityType, entityId)

      // The audit-history tab must not be rendered anywhere on the page for
      // LC users. Asserting a count of 0 covers both the DOM absence and the
      // ARIA-role absence requirements from the Gherkin.
      await expect(auditTab.auditHistoryTab).toHaveCount(0)
    })
  }

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-06 (AC-AT-A3)
  // API-layer denial for LC tokens: even bypassing the UI, LC callers must
  // receive no audit data from any audit endpoint. Body must not contain
  // audit-record oldValue/newValue payloads.
  // -------------------------------------------------------------------------

  for (const endpoint of LC_API_ENDPOINTS) {
    test(`LC token receives no audit data from ${endpoint} (AC-06)`, async ({
      browser,
    }) => {
      const context = await browser.newContext()
      try {
        const page = await context.newPage()
        await createTestSession(page, process.env.E2E_LCO_USER_EMAIL ?? "")

        const response = await page.request.get(`${apiBase}${endpoint}`)

        // RefiNext contract: LC callers hitting audit endpoints receive 404
        // (per the platform's 404-not-403 rule for out-of-scope resources).
        expect(response.status()).toBe(404)

        // Response body must not leak audit payload structure. Some 404
        // responses return an empty body; guard the JSON parse.
        const rawBody = await response.text()
        expect(rawBody).not.toContain("oldValue")
        expect(rawBody).not.toContain("newValue")
      } finally {
        await context.close()
      }
    })
  }

  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-07
  // Read-only invariant at the entity-tab surface: no mutation affordance
  // in the UI, and any mutation API call returns 4xx (403 / 404 / 405) and
  // leaves the audit store unchanged. Permission Matrix denies mutation for
  // every role including System Admin and Auditor.
  // -------------------------------------------------------------------------

  type MutationCase = {
    role: string
    fixture: "authenticatedPage" | "auditorPage" | "bankProcessorPage"
    method: "POST" | "PUT" | "DELETE"
    endpoint: string
  }

  const mutationCases: readonly MutationCase[] = [
    {
      role: "System Admin",
      fixture: "authenticatedPage",
      method: "POST",
      endpoint: `/audit/entity/Contract/${MUTATION_CONTRACT_ID}`,
    },
    {
      role: "Auditor",
      fixture: "auditorPage",
      method: "PUT",
      endpoint: `/audit/entity/Contract/${MUTATION_CONTRACT_ID}/records/1`,
    },
    {
      role: "Back Office",
      // Back Office reuses the front_office fixture pending a dedicated BO
      // fixture; the endpoint-layer denial is role-agnostic in this test.
      fixture: "bankProcessorPage",
      method: "DELETE",
      endpoint: `/audit/entity/Contract/${MUTATION_CONTRACT_ID}/records/1`,
    },
  ]

  for (const { role, fixture, method, endpoint } of mutationCases) {
    test(`${role} ${method} on ${endpoint} is rejected (AC-07)`, async ({
      authenticatedPage,
      auditorPage,
      bankProcessorPage,
    }) => {
      const page =
        fixture === "authenticatedPage"
          ? authenticatedPage
          : fixture === "auditorPage"
            ? auditorPage
            : bankProcessorPage

      const auditTab = new EntityAuditTabPage(page)
      await auditTab.goto("Contract", MUTATION_CONTRACT_ID)

      // Attempt a mutation via the API. The audit surface must return 4xx.
      const url = `${apiBase}${endpoint}`
      const response =
        method === "POST"
          ? await page.request.post(url, { data: {} })
          : method === "PUT"
            ? await page.request.put(url, { data: {} })
            : await page.request.delete(url)

      const status = response.status()
      expect([403, 404, 405]).toContain(status)
    })
  }
})
