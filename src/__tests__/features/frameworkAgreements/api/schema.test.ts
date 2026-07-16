import { describe, it, expect } from "vitest"
import {
  ActivateFARequestSchema,
  CreateFARequestSchema,
  EditFrameworkAgreementFormSchema,
  FADetailResponseSchema,
  FADraftResponseSchema,
  FAListItemSchema,
  FAListResponseSchema,
  FAReactivatedResponseSchema,
  FASuspendedResponseSchema,
  FATerminatedResponseSchema,
  FAUtilizationResponseSchema,
  FrameworkAgreementWizardFormSchema,
  ReactivateFARequestSchema,
  SelectableTemplateItemSchema,
  SelectableTemplatesResponseSchema,
  SuspendFARequestSchema,
  TerminateFARequestSchema,
  TerminationReadinessResponseSchema,
  UpdateFARequestSchema,
} from "@/features/frameworkAgreements/api/schema"

const validCreateRequest = {
  agreement_name: "RV-SSKM-2026-001",
  lc_partner_id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
  bank_entity: "sparkasse",
  max_volume_eur: 25000000,
  base_rate: 4.25,
  spread: 0.5,
  rate_type: "fixed",
  effective_rate: 4.75,
  rate_lock_period_months: 12,
  valid_from: "2026-06-01",
  product_template_ids: ["b3e1c9a0-1111-4a2b-8c3d-000000000002"],
}

describe("CreateFARequestSchema", () => {
  it("accepts a fully valid payload", () => {
    expect(() => CreateFARequestSchema.parse(validCreateRequest)).not.toThrow()
  })

  it("accepts optional fields when present", () => {
    expect(() =>
      CreateFARequestSchema.parse({
        ...validCreateRequest,
        lg_coverage_rate_override: 4.3,
        valid_until: "2028-06-01",
        special_conditions: "Pending credit review",
      })
    ).not.toThrow()
  })

  it.each([
    "agreement_name",
    "lc_partner_id",
    "bank_entity",
    "max_volume_eur",
    "base_rate",
    "spread",
    "rate_type",
    "rate_lock_period_months",
    "valid_from",
    "product_template_ids",
  ])("rejects a payload missing required field %s", field => {
    const rest = { ...validCreateRequest } as Record<string, unknown>
    delete rest[field]
    expect(() => CreateFARequestSchema.parse(rest)).toThrow()
  })

  it("rejects a non-positive max_volume_eur", () => {
    expect(() =>
      CreateFARequestSchema.parse({ ...validCreateRequest, max_volume_eur: 0 })
    ).toThrow()
  })

  it("rejects base_rate outside 0-25", () => {
    expect(() =>
      CreateFARequestSchema.parse({ ...validCreateRequest, base_rate: 30 })
    ).toThrow()
  })

  it("rejects spread outside -5 to 15", () => {
    expect(() =>
      CreateFARequestSchema.parse({ ...validCreateRequest, spread: 20 })
    ).toThrow()
  })

  it("rejects an empty product_template_ids array", () => {
    expect(() =>
      CreateFARequestSchema.parse({
        ...validCreateRequest,
        product_template_ids: [],
      })
    ).toThrow()
  })

  it("rejects an unknown bank_entity", () => {
    expect(() =>
      CreateFARequestSchema.parse({
        ...validCreateRequest,
        bank_entity: "unknown_bank",
      })
    ).toThrow()
  })
})

