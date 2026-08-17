import { describe, it, expect } from "vitest"
import { addDays, format } from "date-fns"
import {
  CreateProductTemplateDraftRequestSchema,
  DeactivateProductTemplateRequestSchema,
  NewVersionCreatedResponseSchema,
  ProductStatusResponseSchema,
  ProductTemplatePublishFormSchema,
  ProductTemplateWizardFormSchema,
  PublishTemplateDraftRequestSchema,
  PublishTemplateDraftResponseSchema,
  TemplateCurrentVersionSummarySchema,
  TemplateDraftCreatedResponseSchema,
  TemplateDraftDiscardedResponseSchema,
  TemplateDraftUpdatedResponseSchema,
  FieldDiffItemSchema,
  TemplateListItemSchema,
  TemplateListResponseSchema,
  TemplateVersionDetailSchema,
  TemplateVersionSummarySchema,
  TerminateTemplateVersionRequestSchema,
  TerminateTemplateVersionResponseSchema,
  UpdateProductTemplateDraftRequestSchema,
  VersionDiffResponseSchema,
  VersionHistoryResponseSchema,
} from "@/features/productTemplates/api/schema"
import {
  DEACTIVATION_REASON_MAX_LENGTH,
  DEACTIVATION_REASON_MIN_LENGTH,
  TERMINATION_JUSTIFICATION_MAX_LENGTH,
  TERMINATION_JUSTIFICATION_MIN_LENGTH,
} from "@/features/productTemplates/constants"

const validCreateRequest = {
  template_name: "Full refinancing standard",
  refinancing_form: "annuity",
  legal_structure: "loan_credit",
  payment_timing: "advance",
  rate_basis: "30_360",
}

