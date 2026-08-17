import { describe, it, expect } from "vitest"
import { addDays, format } from "date-fns"
import {
  FILTERABLE_TEMPLATE_STATUSES,
  WIZARD_STEP_FIELDS,
} from "@/features/productTemplates/types"
import {
  ProductTemplatePublishFormSchema,
  ProductTemplateWizardFormSchema,
  TemplateStatusSchema,
} from "@/features/productTemplates/api/schema"

const isoDateOffsetByDays = (days: number) =>
  format(addDays(new Date(), days), "yyyy-MM-dd")

const validForm = {
  template_name: "Full refinancing standard",
  refinancing_form: "annuity",
  legal_structure: "loan_credit",
  payment_timing: "advance",
  rate_basis: "30_360",
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

  it("validates every field either wizard schema can report an issue on", () => {
    // Derived from the schemas rather than mirrored by hand: a refinement added on a
    // field no step validates fails here instead of silently never firing.
    //
    // Both schemas are covered. The publish-only rules (CR-BPT-08) live on
    // ProductTemplatePublishFormSchema, and handlePublish maps their issues back onto the
    // same form via setError — so a path only that schema reports on still has to belong
    // to a step, or the message renders on a step the user is not looking at.
    const invalidVariants: Record<string, unknown>[] = [
      { ...validForm, min_term_months: 90, max_term_months: 84 },
      { ...validForm, min_volume_eur: 5_000_000, max_volume_eur: 50_000 },
      { ...validForm, valid_from: isoDateOffsetByDays(-1) },
      { ...validForm, valid_from: undefined },
    ]

    const reportedPaths = new Set<string>()
    for (const variant of invalidVariants) {
      // The draft schema accepts several of these on purpose, so failure is asserted
      // across the pair rather than per schema.
      const results = [
        ProductTemplateWizardFormSchema.safeParse(variant),
        ProductTemplatePublishFormSchema.safeParse(variant),
      ]
      expect(results.some(result => !result.success)).toBe(true)
      for (const result of results) {
        if (!result.success) {
          for (const issue of result.error.issues) {
            reportedPaths.add(String(issue.path[0]))
          }
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
    formKeys.add("effective_rate")
    for (const field of ALL_VALIDATED_FIELDS) {
      expect(formKeys).toContain(field)
    }
  })

  it("validates the effective rate on the behavioral step (CR-BPT-02)", () => {
    expect(WIZARD_STEP_FIELDS.behavioral).toContain("effective_rate")
  })

  it("validates nothing on the review step — it edits no field", () => {
    expect(WIZARD_STEP_FIELDS.review).toEqual([])
  })
})

describe("FILTERABLE_TEMPLATE_STATUSES", () => {
  it("omits discarded — backend-only per CR-BPT-05, never shown on the frontend", () => {
    expect(FILTERABLE_TEMPLATE_STATUSES).not.toContain(
      TemplateStatusSchema.enum.discarded
    )
  })

  it("offers every other wire status, so a new backend status is not silently dropped", () => {
    expect([...FILTERABLE_TEMPLATE_STATUSES].sort()).toEqual(
      TemplateStatusSchema.options
        .filter(status => status !== TemplateStatusSchema.enum.discarded)
        .sort()
    )
  })
})
