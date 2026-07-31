import { describe, it, expect } from "vitest"
import { addDays, format } from "date-fns"
import { WIZARD_STEP_FIELDS } from "@/features/productTemplates/types"
import { ProductTemplateWizardFormSchema } from "@/features/productTemplates/api/schema"

const isoDateOffsetByDays = (days: number) =>
  format(addDays(new Date(), days), "yyyy-MM-dd")

const validForm = {
  template_name: "Full refinancing standard",
  financing_type: "full_refinancing",
  legal_structure: "loan_credit",
  payment_timing: "advance",
  rate_basis: "30_360",
  calculation_model: "annuity",
  first_installment_rule: "following_month",
  disbursement_derivation_rule: "npv",
  allowed_asset_categories: ["machinery"],
  min_term_months: 12,
  max_term_months: 84,
  max_ltv_ratio: 85,
  valid_from: isoDateOffsetByDays(0),
}

const ALL_VALIDATED_FIELDS = new Set(
  Object.values(WIZARD_STEP_FIELDS).flat() as string[]
)

describe("WIZARD_STEP_FIELDS", () => {
  it("validates both volume fields on the eligibility step", () => {
    // Regression: they were absent, so the schema's minVolumeExceedsMax refinement was
    // computed and then dropped by form.trigger() — min 4 / max 1 passed the step and
    // published, because neither the publish handler nor the API re-checks the pair.
    expect(WIZARD_STEP_FIELDS.eligibility).toContain("min_volume_eur")
    expect(WIZARD_STEP_FIELDS.eligibility).toContain("max_volume_eur")
  })

  it("validates every field the wizard form schema can report an issue on", () => {
    // Derived from the schema rather than mirrored by hand: a refinement added on a
    // field no step validates fails here instead of silently never firing.
    const invalidVariants: Record<string, unknown>[] = [
      { ...validForm, min_term_months: 90, max_term_months: 84 },
      { ...validForm, min_volume_eur: 5_000_000, max_volume_eur: 50_000 },
      { ...validForm, valid_from: isoDateOffsetByDays(-1) },
      {
        ...validForm,
        valid_from: isoDateOffsetByDays(30),
        valid_until: isoDateOffsetByDays(0),
      },
    ]

    const reportedPaths = new Set<string>()
    for (const variant of invalidVariants) {
      const result = ProductTemplateWizardFormSchema.safeParse(variant)
      expect(result.success).toBe(false)
      if (!result.success) {
        for (const issue of result.error.issues) {
          reportedPaths.add(String(issue.path[0]))
        }
      }
    }

    expect(reportedPaths.size).toBeGreaterThan(0)
    for (const path of reportedPaths) {
      expect(ALL_VALIDATED_FIELDS).toContain(path)
    }
  })

  it("names only real form fields", () => {
    const formKeys = new Set(Object.keys(validForm))
    formKeys.add("template_description")
    formKeys.add("min_volume_eur")
    formKeys.add("max_volume_eur")
    formKeys.add("valid_until")
    for (const field of ALL_VALIDATED_FIELDS) {
      expect(formKeys).toContain(field)
    }
  })

  it("validates nothing on the review step — it edits no field", () => {
    expect(WIZARD_STEP_FIELDS.review).toEqual([])
  })
})