describe("FADraftResponseSchema", () => {
  const validResponse = {
    id: "b3e1c9a0-1111-4a2b-8c3d-000000000003",
    agreement_name: "RV-SSKM-2026-001",
    lc_partner_id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
    bank_entity: "sparkasse",
    currency: "EUR",
    status: "draft",
    max_volume_eur: 25000000,
    base_rate: 4.25,
    spread: 0.5,
    effective_rate: 4.75,
    rate_type: "fixed",
    rate_lock_period_months: 12,
    lg_coverage_rate_override: null,
    valid_from: "2026-06-01",
    valid_until: null,
    special_conditions: null,
    product_template_ids: ["b3e1c9a0-1111-4a2b-8c3d-000000000002"],
    edit_version_counter: 0,
    created_by: "b3e1c9a0-1111-4a2b-8c3d-000000000004",
    created_at: "2026-06-01T10:00:00Z",
    updated_at: "2026-06-01T10:00:00Z",
  }

  it("accepts a valid draft response", () => {
    expect(() => FADraftResponseSchema.parse(validResponse)).not.toThrow()
  })

  it("rejects an unknown status", () => {
    expect(() =>
      FADraftResponseSchema.parse({ ...validResponse, status: "unknown" })
    ).toThrow()
  })

  it("coerces numeric-string decimal fields", () => {
    const parsed = FADraftResponseSchema.parse({
      ...validResponse,
      max_volume_eur: "25000000.00",
    })
    expect(parsed.max_volume_eur).toBe(25000000)
  })
})

describe("UpdateFARequestSchema", () => {
  it("accepts a fully populated payload", () => {
    expect(() =>
      UpdateFARequestSchema.parse({
        agreement_name: "RV-SSKM-2026-002",
        max_volume_eur: 30000000,
        base_rate: 4.5,
        spread: 0.6,
        rate_type: "floating",
        effective_rate: 5.1,
        rate_lock_period_months: 24,
        lg_coverage_rate_override: 4.4,
        valid_from: "2026-06-01",
        valid_until: "2029-06-01",
        special_conditions: "Reviewed annually",
        product_template_ids: ["b3e1c9a0-1111-4a2b-8c3d-000000000002"],
        justification: "Adjusting envelope after annual credit review",
        expected_version: 3,
      })
    ).not.toThrow()
  })

  it("accepts a partial payload — every field is independently optional", () => {
    expect(() =>
      UpdateFARequestSchema.parse({ max_volume_eur: 30000000 })
    ).not.toThrow()
  })

  it("accepts an empty payload", () => {
    expect(() => UpdateFARequestSchema.parse({})).not.toThrow()
  })

  it("rejects an unknown rate_type", () => {
    expect(() =>
      UpdateFARequestSchema.parse({ rate_type: "unknown_rate" })
    ).toThrow()
  })

  it.each([
    ["base_rate", 30],
    ["spread", 20],
    ["rate_lock_period_months", 400],
    ["max_volume_eur", 0],
  ])("rejects out-of-range %s", (field, value) => {
    expect(() =>
      UpdateFARequestSchema.parse({ [field as string]: value })
    ).toThrow()
  })

  it("rejects a justification shorter than 30 characters", () => {
    expect(() =>
      UpdateFARequestSchema.parse({ justification: "too short" })
    ).toThrow()
  })

  it("accepts a payload with justification omitted", () => {
    expect(() =>
      UpdateFARequestSchema.parse({ max_volume_eur: 30000000 })
    ).not.toThrow()
  })

  it("rejects an empty product_template_ids array", () => {
    expect(() =>
      UpdateFARequestSchema.parse({ product_template_ids: [] })
    ).toThrow()
  })

  it("rejects a non-numeric expected_version", () => {
    expect(() =>
      UpdateFARequestSchema.parse({ expected_version: "3" })
    ).toThrow()
  })

  it("accepts a numeric expected_version", () => {
    expect(() =>
      UpdateFARequestSchema.parse({ expected_version: 3 })
    ).not.toThrow()
  })
})

