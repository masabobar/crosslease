import { describe, it, expect } from "vitest"
import {
  CreateProductTemplateDraftRequestSchema,
  ProductTemplateWizardFormSchema,
  TemplateDraftCreatedResponseSchema,
  TemplateDraftDiscardedResponseSchema,
  TemplateDraftUpdatedResponseSchema,
  UpdateProductTemplateDraftRequestSchema,
} from "@/features/productTemplates/api/schema"

const validCreateRequest = {
  template_code: "REFI-FULL-STD",
  template_name: "Full refinancing standard",
  financing_type: "full_refinancing",
  legal_structure: "loan_credit",
  payment_timing: "advance",
  rate_basis: "30_360",
  calculation_model: "annuity",
}

describe("CreateProductTemplateDraftRequestSchema", () => {
  it("accepts the minimal wire-required payload", () => {
    expect(() =>
      CreateProductTemplateDraftRequestSchema.parse(validCreateRequest)
    ).not.toThrow()
  })

  it("accepts a fully populated payload", () => {
    expect(() =>
      CreateProductTemplateDraftRequestSchema.parse({
        ...validCreateRequest,
        template_description: "Standard blueprint",
        valid_from: "2026-06-12",
        valid_until: "2027-06-12",
        rate_type: "fixed",
        npv_formula_ref: "NPV-FORMULA-STD-v3",
        first_installment_rule: "following_month",
        disbursement_derivation_rule: "npv",
        allowed_asset_categories: ["machinery", "vehicles"],
        min_term_months: 12,
        max_term_months: 84,
        max_ltv_ratio: 85,
        min_volume_eur: 50000,
        max_volume_eur: 5000000,
      })
    ).not.toThrow()
  })

  it.each([
    "template_code",
    "template_name",
    "financing_type",
    "legal_structure",
    "payment_timing",
    "rate_basis",
    "calculation_model",
  ])("rejects a payload missing required field %s", field => {
    const rest = { ...validCreateRequest } as Record<string, unknown>
    delete rest[field]
    expect(() => CreateProductTemplateDraftRequestSchema.parse(rest)).toThrow()
  })

  it("rejects an unknown financing_type", () => {
    expect(() =>
      CreateProductTemplateDraftRequestSchema.parse({
        ...validCreateRequest,
        financing_type: "unknown_type",
      })
    ).toThrow()
  })

  it("rejects max_ltv_ratio as a non-numeric string", () => {
    expect(() =>
      CreateProductTemplateDraftRequestSchema.parse({
        ...validCreateRequest,
        max_ltv_ratio: "not-a-number",
      })
    ).toThrow()
  })
})

describe("UpdateProductTemplateDraftRequestSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    expect(() =>
      UpdateProductTemplateDraftRequestSchema.parse({})
    ).not.toThrow()
  })

  it("rejects template_code (immutable after create, not part of update shape)", () => {
    const parsed = UpdateProductTemplateDraftRequestSchema.parse({
      template_code: "IGNORED",
      template_name: "Renamed",
    })
    expect(parsed).not.toHaveProperty("template_code")
    expect(parsed.template_name).toBe("Renamed")
  })
})

describe("TemplateDraftCreatedResponseSchema", () => {
  it("accepts a valid response", () => {
    expect(() =>
      TemplateDraftCreatedResponseSchema.parse({
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        version_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        version_number: "0.1",
        version_status: "draft",
      })
    ).not.toThrow()
  })

  it("rejects a non-UUID id", () => {
    expect(() =>
      TemplateDraftCreatedResponseSchema.parse({
        id: "not-a-uuid",
        version_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        version_number: "0.1",
        version_status: "draft",
      })
    ).toThrow()
  })

  it("rejects a missing version_number", () => {
    expect(() =>
      TemplateDraftCreatedResponseSchema.parse({
        id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        version_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        version_status: "draft",
      })
    ).toThrow()
  })
})

describe("TemplateDraftUpdatedResponseSchema / TemplateDraftDiscardedResponseSchema", () => {
  const valid = {
    version_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    version_status: "draft",
  }

  it("accepts a valid update response", () => {
    expect(() => TemplateDraftUpdatedResponseSchema.parse(valid)).not.toThrow()
  })

  it("accepts a valid discard response", () => {
    expect(() =>
      TemplateDraftDiscardedResponseSchema.parse({
        ...valid,
        version_status: "discarded",
      })
    ).not.toThrow()
  })
})

describe("ProductTemplateWizardFormSchema", () => {
  const validForm = {
    template_code: "REFI-FULL-STD",
    template_name: "Full refinancing standard",
    financing_type: "full_refinancing",
    legal_structure: "loan_credit",
    payment_timing: "advance",
    rate_basis: "30_360",
    calculation_model: "annuity",
    rate_type: "fixed",
    npv_formula_ref: "NPV-FORMULA-STD-v3",
    first_installment_rule: "following_month",
    disbursement_derivation_rule: "npv",
    allowed_asset_categories: ["machinery"],
    min_term_months: 12,
    max_term_months: 84,
    max_ltv_ratio: 85,
    valid_from: "2026-06-12",
  }

  it("accepts a fully valid form", () => {
    expect(() => ProductTemplateWizardFormSchema.parse(validForm)).not.toThrow()
  })

  it("rejects a template_code with invalid characters", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        template_code: "REFI FULL/STD",
      })
    ).toThrow()
  })

  it("rejects an empty allowed_asset_categories array", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        allowed_asset_categories: [],
      })
    ).toThrow()
  })

  it("rejects min_term_months greater than max_term_months", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        min_term_months: 90,
        max_term_months: 84,
      })
    ).toThrow()
  })

  it("rejects min_volume_eur greater than max_volume_eur", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        min_volume_eur: 5000000,
        max_volume_eur: 50000,
      })
    ).toThrow()
  })

  it("rejects max_ltv_ratio above 100", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        max_ltv_ratio: 150,
      })
    ).toThrow()
  })

  it("rejects valid_until before valid_from", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        valid_from: "2026-06-12",
        valid_until: "2025-01-01",
      })
    ).toThrow()
  })

  it("accepts an open-ended valid_until", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        valid_until: undefined,
      })
    ).not.toThrow()
  })
})
