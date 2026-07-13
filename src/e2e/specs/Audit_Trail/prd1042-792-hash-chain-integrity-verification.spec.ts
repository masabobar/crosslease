import { test, expect } from "../../fixtures/test"
import { createTestSession } from "../../helpers/helper"

// ---------------------------------------------------------------------------
// PRD1042-792 — US 26.15 | Audit Trail | Hash-Chain Integrity Verification
// Gherkin source: src/e2e/tests/PRD1042-37-Audit Trail/
//                 PRD1042-792 Hash-Chain Integrity Verification.md
//
// SCENARIO STATUS
// ---------------
// Only ONE row in the Scenarios summary table carries ✅ in the E2E column:
//   - "Non-Auditor roles cannot invoke verification API" (AC-12, AC-18)
//     — pure API-layer RBAC negative check (403 for non-Auditor roles).
//
// All other rows are marked `⚙️ needs ...`:
//   - Happy-path chain-valid (AC-04, AC-06) → needs PRD1042-1027 FE view
//   - API contract payload shape (AC-04)   → needs D-Audit + FE view
//   - Chain gap tamper (AC-08)             → needs backend test-fixture
//   - Chaining disabled per tenant (AC-11, AC-15) → needs D-Audit + toggle
//   - Client-supplied hash modification (AC-19) → needs D-Audit
//
// Per playwright-architect SKILL §"Blocked scenario handling":
// rows without ✅ generate no test — not even test.fixme(). Only the AC-12/
// AC-18 RBAC scenario is generated below.
//
// BLOCKED ACs (no Gherkin block, listed in source header)
// -------------------------------------------------------
// AC-05, AC-07, AC-09, AC-14, AC-20, AC-21 — dependencies on D-EventBus,
// D-Alert-Queue, backend hash-forge harness, D-Performance-Harness, and the
// PRD1042-37 audit-log read API. No coverage generated.
//
// EXCLUSIONS APPLIED (per task directive)
// ---------------------------------------
// - bank_admin role                : not present in any eligible scenario;
//                                    no filtering required.
// - Create / invite operations     : none — story surface is read-only
//                                    verification API; no filtering required.
// - Deactivate / suspend operations: none — story surface is read-only
//                                    verification API; no filtering required.
//
// The four non-Auditor roles in the AC-12/AC-18 Scenario Outline
// (Front Office, Back Office, Support User, LC User) are all retained —
// none of them trigger the exclusion filters.
// ---------------------------------------------------------------------------

const apiBase = process.env.E2E_API_BASE_URL ?? ""
const ENTITY_ID = "ENT-INT-0005"
const VERIFY_ENDPOINT = `${apiBase}/api/v1/audit/integrity/verify/${ENTITY_ID}`

test.describe("PRD1042-792 — Hash-Chain Integrity Verification", () => {
  // -------------------------------------------------------------------------
  // MAIN ERROR — AC-12, AC-18
  // Verification API is restricted to platform-level Auditors. Non-Auditor
  // roles must be rejected before chain-validation logic runs. RefiNext
  // domain rule for role-based access: cross-role access returns 4xx
  // (Story asks for 403; some routes return 404 per the RefiNext 404-not-403
  // rule — accept any 4xx as a valid rejection).
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
      role: "Support User",
      email: process.env.E2E_SUPPORT_USER_EMAIL ?? "",
    },
    {
      role: "LC User",
      email: process.env.E2E_LCO_USER_EMAIL ?? "",
    },
  ]

  for (const { role, email } of unauthorizedRoles) {
    test(`${role} cannot invoke integrity verification API (AC-12, AC-18)`, async ({
      browser,
    }) => {
      const context = await browser.newContext()
      try {
        const page = await context.newPage()
        await createTestSession(page, email)
        const response = await page.request.get(VERIFY_ENDPOINT)
        expect(response.status()).toBeGreaterThanOrEqual(400)
        expect(response.status()).toBeLessThan(500)
      } finally {
        await context.close()
      }
    })
  }
})
