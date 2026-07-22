import { expect, test } from "../../fixtures/test"
import { PartnerMatchingPage } from "../../pages/PartnerMatchingPage"

// PRD1042-749 — US 13.3 | Deterministic Identity Resolution
//
// E2E coverage: AC-05 only.
// All other scenarios (AC-01/02/04 happy-path, AC-03 definite-dup, AC-06 cross-tenant)
// are ⚙️-blocked on seeded Partner fixtures or D20 (Tenant B) and produce no tests here.

test.describe("PRD1042-749 — Deterministic Identity Resolution (US 13.3)", () => {
  // AC-05 — Matching evidence is visible to bank-internal roles + Auditor only;
  // a Leasing Company user navigating within their permitted scope must never
  // see the match-evidence panel, matched anchors, or classification.
  test("LC users cannot view matching evidence (AC-05)", async ({
    lcUserPage,
  }) => {
    const matchingPage = new PartnerMatchingPage(lcUserPage)
    await matchingPage.gotoLCPartnerArea()
    await expect(matchingPage.matchEvidencePanel).not.toBeVisible()
    await expect(matchingPage.matchedAnchors).not.toBeVisible()
    await expect(matchingPage.classificationLabel).not.toBeVisible()
  })
})
