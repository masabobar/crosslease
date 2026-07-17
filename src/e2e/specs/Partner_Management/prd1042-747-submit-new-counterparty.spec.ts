import { expect, test } from "../../fixtures/test"
import { PartnerSubmissionPage } from "../../pages/PartnerSubmissionPage"

// PRD1042-747 — US 13.1 | Submit New Counterparty into Partner Registry
//
// E2E coverage: AC-04 only (Scenarios summary column ✅).
// All other scenarios (AC-01/03/09 happy-path, AC-10/11 match outcomes, AC-02
// tenant isolation, AC-13 role-authz) are ⚙️-blocked on seed data and produce
// no tests here.
//
// Design source (Figma file PQVvNvRcoFac0zdHGaLWCg, canvas 1:110):
//   - ADD NEW PARTNER section (id 4:11386) — Legal Entity form (default)
//   - Entity type - Natural person → dynamic fields (id 263:20538)
//   - Design-verified copy: heading "Add new partner", CTA "Submit for matching"
//   - Sections: BASIC IDENTITY, REGISTRY IDENTIFIERS, ADDRESS, CLASSIFICATION

test.describe("PRD1042-747 — Submit New Counterparty into Partner Registry (US 13.1)", () => {
  // AC-04 — Submission missing a mandatory anchor is rejected before persistence.
  // Scenario Outline: one row per Partner Type × its type-specific mandatory anchor.
  const missingAnchorCases = [
    { partnerType: "Legal entity", missingField: "Legal Form" },
    { partnerType: "Natural person", missingField: "Date of Birth" },
    { partnerType: "Sole proprietor", missingField: "Date of Birth" },
  ]

  for (const { partnerType, missingField } of missingAnchorCases) {
    test(`${partnerType}: submission missing mandatory "${missingField}" is rejected before persistence (AC-04)`, async ({
      bankProcessorPage,
    }) => {
      const submissionPage = new PartnerSubmissionPage(bankProcessorPage)
      await submissionPage.goto()
      // Design-verified page landmark before proceeding
      await expect(submissionPage.pageTitle).toBeVisible()
      await expect(submissionPage.subtitle).toBeVisible()

      await submissionPage.selectPartnerType(partnerType)
      // Classification helper is a design-verified visual anchor for the form
      await expect(submissionPage.classificationHelperText).toBeVisible()

      // Submit without filling the mandatory field — triggers server-side 400
      await submissionPage.submitForm()

      // Field-level validation error must be visible for the omitted field
      await expect(submissionPage.fieldError(missingField)).toBeVisible()
      // Form must not have navigated away — no Partner was persisted
      await expect(bankProcessorPage).toHaveURL(/\/partners\/new/)
    })
  }
})