describe("EditFrameworkAgreementFormSchema", () => {
  const validEditForm = {
    agreement_name: "RV-SSKM-2026-002",
    max_volume_eur: 30000000,
    base_rate: 4.5,
    spread: 0.6,
    rate_type: "floating",
    effective_rate: 5.1,
    rate_lock_period_months: 24,
    valid_from: "2026-06-01",
    product_template_ids: ["b3e1c9a0-1111-4a2b-8c3d-000000000002"],
    justification: "Adjusting envelope after annual credit review",
    expected_version: 3,
  }

  it("accepts a fully valid form", () => {
    expect(() =>
      EditFrameworkAgreementFormSchema.parse(validEditForm)
    ).not.toThrow()
  })

  it("rejects a missing justification", () => {
    const rest = { ...validEditForm } as Record<string, unknown>
    delete rest.justification
    expect(() => EditFrameworkAgreementFormSchema.parse(rest)).toThrow()
  })

  it("rejects a justification shorter than 30 characters", () => {
    expect(() =>
      EditFrameworkAgreementFormSchema.parse({
        ...validEditForm,
        justification: "too short",
      })
    ).toThrow()
  })

  it("rejects an empty product_template_ids array", () => {
    expect(() =>
      EditFrameworkAgreementFormSchema.parse({
        ...validEditForm,
        product_template_ids: [],
      })
    ).toThrow()
  })

  it("rejects valid_until before valid_from", () => {
    expect(() =>
      EditFrameworkAgreementFormSchema.parse({
        ...validEditForm,
        valid_until: "2025-01-01",
      })
    ).toThrow()
  })

  it("accepts valid_until on or after valid_from", () => {
    expect(() =>
      EditFrameworkAgreementFormSchema.parse({
        ...validEditForm,
        valid_until: "2029-06-01",
      })
    ).not.toThrow()
  })
})

describe("ActivateFARequestSchema", () => {
  it("accepts a valid activation payload", () => {
    expect(() =>
      ActivateFARequestSchema.parse({
        documents_confirmed: true,
        justification: "All framework documents attached and reviewed",
      })
    ).not.toThrow()
  })

  it("rejects a justification shorter than 20 characters", () => {
    expect(() =>
      ActivateFARequestSchema.parse({
        documents_confirmed: true,
        justification: "too short",
      })
    ).toThrow()
  })

  it("rejects a missing documents_confirmed", () => {
    expect(() =>
      ActivateFARequestSchema.parse({
        justification: "All framework documents attached and reviewed",
      })
    ).toThrow()
  })
})

describe("FAListItemSchema / FAListResponseSchema", () => {
  const validItem = {
    id: "b3e1c9a0-1111-4a2b-8c3d-000000000003",
    agreement_name: "RV-SSKM-2026-001",
    lc_partner_id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
    lc_partner_name: "New Group Trade",
    bank_entity: "sparkasse",
    status: "active",
    valid_from: "2026-06-01",
    valid_until: null,
    utilization_pct: null,
    limit_breach: null,
  }

  it("accepts a valid list item with null utilization/limit_breach", () => {
    expect(() => FAListItemSchema.parse(validItem)).not.toThrow()
  })

  it("accepts a full list response", () => {
    expect(() =>
      FAListResponseSchema.parse({
        items: [validItem],
        total: 1,
        page: 1,
        per_page: 25,
        total_pages: 1,
      })
    ).not.toThrow()
  })

  it("rejects an unknown status", () => {
    expect(() =>
      FAListItemSchema.parse({ ...validItem, status: "unknown" })
    ).toThrow()
  })
})

describe("SelectableTemplateItemSchema / SelectableTemplatesResponseSchema", () => {
  const validItem = {
    template_id: "b3e1c9a0-1111-4a2b-8c3d-000000000002",
    template_name: "Test Refinancing Template",
    version_number: "0.1",
  }

  it("accepts a valid item using the wire field name template_id", () => {
    expect(() => SelectableTemplateItemSchema.parse(validItem)).not.toThrow()
  })

  it("rejects the old id field in place of template_id", () => {
    expect(() =>
      SelectableTemplateItemSchema.parse({
        id: "b3e1c9a0-1111-4a2b-8c3d-000000000002",
        template_name: validItem.template_name,
        version_number: validItem.version_number,
      })
    ).toThrow()
  })

  it("rejects a missing template_name", () => {
    expect(() =>
      SelectableTemplateItemSchema.parse({
        template_id: validItem.template_id,
        version_number: validItem.version_number,
      })
    ).toThrow()
  })

  it("rejects a missing version_number", () => {
    expect(() =>
      SelectableTemplateItemSchema.parse({
        template_id: validItem.template_id,
        template_name: validItem.template_name,
      })
    ).toThrow()
  })

  it("accepts a full selectable templates response", () => {
    expect(() =>
      SelectableTemplatesResponseSchema.parse({ items: [validItem] })
    ).not.toThrow()
  })
})

