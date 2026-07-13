import { describe, it, expect } from "vitest"
import {
  CreateProductTemplateDraftRequestSchema,
  ProductTemplateWizardFormSchema,
  PublishTemplateDraftRequestSchema,
  PublishTemplateDraftResponseSchema,
  TemplateDraftCreatedResponseSchema,
  TemplateDraftDiscardedResponseSchema,
  TemplateDraftUpdatedResponseSchema,
  TemplateVersionHeaderSchema,
  TemplateVersionSummarySchema,
  UpdateProductTemplateDraftRequestSchema,
  VersionHistoryResponseSchema,
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

describe("PublishTemplateDraftRequestSchema", () => {
  it("accepts an empty object (justification omitted)", () => {
    expect(() => PublishTemplateDraftRequestSchema.parse({})).not.toThrow()
  })

  it("accepts a null justification", () => {
    expect(() =>
      PublishTemplateDraftRequestSchema.parse({ justification: null })
    ).not.toThrow()
  })

  it("accepts a populated justification string", () => {
    expect(() =>
      PublishTemplateDraftRequestSchema.parse({
        justification: "Activating for Q3 rollout",
      })
    ).not.toThrow()
  })

  it("rejects a non-string justification", () => {
    expect(() =>
      PublishTemplateDraftRequestSchema.parse({ justification: 123 })
    ).toThrow()
  })
})

describe("PublishTemplateDraftResponseSchema", () => {
  const validPublishResponse = {
    version_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    version_number: "1.0",
    version_status: "published",
    published_at: "2026-07-13T09:00:00Z",
    published_by: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  }

  it("accepts a valid publish response", () => {
    expect(() =>
      PublishTemplateDraftResponseSchema.parse(validPublishResponse)
    ).not.toThrow()
  })

  it.each([
    "version_id",
    "version_number",
    "version_status",
    "published_at",
    "published_by",
  ])("rejects a payload missing required field %s", field => {
    const rest = { ...validPublishResponse } as Record<string, unknown>
    delete rest[field]
    expect(() => PublishTemplateDraftResponseSchema.parse(rest)).toThrow()
  })

  it("rejects a non-UUID published_by", () => {
    expect(() =>
      PublishTemplateDraftResponseSchema.parse({
        ...validPublishResponse,
        published_by: "not-a-uuid",
      })
    ).toThrow()
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

const validVersionSummary = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  version_number: "1.0",
  version_status: "published",
  bindings_count: 3,
  created_at: "2026-05-22T14:30:00Z",
}

describe("TemplateVersionSummarySchema", () => {
  it("accepts a minimal draft version", () => {
    expect(() =>
      TemplateVersionSummarySchema.parse({
        ...validVersionSummary,
        version_status: "draft",
        bindings_count: 0,
      })
    ).not.toThrow()
  })

  it.each([
    "draft",
    "awaiting_activation_countersignature",
    "awaiting_deprecation_countersignature",
    "published",
    "deprecated",
    "discarded",
  ])("accepts version_status %s", status => {
    expect(() =>
      TemplateVersionSummarySchema.parse({
        ...validVersionSummary,
        version_status: status,
      })
    ).not.toThrow()
  })

  it("accepts a published version with published_by", () => {
    expect(() =>
      TemplateVersionSummarySchema.parse({
        ...validVersionSummary,
        published_at: "2026-05-22T14:30:00Z",
        published_by: {
          id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          display_name: "Anna Kowalski",
        },
      })
    ).not.toThrow()
  })

  it("accepts a deprecated version with published_by and deprecated_by", () => {
    expect(() =>
      TemplateVersionSummarySchema.parse({
        ...validVersionSummary,
        version_status: "deprecated",
        published_by: {
          id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          display_name: "Anna Kowalski",
        },
        deprecated_by: {
          id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          display_name: "Bruce Wayne",
        },
        deprecated_at: "2026-07-14T11:23:00Z",
      })
    ).not.toThrow()
  })

  it("rejects an unknown version_status", () => {
    expect(() =>
      TemplateVersionSummarySchema.parse({
        ...validVersionSummary,
        version_status: "archived",
      })
    ).toThrow()
  })

  it("rejects a missing version_number", () => {
    const rest = { ...validVersionSummary } as Record<string, unknown>
    delete rest.version_number
    expect(() => TemplateVersionSummarySchema.parse(rest)).toThrow()
  })

  it("rejects a non-UUID id", () => {
    expect(() =>
      TemplateVersionSummarySchema.parse({ ...validVersionSummary, id: "bad" })
    ).toThrow()
  })
})

describe("VersionHistoryResponseSchema", () => {
  it("accepts a list of versions", () => {
    expect(() =>
      VersionHistoryResponseSchema.parse({
        versions: [validVersionSummary],
      })
    ).not.toThrow()
  })

  it("accepts an empty list", () => {
    expect(() =>
      VersionHistoryResponseSchema.parse({ versions: [] })
    ).not.toThrow()
  })

  it("rejects a non-array versions field", () => {
    expect(() =>
      VersionHistoryResponseSchema.parse({ versions: validVersionSummary })
    ).toThrow()
  })
})

describe("TemplateVersionHeaderSchema", () => {
  it("accepts a valid header payload", () => {
    expect(() =>
      TemplateVersionHeaderSchema.parse({
        version_number: "1.0",
        version_status: "published",
        template_name: "Full refinancing standard",
      })
    ).not.toThrow()
  })

  it("rejects a missing template_name", () => {
    expect(() =>
      TemplateVersionHeaderSchema.parse({
        version_number: "1.0",
        version_status: "published",
      })
    ).toThrow()
  })
})