describe("CreateProductTemplateDraftRequestSchema", () => {
  it("accepts the minimal wire-required payload", () => {
    expect(() =>
      CreateProductTemplateDraftRequestSchema.parse(validCreateRequest)
    ).not.toThrow()
  })

  // The BE removed both from CreateTemplateDraftRequest under CR PRD1042-1546 B9/B10, so the
  // wire schema must not carry them forward either — a caller passing them gets them dropped
  // rather than silently ignored server-side.
  it("strips rate_type/npv_formula_ref from the wire payload", () => {
    const parsed = CreateProductTemplateDraftRequestSchema.parse({
      ...validCreateRequest,
      rate_type: "fixed",
      npv_formula_ref: "NPV-FORMULA-STD-v3",
    }) as Record<string, unknown>
    expect(parsed.rate_type).toBeUndefined()
    expect(parsed.npv_formula_ref).toBeUndefined()
  })

  it("accepts a fully populated payload", () => {
    expect(() =>
      CreateProductTemplateDraftRequestSchema.parse({
        ...validCreateRequest,
        template_description: "Standard blueprint",
        valid_from: "2026-06-12",
        valid_until: "2027-06-12",
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
    "refinancing_form",
    "legal_structure",
    "payment_timing",
    "rate_basis",
  ])("rejects a payload missing required field %s", field => {
    const rest = { ...validCreateRequest } as Record<string, unknown>
    delete rest[field]
    expect(() => CreateProductTemplateDraftRequestSchema.parse(rest)).toThrow()
  })

  it("rejects an unknown refinancing_form", () => {
    expect(() =>
      CreateProductTemplateDraftRequestSchema.parse({
        ...validCreateRequest,
        refinancing_form: "unknown_type",
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

  // CR-BPT-02 on PRD1042-1798 — the refinancing rate moved from the Framework Agreement
  // onto the product template.
  it("accepts effective_rate", () => {
    expect(() =>
      CreateProductTemplateDraftRequestSchema.parse({
        ...validCreateRequest,
        effective_rate: 4.25,
      })
    ).not.toThrow()
  })

  it("accepts a request with no effective_rate — it is optional on the wire", () => {
    expect(() =>
      CreateProductTemplateDraftRequestSchema.parse(validCreateRequest)
    ).not.toThrow()
  })

  it("rejects effective_rate as a string", () => {
    expect(() =>
      CreateProductTemplateDraftRequestSchema.parse({
        ...validCreateRequest,
        effective_rate: "4.25",
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

  it("rejects a version_status outside TemplateStatus", () => {
    expect(() =>
      TemplateDraftCreatedResponseSchema.parse({
        ...validDraftCreatedResponse,
        version_status: "published",
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

  it("rejects a version_status outside TemplateStatus on either response", () => {
    const bad = { ...valid, version_status: "deprecated" }
    expect(() => TemplateDraftUpdatedResponseSchema.parse(bad)).toThrow()
    expect(() => TemplateDraftDiscardedResponseSchema.parse(bad)).toThrow()
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
    version_status: "active",
    activated_at: "2026-07-13T09:00:00Z",
    activated_by: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
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
    "activated_at",
    "activated_by",
  ])("rejects a payload missing required field %s", field => {
    const rest = { ...validPublishResponse } as Record<string, unknown>
    delete rest[field]
    expect(() => PublishTemplateDraftResponseSchema.parse(rest)).toThrow()
  })

  it("rejects a non-UUID activated_by", () => {
    expect(() =>
      PublishTemplateDraftResponseSchema.parse({
        ...validPublishResponse,
        activated_by: "not-a-uuid",
      })
    ).toThrow()
  })

  it("rejects a version_status outside TemplateStatus", () => {
    expect(() =>
      PublishTemplateDraftResponseSchema.parse({
        ...validPublishResponse,
        version_status: "published",
      })
    ).toThrow()
  })
})

describe("ProductTemplateWizardFormSchema", () => {
  // valid_from is validated against "today", so the fixtures are relative to the run
  // date rather than hardcoded — a fixed date would silently start failing once it
  // fell into the past.
  const isoDateOffsetByDays = (days: number) =>
    format(addDays(new Date(), days), "yyyy-MM-dd")
  const TODAY = isoDateOffsetByDays(0)
  const YESTERDAY = isoDateOffsetByDays(-1)

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
    valid_from: TODAY,
  }

  it("accepts a fully valid form", () => {
    expect(() => ProductTemplateWizardFormSchema.parse(validForm)).not.toThrow()
  })

  it("strips rate_type/npv_formula_ref — not user-selectable on this form (CR PRD1042-1548 B9/B10)", () => {
    const parsed = ProductTemplateWizardFormSchema.parse({
      ...validForm,
      rate_type: "fixed",
      npv_formula_ref: "NPV-FORMULA-STD-v3",
    }) as Record<string, unknown>
    expect(parsed.rate_type).toBeUndefined()
    expect(parsed.npv_formula_ref).toBeUndefined()
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

  // CR-BPT-08 on PRD1042-1798, as corrected by the client on 6/8/2026: the effective date
  // is mandatory and must not be in the past **at publication**, not at creation. A draft
  // legitimately has no date yet, so the draft schema must accept both cases.
  it("accepts a draft with no valid_from — the date is only mandatory at publish", () => {
    const noDate = { ...validForm } as Record<string, unknown>
    delete noDate.valid_from
    expect(() => ProductTemplateWizardFormSchema.parse(noDate)).not.toThrow()
  })

  it("accepts a draft whose valid_from has gone into the past", () => {
    // The draft was saved when the date was still in the future; nothing about saving it
    // again should fail. The publish gate is what catches the stale date.
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        valid_from: YESTERDAY,
      })
    ).not.toThrow()
  })

  it("accepts a valid_from of today", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({ ...validForm, valid_from: TODAY })
    ).not.toThrow()
  })

  it("accepts an effective rate", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        effective_rate: 4.25,
      })
    ).not.toThrow()
  })

  it("accepts a negative effective rate — negative refinancing rates are a real EUR case", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        effective_rate: -0.5,
      })
    ).not.toThrow()
  })

  it("rejects a non-numeric effective rate", () => {
    expect(() =>
      ProductTemplateWizardFormSchema.parse({
        ...validForm,
        effective_rate: "4.25",
      })
    ).toThrow()
  })

})

describe("ProductTemplatePublishFormSchema", () => {
  const isoDateOffsetByDays = (days: number) =>
    format(addDays(new Date(), days), "yyyy-MM-dd")
  const TODAY = isoDateOffsetByDays(0)
  const YESTERDAY = isoDateOffsetByDays(-1)

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
    valid_from: TODAY,
  }

  it("accepts a form that is ready to publish", () => {
    expect(() =>
      ProductTemplatePublishFormSchema.parse(validForm)
    ).not.toThrow()
  })

  it("rejects a valid_from in the past — the Draft → Scheduled check", () => {
    const result = ProductTemplatePublishFormSchema.safeParse({
      ...validForm,
      valid_from: YESTERDAY,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map(issue => issue.message)).toContain(
      "validFromInPast"
    )
  })

  it("requires valid_from", () => {
    const noDate = { ...validForm } as Record<string, unknown>
    delete noDate.valid_from
    const result = ProductTemplatePublishFormSchema.safeParse(noDate)
    expect(result.success).toBe(false)
    expect(
      result.error?.issues
        .filter(issue => issue.path[0] === "valid_from")
        .map(issue => issue.message)
    ).toEqual(["required"])
  })

  it("reports only 'required' for a blank valid_from, not also validFromInPast", () => {
    const result = ProductTemplatePublishFormSchema.safeParse({
      ...validForm,
      valid_from: "",
    })
    expect(result.success).toBe(false)
    const validFromMessages = result.error?.issues
      .filter(issue => issue.path[0] === "valid_from")
      .map(issue => issue.message)
    expect(validFromMessages).toEqual(["required"])
  })

  it("still enforces the draft range rules", () => {
    const result = ProductTemplatePublishFormSchema.safeParse({
      ...validForm,
      min_term_months: 90,
      max_term_months: 84,
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map(issue => issue.message)).toContain(
      "minTermExceedsMax"
    )
  })

})

const validVersionSummary = {
  id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  version_number: "1.0",
  version_status: "active",
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
    "scheduled",
    "active",
    "superseded",
    "terminated",
    "discarded",
  ])("accepts version_status %s", status => {
    expect(() =>
      TemplateVersionSummarySchema.parse({
        ...validVersionSummary,
        version_status: status,
      })
    ).not.toThrow()
  })

  it("accepts an active version with activated_by", () => {
    expect(() =>
      TemplateVersionSummarySchema.parse({
        ...validVersionSummary,
        activated_at: "2026-05-22T14:30:00Z",
        activated_by: {
          id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          display_name: "Anna Kowalski",
        },
      })
    ).not.toThrow()
  })

  it("accepts a terminated version with activated_by and terminated_by", () => {
    expect(() =>
      TemplateVersionSummarySchema.parse({
        ...validVersionSummary,
        version_status: "terminated",
        activated_by: {
          id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          display_name: "Anna Kowalski",
        },
        terminated_by: {
          id: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          display_name: "Bruce Wayne",
        },
        terminated_at: "2026-07-14T11:23:00Z",
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

describe("FieldDiffItemSchema", () => {
  it("accepts a diff with scalar old/new values", () => {
    expect(() =>
      FieldDiffItemSchema.parse({
        field: "max_ltv_ratio",
        old_value: 80,
        new_value: 85,
      })
    ).not.toThrow()
  })

  it("accepts array old/new values (asset categories, orchestration linkage)", () => {
    expect(() =>
      FieldDiffItemSchema.parse({
        field: "allowed_asset_categories",
        old_value: ["machinery"],
        new_value: ["machinery", "vehicles"],
      })
    ).not.toThrow()
  })

  it("accepts null old_value (field newly set)", () => {
    expect(() =>
      FieldDiffItemSchema.parse({
        field: "npv_formula_ref",
        old_value: null,
        new_value: "NPV-2024-A",
      })
    ).not.toThrow()
  })

  it("rejects a missing field name", () => {
    expect(() =>
      FieldDiffItemSchema.parse({ old_value: 1, new_value: 2 })
    ).toThrow()
  })
})

describe("VersionDiffResponseSchema", () => {
  const validDiff = {
    template_id: "123e4567-e89b-12d3-a456-426614174000",
    from_version: "3",
    to_version: "4",
    behavioral_settings: [
      { field: "payment_timing", old_value: "advance", new_value: "arrears" },
    ],
    eligibility: [{ field: "max_term_months", old_value: 60, new_value: 84 }],
    orchestration_linkage: [
      {
        field: "validation_rule_set_id",
        old_value: "44444444-4444-4444-4444-444444444444",
        new_value: "55555555-5555-5555-5555-555555555555",
      },
    ],
  }

  it("accepts a full diff response", () => {
    expect(() => VersionDiffResponseSchema.parse(validDiff)).not.toThrow()
  })

  it("accepts empty section arrays", () => {
    expect(() =>
      VersionDiffResponseSchema.parse({
        ...validDiff,
        behavioral_settings: [],
        eligibility: [],
        orchestration_linkage: [],
      })
    ).not.toThrow()
  })

  it("rejects a non-UUID template_id", () => {
    expect(() =>
      VersionDiffResponseSchema.parse({ ...validDiff, template_id: "bad" })
    ).toThrow()
  })

  it("rejects a missing section", () => {
    const rest = { ...validDiff } as Record<string, unknown>
    delete rest.eligibility
    expect(() => VersionDiffResponseSchema.parse(rest)).toThrow()
  })
})

describe("TemplateVersionDetailSchema", () => {
  const validDetail = {
    version_number: "1.0",
    version_status: "active",
    template_name: "Full refinancing standard",
    refinancing_form: "annuity",
    legal_structure: "loan_credit",
    payment_timing: "advance",
    rate_basis: "30_360",
  }

  it("accepts a minimal header-shaped payload", () => {
    expect(() => TemplateVersionDetailSchema.parse(validDetail)).not.toThrow()
  })

  // CR-BPT-02 — the rate is serialized as a decimal string, like max_ltv_ratio.
  it("coerces effective_rate from its decimal-string wire form", () => {
    const parsed = TemplateVersionDetailSchema.parse({
      ...validDetail,
      effective_rate: "4.25",
    })
    expect(parsed.effective_rate).toBe(4.25)
  })

  it("accepts a null effective_rate", () => {
    const parsed = TemplateVersionDetailSchema.parse({
      ...validDetail,
      effective_rate: null,
    })
    expect(parsed.effective_rate).toBeNull()
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
        created_at: "2026-06-12T14:32:00Z",
      })
    ).not.toThrow()
  })

  it("parses created_at when present and tolerates its absence", () => {
    expect(
      TemplateVersionDetailSchema.parse({
        ...validDetail,
        created_at: "2026-06-12T14:32:00Z",
      }).created_at
    ).toBe("2026-06-12T14:32:00Z")
    expect(
      TemplateVersionDetailSchema.parse(validDetail).created_at
    ).toBeUndefined()
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

  // Product-level, not version-level — same field TemplateListItemSchema carries, now also
  // on the version detail response so ProductTemplatePublishedActions can offer
  // Deactivate/Activate without a second fetch.
  it("defaults product_status to active when the BE omits it", () => {
    expect(TemplateVersionDetailSchema.parse(validDetail).product_status).toBe(
      "active"
    )
  })

  it("keeps the product_status the BE returns", () => {
    expect(
      TemplateVersionDetailSchema.parse({
        ...validDetail,
        product_status: "deactivated",
      }).product_status
    ).toBe("deactivated")
  })

  it("rejects an unknown refinancing_form", () => {
    expect(() =>
      TemplateVersionDetailSchema.parse({
        ...validDetail,
        refinancing_form: "unknown_type",
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

  it("rejects a version_status outside TemplateStatus", () => {
    expect(() =>
      NewVersionCreatedResponseSchema.parse({
        ...validNewVersionResponse,
        version_status: "awaiting_countersignature",
      })
    ).toThrow()
  })
})

describe("TerminateTemplateVersionRequestSchema / TerminateTemplateVersionResponseSchema", () => {
  // Bounds are asserted against the shared constants, not repeated literals, so the schema
  // and the textarea's maxLength can never drift from what these tests claim.
  it("accepts a justification at the minimum length", () => {
    expect(() =>
      TerminateTemplateVersionRequestSchema.parse({
        justification: "a".repeat(TERMINATION_JUSTIFICATION_MIN_LENGTH),
      })
    ).not.toThrow()
  })

  it("rejects a justification one character under the minimum", () => {
    expect(() =>
      TerminateTemplateVersionRequestSchema.parse({
        justification: "a".repeat(TERMINATION_JUSTIFICATION_MIN_LENGTH - 1),
      })
    ).toThrow()
  })

  it("accepts a justification at the maximum length", () => {
    expect(() =>
      TerminateTemplateVersionRequestSchema.parse({
        justification: "a".repeat(TERMINATION_JUSTIFICATION_MAX_LENGTH),
      })
    ).not.toThrow()
  })

  it("rejects a justification one character over the maximum", () => {
    expect(() =>
      TerminateTemplateVersionRequestSchema.parse({
        justification: "a".repeat(TERMINATION_JUSTIFICATION_MAX_LENGTH + 1),
      })
    ).toThrow()
  })

  const validTerminateResponse = {
    version_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    version_status: "terminated",
    terminated_at: "2026-07-14T11:23:00Z",
    terminated_by: "c1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  }

  it("accepts a valid terminate response", () => {
    expect(() =>
      TerminateTemplateVersionResponseSchema.parse(validTerminateResponse)
    ).not.toThrow()
  })

  it("rejects a non-UUID terminated_by", () => {
    expect(() =>
      TerminateTemplateVersionResponseSchema.parse({
        ...validTerminateResponse,
        terminated_by: "not-a-uuid",
      })
    ).toThrow()
  })

  it("rejects a version_status outside TemplateStatus", () => {
    expect(() =>
      TerminateTemplateVersionResponseSchema.parse({
        ...validTerminateResponse,
        version_status: "deprecated",
      })
    ).toThrow()
  })
})

describe("DeactivateProductTemplateRequestSchema / ProductStatusResponseSchema", () => {
  // Bounds are asserted against the shared constants, not repeated literals, so the schema
  // and the textarea's maxLength can never drift from what these tests claim.
  it("accepts a reason at the minimum length", () => {
    expect(() =>
      DeactivateProductTemplateRequestSchema.parse({
        reason: "a".repeat(DEACTIVATION_REASON_MIN_LENGTH),
      })
    ).not.toThrow()
  })

  it("rejects a reason one character under the minimum", () => {
    expect(() =>
      DeactivateProductTemplateRequestSchema.parse({
        reason: "a".repeat(DEACTIVATION_REASON_MIN_LENGTH - 1),
      })
    ).toThrow()
  })

  it("accepts a reason at the maximum length", () => {
    expect(() =>
      DeactivateProductTemplateRequestSchema.parse({
        reason: "a".repeat(DEACTIVATION_REASON_MAX_LENGTH),
      })
    ).not.toThrow()
  })

  it("rejects a reason one character over the maximum", () => {
    expect(() =>
      DeactivateProductTemplateRequestSchema.parse({
        reason: "a".repeat(DEACTIVATION_REASON_MAX_LENGTH + 1),
      })
    ).toThrow()
  })

  const validProductStatusResponse = {
    template_id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    product_status: "deactivated",
  }

  it("accepts a valid product status response", () => {
    expect(() =>
      ProductStatusResponseSchema.parse(validProductStatusResponse)
    ).not.toThrow()
  })

  it("defaults affected_framework_agreements to an empty array when omitted", () => {
    expect(
      ProductStatusResponseSchema.parse(validProductStatusResponse)
        .affected_framework_agreements
    ).toEqual([])
  })

  it("keeps the affected_framework_agreements the BE returns", () => {
    expect(
      ProductStatusResponseSchema.parse({
        ...validProductStatusResponse,
        affected_framework_agreements: ["FA-00042"],
      }).affected_framework_agreements
    ).toEqual(["FA-00042"])
  })

  it("rejects a non-UUID template_id", () => {
    expect(() =>
      ProductStatusResponseSchema.parse({
        ...validProductStatusResponse,
        template_id: "not-a-uuid",
      })
    ).toThrow()
  })
})

describe("TemplateCurrentVersionSummarySchema / TemplateListItemSchema / TemplateListResponseSchema", () => {
  const validCurrentVersion = {
    version_id: "f7a5c6b8-cdae-4f55-af6e-5d6e7f8a9b01",
    version_number: "1.0",
    version_status: "active",
    refinancing_form: "annuity",
    legal_structure: "loan_credit",
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
        activated_by: {
          id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          display_name: "Anna Kowalski",
        },
        activated_at: "2026-05-22T14:30:00Z",
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

  // refinancing_form replaced the former financing_type + calculation_model pair on this
  // summary only (CR-BPT-08 item 7) — three values, not the old six.
  it("rejects a financing_type value that predates refinancing_form", () => {
    expect(() =>
      TemplateCurrentVersionSummarySchema.parse({
        ...validCurrentVersion,
        refinancing_form: "full_refinancing",
      })
    ).toThrow()
  })

  const validListItem = {
    id: "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    template_code: "REFI-FULL-STD",
    template_name: "Full refinancing standard",
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

  it("defaults product_status to active when the BE omits it", () => {
    expect(TemplateListItemSchema.parse(validListItem).product_status).toBe(
      "active"
    )
  })

  it("keeps the product_status the BE returns", () => {
    expect(
      TemplateListItemSchema.parse({
        ...validListItem,
        product_status: "deactivated",
      }).product_status
    ).toBe("deactivated")
  })

  it("accepts a list item carrying a template_name", () => {
    expect(
      TemplateListItemSchema.parse({
        ...validListItem,
        template_name: "Refinancing Standard",
      }).template_name
    ).toBe("Refinancing Standard")
  })

  // Serialized unconditionally since PRD1042-1649 — a payload without the key is a
  // contract violation, not the pre-1649 fallback case that null now covers.
  it("rejects a list item missing template_name", () => {
    const rest = { ...validListItem } as Record<string, unknown>
    delete rest.template_name
    expect(() => TemplateListItemSchema.parse(rest)).toThrow()
  })

  it("accepts a null template_name", () => {
    expect(
      TemplateListItemSchema.parse({ ...validListItem, template_name: null })
        .template_name
    ).toBeNull()
  })

  it("rejects a non-string template_name", () => {
    expect(() =>
      TemplateListItemSchema.parse({ ...validListItem, template_name: 42 })
    ).toThrow()
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
