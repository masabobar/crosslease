import { describe, it, expect } from "vitest"
import {
  CreateProductTemplateDraftRequestSchema,
  DeprecateTemplateVersionRequestSchema,
  DeprecateTemplateVersionResponseSchema,
  NewVersionCreatedResponseSchema,
  ProductTemplateWizardFormSchema,
  PublishTemplateDraftRequestSchema,
  PublishTemplateDraftResponseSchema,
  TemplateCurrentVersionSummarySchema,
  TemplateDraftCreatedResponseSchema,
  TemplateDraftDiscardedResponseSchema,
  TemplateDraftUpdatedResponseSchema,
  TemplateListItemSchema,
  TemplateListResponseSchema,
  TemplateVersionDetailSchema,
  TemplateVersionSummarySchema,
  UpdateProductTemplateDraftRequestSchema,
  VersionHistoryResponseSchema,
} from "@/features/productTemplates/api/schema"

const validCreateRequest = {
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
  const validDraftCreatedResponse = {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    template_code: "REFI-001",
    version_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    version_number: "0.1",
    version_status: "draft",
  }

  it("accepts a valid response", () => {
    expect(() =>
      TemplateDraftCreatedResponseSchema.parse(validDraftCreatedResponse)
    ).not.toThrow()
  })

  it("rejects a non-UUID id", () => {
    expect(() =>
      TemplateDraftCreatedResponseSchema.parse({
        ...validDraftCreatedResponse,
        id: "not-a-uuid",
      })
    ).toThrow()
  })

  it("rejects a missing version_number", () => {
    const rest = { ...validDraftCreatedResponse } as Record<string, unknown>
    delete rest.version_number
    expect(() => TemplateDraftCreatedResponseSchema.parse(rest)).toThrow()
  })

  it("rejects a missing template_code", () => {
    const rest = { ...validDraftCreatedResponse } as Record<string, unknown>
    delete rest.template_code
    expect(() => TemplateDraftCreatedResponseSchema.parse(rest)).toThrow()
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

  it("accepts a form with min_term_months, max_term_months, and max_ltv_ratio omitted", () => {
    const rest = { ...validForm } as Record<string, unknown>
    delete rest.min_term_months
    delete rest.max_term_months
    delete rest.max_ltv_ratio
    expect(() => ProductTemplateWizardFormSchema.parse(rest)).not.toThrow()
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

describe("TemplateVersionDetailSchema", () => {
  const validDetail = {
    version_number: "1.0",
    version_status: "published",
    template_name: "Full refinancing standard",
    financing_type: "full_refinancing",
    legal_structure: "loan_credit",
    payment_timing: "advance",
    rate_basis: "30_360",
    calculation_model: "annuity",
  }

  it("accepts a minimal header-shaped payload", () => {
    expect(() => TemplateVersionDetailSchema.parse(validDetail)).not.toThrow()
  })

  it("accepts a fully populated payload with string-wire decimal fields", () => {
    expect(() =>
      TemplateVersionDetailSchema.parse({
        ...validDetail,
        template_description: "Standard blueprint",
        rate_type: "fixed",
        npv_formula_ref: "NPV-FORMULA-STD-v3",
        first_installment_rule: "following_month",
        disbursement_derivation_rule: "npv",
        allowed_asset_categories: ["machinery", "vehicles"],
        min_term_months: 12,
        max_term_months: 84,
        max_ltv_ratio: "85.00",
        min_volume_eur: "50000.00",
        max_volume_eur: "5000000.00",
        valid_from: "2026-06-12",
        valid_until: "2027-06-12",
      })
    ).not.toThrow()
  })

  it("coerces string decimal fields to numbers", () => {
    const parsed = TemplateVersionDetailSchema.parse({
      ...validDetail,
      max_ltv_ratio: "85.5",
    })
    expect(parsed.max_ltv_ratio).toBe(85.5)
  })

  it("rejects a missing template_name", () => {
    const rest = { ...validDetail } as Record<string, unknown>
    delete rest.template_name
    expect(() => TemplateVersionDetailSchema.parse(rest)).toThrow()
  })

  it("rejects an unknown financing_type", () => {
    expect(() =>
      TemplateVersionDetailSchema.parse({
        ...validDetail,
        financing_type: "unknown_type",
      })
    ).toThrow()
  })
})

describe("NewVersionCreatedResponseSchema", () => {
  const validNewVersionResponse = {
    version_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    version_number: "2",
    version_status: "draft",
    predecessor_version_id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    snapshot_source_version_id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  }

  it("accepts a valid new-version response", () => {
    expect(() =>
      NewVersionCreatedResponseSchema.parse(validNewVersionResponse)
    ).not.toThrow()
  })

  it("accepts null predecessor/snapshot fields", () => {
    expect(() =>
      NewVersionCreatedResponseSchema.parse({
        ...validNewVersionResponse,
        predecessor_version_id: null,
        snapshot_source_version_id: null,
      })
    ).not.toThrow()
  })

  it("rejects a missing version_id", () => {
    const rest = { ...validNewVersionResponse } as Record<string, unknown>
    delete rest.version_id
    expect(() => NewVersionCreatedResponseSchema.parse(rest)).toThrow()
  })
})

describe("DeprecateTemplateVersionRequestSchema / DeprecateTemplateVersionResponseSchema", () => {
  it("accepts a justification at the minimum length", () => {
    expect(() =>
      DeprecateTemplateVersionRequestSchema.parse({
        justification: "1234567890",
      })
    ).not.toThrow()
  })

  it("rejects a justification under 10 characters", () => {
    expect(() =>
      DeprecateTemplateVersionRequestSchema.parse({
        justification: "too short",
      })
    ).toThrow()
  })

  it("rejects a justification over 2000 characters", () => {
    expect(() =>
      DeprecateTemplateVersionRequestSchema.parse({
        justification: "a".repeat(2001),
      })
    ).toThrow()
  })

  const validDeprecateResponse = {
    version_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    version_status: "deprecated",
    deprecated_at: "2026-07-14T11:23:00Z",
    deprecated_by: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  }

  it("accepts a valid deprecate response", () => {
    expect(() =>
      DeprecateTemplateVersionResponseSchema.parse(validDeprecateResponse)
    ).not.toThrow()
  })

  it("rejects a non-UUID deprecated_by", () => {
    expect(() =>
      DeprecateTemplateVersionResponseSchema.parse({
        ...validDeprecateResponse,
        deprecated_by: "not-a-uuid",
      })
    ).toThrow()
  })
})

describe("TemplateCurrentVersionSummarySchema / TemplateListItemSchema / TemplateListResponseSchema", () => {
  const validCurrentVersion = {
    version_id: "f7a5c6b8-cdae-4f55-af6e-5d6e7f8a9b01",
    version_number: "1.0",
    version_status: "published",
    financing_type: "full_refinancing",
    legal_structure: "loan_credit",
    calculation_model: "annuity",
    payment_timing: "advance",
  }

  it("accepts a minimal current-version summary", () => {
    expect(() =>
      TemplateCurrentVersionSummarySchema.parse(validCurrentVersion)
    ).not.toThrow()
  })

  it("accepts a fully populated current-version summary", () => {
    expect(() =>
      TemplateCurrentVersionSummarySchema.parse({
        ...validCurrentVersion,
        max_ltv_ratio: 85,
        min_term_months: 12,
        max_term_months: 84,
        published_by: {
          id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          display_name: "Anna Kowalski",
        },
        published_at: "2026-05-22T14:30:00Z",
      })
    ).not.toThrow()
  })

  it("rejects an unknown version_status", () => {
    expect(() =>
      TemplateCurrentVersionSummarySchema.parse({
        ...validCurrentVersion,
        version_status: "banana",
      })
    ).toThrow()
  })

  const validListItem = {
    id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    template_code: "REFI-FULL-STD",
    current_version: validCurrentVersion,
    created_at: "2026-05-22T14:30:00Z",
  }

  it("accepts a list item with a current version", () => {
    expect(() => TemplateListItemSchema.parse(validListItem)).not.toThrow()
  })

  it("accepts a list item with a null current version", () => {
    expect(() =>
      TemplateListItemSchema.parse({ ...validListItem, current_version: null })
    ).not.toThrow()
  })

  it("rejects a list item missing template_code", () => {
    const rest = { ...validListItem } as Record<string, unknown>
    delete rest.template_code
    expect(() => TemplateListItemSchema.parse(rest)).toThrow()
  })

  it("accepts a valid paginated list response", () => {
    expect(() =>
      TemplateListResponseSchema.parse({
        items: [validListItem],
        total: 1,
        page: 1,
        per_page: 20,
        total_pages: 1,
      })
    ).not.toThrow()
  })

  it("accepts an empty items array", () => {
    expect(() =>
      TemplateListResponseSchema.parse({
        items: [],
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 1,
      })
    ).not.toThrow()
  })

  it("rejects a response missing total_pages", () => {
    const rest = {
      items: [validListItem],
      total: 1,
      page: 1,
      per_page: 20,
    } as Record<string, unknown>
    expect(() => TemplateListResponseSchema.parse(rest)).toThrow()
  })
})