describe("FADetailResponseSchema", () => {
  const baseDetail = {
    id: "b3e1c9a0-1111-4a2b-8c3d-000000000003",
    agreement_name: "RV-SSKM-2026-001",
    lc_partner_id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
    lc_partner_name: "New Group Trade",
    status: "active",
    currency: "EUR",
    max_volume_eur: 25000000,
    valid_from: "2026-06-01",
    valid_until: null,
    edit_version_counter: 0,
    product_template_ids: [],
    document_count: 1,
    linked_financings_count: 0,
    utilization_pct: null,
    limit_available: null,
    limit_breach: null,
    bank_entity: null,
    base_rate: null,
    spread: null,
    effective_rate: null,
    rate_type: null,
    rate_lock_period_months: null,
    lg_coverage_rate_override: null,
    special_conditions: null,
    effective_from: null,
    activated_at: null,
    activated_by: null,
    activated_by_name: null,
    suspended_at: null,
    suspended_by: null,
    terminated_at: null,
    terminated_by: null,
    created_by: null,
    created_by_name: null,
    created_at: "2026-06-01T10:00:00Z",
  }

  it("accepts a fully role-nulled response (front_office/LC/support view)", () => {
    expect(() => FADetailResponseSchema.parse(baseDetail)).not.toThrow()
  })

  it("accepts a fully populated response (Bank Admin view)", () => {
    expect(() =>
      FADetailResponseSchema.parse({
        ...baseDetail,
        bank_entity: "sparkasse",
        base_rate: 4.25,
        spread: 0.5,
        effective_rate: 4.75,
        rate_type: "fixed",
        rate_lock_period_months: 12,
        created_by: "b3e1c9a0-1111-4a2b-8c3d-000000000004",
        created_by_name: "Vincent Brooke",
      })
    ).not.toThrow()
  })

  it("rejects a missing required id", () => {
    const rest = { ...baseDetail } as Record<string, unknown>
    delete rest.id
    expect(() => FADetailResponseSchema.parse(rest)).toThrow()
  })
})

describe("FrameworkAgreementWizardFormSchema", () => {
  const validForm = {
    agreement_name: "RV-SSKM-2026-001",
    lc_partner_id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
    bank_entity: "sparkasse",
    max_volume_eur: 25000000,
    base_rate: 4.25,
    spread: 0.5,
    rate_type: "fixed",
    effective_rate: 4.75,
    rate_lock_period_months: 12,
    valid_from: "2026-06-01",
    product_template_ids: ["b3e1c9a0-1111-4a2b-8c3d-000000000002"],
  }

  it("accepts a fully valid wizard form", () => {
    expect(() =>
      FrameworkAgreementWizardFormSchema.parse(validForm)
    ).not.toThrow()
  })

  it("rejects an empty product_template_ids array", () => {
    expect(() =>
      FrameworkAgreementWizardFormSchema.parse({
        ...validForm,
        product_template_ids: [],
      })
    ).toThrow()
  })

  it("rejects valid_until before valid_from", () => {
    expect(() =>
      FrameworkAgreementWizardFormSchema.parse({
        ...validForm,
        valid_until: "2025-01-01",
      })
    ).toThrow()
  })

  it("accepts valid_until on or after valid_from", () => {
    expect(() =>
      FrameworkAgreementWizardFormSchema.parse({
        ...validForm,
        valid_until: "2028-06-01",
      })
    ).not.toThrow()
  })
})

describe("SuspendFARequestSchema / FASuspendedResponseSchema", () => {
  it("accepts a valid suspend request", () => {
    expect(() =>
      SuspendFARequestSchema.parse({
        justification: "Suspending due to a covenant breach under review.",
      })
    ).not.toThrow()
  })

  it("rejects a justification shorter than 20 characters", () => {
    expect(() =>
      SuspendFARequestSchema.parse({ justification: "too short" })
    ).toThrow()
  })

  it("accepts a valid suspended response", () => {
    expect(() =>
      FASuspendedResponseSchema.parse({
        id: "b3e1c9a0-1111-4a2b-8c3d-000000000003",
        status: "suspended",
        suspended_at: "2026-06-01T10:00:00Z",
      })
    ).not.toThrow()
  })
})

describe("ReactivateFARequestSchema / FAReactivatedResponseSchema", () => {
  it("accepts a valid reactivate request", () => {
    expect(() =>
      ReactivateFARequestSchema.parse({
        justification: "Reactivating after covenant remediation confirmed.",
        re_validation_confirmed: true,
      })
    ).not.toThrow()
  })

  it("rejects a missing re_validation_confirmed", () => {
    expect(() =>
      ReactivateFARequestSchema.parse({
        justification: "Reactivating after covenant remediation confirmed.",
      })
    ).toThrow()
  })

  it("accepts a valid reactivated response", () => {
    expect(() =>
      FAReactivatedResponseSchema.parse({
        id: "b3e1c9a0-1111-4a2b-8c3d-000000000003",
        status: "active",
        reactivated_at: "2026-06-01T10:00:00Z",
      })
    ).not.toThrow()
  })
})

describe("TerminateFARequestSchema / FATerminatedResponseSchema", () => {
  it("accepts a valid terminate request", () => {
    expect(() =>
      TerminateFARequestSchema.parse({
        justification:
          "Terminating at the leasing company's request, confirmed by legal.",
        irreversibility_confirmed: true,
      })
    ).not.toThrow()
  })

  it("rejects a justification shorter than 30 characters", () => {
    expect(() =>
      TerminateFARequestSchema.parse({
        justification: "Too short for termination",
        irreversibility_confirmed: true,
      })
    ).toThrow()
  })

  it("rejects a missing irreversibility_confirmed", () => {
    expect(() =>
      TerminateFARequestSchema.parse({
        justification:
          "Terminating at the leasing company's request, confirmed by legal.",
      })
    ).toThrow()
  })

  it("accepts a valid terminated response", () => {
    expect(() =>
      FATerminatedResponseSchema.parse({
        id: "b3e1c9a0-1111-4a2b-8c3d-000000000003",
        status: "terminated",
        terminated_at: "2026-06-01T10:00:00Z",
      })
    ).not.toThrow()
  })
})

describe("TerminationReadinessResponseSchema", () => {
  it("accepts a ready-to-terminate response", () => {
    expect(() =>
      TerminationReadinessResponseSchema.parse({
        can_terminate: true,
        blocking_financing_count: 0,
        blocking_financings: [],
      })
    ).not.toThrow()
  })

  it("accepts a blocked response with blocking financings", () => {
    expect(() =>
      TerminationReadinessResponseSchema.parse({
        can_terminate: false,
        blocking_financing_count: 2,
        blocking_financings: [{ id: "fin-1" }, { id: "fin-2" }],
      })
    ).not.toThrow()
  })

  it("rejects a missing can_terminate", () => {
    expect(() =>
      TerminationReadinessResponseSchema.parse({
        blocking_financing_count: 0,
        blocking_financings: [],
      })
    ).toThrow()
  })
})

describe("FAUtilizationResponseSchema", () => {
  it("accepts a minimal response with only max_volume_eur populated", () => {
    expect(() =>
      FAUtilizationResponseSchema.parse({
        max_volume_eur: "25000000",
        disbursed_volume_eur: null,
        redeemed_volume_eur: null,
        net_exposure_eur: null,
        available_volume_eur: null,
        utilization_pct: null,
        limit_available_flag: null,
        limit_breach_flag: null,
        last_refreshed_at: null,
        source: "limit_management",
        available: false,
      })
    ).not.toThrow()
  })

  it("rejects a missing max_volume_eur", () => {
    expect(() =>
      FAUtilizationResponseSchema.parse({
        disbursed_volume_eur: null,
        redeemed_volume_eur: null,
        net_exposure_eur: null,
        available_volume_eur: null,
        utilization_pct: null,
        limit_available_flag: null,
        limit_breach_flag: null,
        last_refreshed_at: null,
        source: "limit_management",
        available: false,
      })
    ).toThrow()
  })
})
