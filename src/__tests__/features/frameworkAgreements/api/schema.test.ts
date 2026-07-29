import { describe, it, expect } from "vitest"
import {
  ActivateFARequestSchema,
  CreateFARequestSchema,
  DownloadURLResponseSchema,
  EditFrameworkAgreementFormSchema,
  FAAuditEventResponseSchema,
  FAAuditHistoryResponseSchema,
  FADetailResponseSchema,
  FADocumentListResponseSchema,
  FADraftResponseSchema,
  FAEventTypeFilterSchema,
  FALCPartnerItemSchema,
  FALCPartnersResponseSchema,
  FALinkedFinancingsResponseSchema,
  FAListItemSchema,
  FAListResponseSchema,
  FAReactivatedResponseSchema,
  FAReconstructResponseSchema,
  FASuspendedResponseSchema,
  FATerminatedResponseSchema,
  FAUtilizationResponseSchema,
  FieldDiffItemSchema,
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
  effective_rate: 4.75,
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
        vfe_rate: 2.5,
        valid_until: "2028-06-01",
        special_conditions: "Pending credit review",
      })
    ).not.toThrow()
  })

  it("rejects vfe_rate outside 0-100", () => {
    expect(() =>
      CreateFARequestSchema.parse({ ...validCreateRequest, vfe_rate: 150 })
    ).toThrow()
  })

  // CreateFARequest declares effective_rate = Field(ge=0, le=25) — the FE bound must
  // match, or an out-of-range rate only fails at the API as a 422.
  it.each([-0.1, 25.1, 100])("rejects effective_rate %s", rate => {
    expect(() =>
      CreateFARequestSchema.parse({
        ...validCreateRequest,
        effective_rate: rate,
      })
    ).toThrow()
  })

  it.each([0, 25])("accepts effective_rate at the %s bound", rate => {
    expect(() =>
      CreateFARequestSchema.parse({
        ...validCreateRequest,
        effective_rate: rate,
      })
    ).not.toThrow()
  })

  it("strips lg_coverage_rate_override — not in v9's field list (CR PRD1042-1552 A4)", () => {
    const parsed = CreateFARequestSchema.parse({
      ...validCreateRequest,
      lg_coverage_rate_override: 4.3,
    }) as Record<string, unknown>
    expect(parsed.lg_coverage_rate_override).toBeUndefined()
  })

  it.each([
    "agreement_name",
    "lc_partner_id",
    "bank_entity",
    "max_volume_eur",
    "effective_rate",
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

  it("strips base_rate/spread/rate_type/rate_lock_period_months — create takes one hand-entered rate (CR PRD1042-1552 A1-A2)", () => {
    const parsed = CreateFARequestSchema.parse({
      ...validCreateRequest,
      base_rate: 4.25,
      spread: 0.5,
      rate_type: "fixed",
      rate_lock_period_months: 12,
    }) as Record<string, unknown>
    expect(parsed.base_rate).toBeUndefined()
    expect(parsed.spread).toBeUndefined()
    expect(parsed.rate_type).toBeUndefined()
    expect(parsed.rate_lock_period_months).toBeUndefined()
    expect(parsed.effective_rate).toBe(4.75)
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
    effective_rate: 4.75,
    vfe_rate: null,
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

  // Regression: the BE trimmed these out of FADraftResponse under CR A1/A4. While the
  // schema still declared them required, every create/activate/update threw on parse.
  it("does not require the trimmed pricing fields the BE no longer returns", () => {
    const parsed = FADraftResponseSchema.parse(validResponse) as Record<
      string,
      unknown
    >
    expect(parsed.base_rate).toBeUndefined()
    expect(parsed.spread).toBeUndefined()
    expect(parsed.rate_type).toBeUndefined()
    expect(parsed.rate_lock_period_months).toBeUndefined()
    expect(parsed.lg_coverage_rate_override).toBeUndefined()
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
        effective_rate: 5.1,
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

  it.each([
    { effective_rate: 25.1 },
    { effective_rate: -1 },
    { vfe_rate: 100.5 },
  ])("rejects an out-of-range rate: %o", payload => {
    expect(() => UpdateFARequestSchema.parse(payload)).toThrow()
  })

  it("strips rate_type — pricing trimmed to effective_rate only (CR PRD1042-1552 A1-A3)", () => {
    const parsed = UpdateFARequestSchema.parse({
      rate_type: "unknown_rate",
    }) as Record<string, unknown>
    expect(parsed.rate_type).toBeUndefined()
  })

  it("rejects a non-positive max_volume_eur", () => {
    expect(() => UpdateFARequestSchema.parse({ max_volume_eur: 0 })).toThrow()
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
    effective_rate: 5.1,
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

  it("accepts valid_until after valid_from", () => {
    expect(() =>
      EditFrameworkAgreementFormSchema.parse({
        ...validEditForm,
        valid_until: "2029-06-01",
      })
    ).not.toThrow()
  })

  // UpdateFARequest raises "valid_until must be after valid_from" on equal dates,
  // so the form must reject them rather than let the API 422 (PRD1042-1652).
  it("rejects valid_until equal to valid_from", () => {
    expect(() =>
      EditFrameworkAgreementFormSchema.parse({
        ...validEditForm,
        valid_until: validEditForm.valid_from,
      })
    ).toThrow()
  })

  // Same i18n contract as the wizard: an out-of-range rate must carry a message code
  // the resolver translates, not Zod's untranslated default.
  it.each([
    { field: "effective_rate", value: 26, code: "effectiveRateRange" },
    { field: "effective_rate", value: -1, code: "effectiveRateRange" },
    { field: "vfe_rate", value: 101, code: "vfeRateRange" },
  ])("reports '$code' when $field is $value", ({ field, value, code }) => {
    const result = EditFrameworkAgreementFormSchema.safeParse({
      ...validEditForm,
      [field]: value,
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.find(i => i.path[0] === field)?.message).toBe(
      code
    )
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
    is_expired: false,
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

describe("FADocumentListResponseSchema", () => {
  const validDocument = {
    id: "b3e1c9a0-1111-4a2b-8c3d-000000000005",
    framework_agreement_id: "b3e1c9a0-1111-4a2b-8c3d-000000000003",
    document_type: "original_agreement",
    document_label: "Signed original",
    file_name: "agreement.pdf",
    file_size_bytes: 102400,
    mime_type: "application/pdf",
    lc_visible: true,
    uploaded_by: "b3e1c9a0-1111-4a2b-8c3d-000000000004",
    uploaded_at: "2026-06-01T10:00:00Z",
  }

  it("accepts a valid array of documents", () => {
    const parsed = FADocumentListResponseSchema.parse([
      validDocument,
      { ...validDocument, id: "b3e1c9a0-1111-4a2b-8c3d-000000000006" },
    ])
    expect(parsed).toHaveLength(2)
  })

  it("accepts an empty array", () => {
    expect(() => FADocumentListResponseSchema.parse([])).not.toThrow()
  })

  it("rejects a wrapped {items: [...]} shape", () => {
    expect(
      FADocumentListResponseSchema.safeParse({ items: [validDocument] }).success
    ).toBe(false)
  })

  it("rejects an array item missing a required field", () => {
    const rest = { ...validDocument } as Record<string, unknown>
    delete rest.document_type
    expect(() => FADocumentListResponseSchema.parse([rest])).toThrow()
  })
})

describe("DownloadURLResponseSchema", () => {
  it("accepts a valid download-url response", () => {
    expect(() =>
      DownloadURLResponseSchema.parse({
        url: "https://example.com/signed-url",
        expires_in_seconds: 300,
      })
    ).not.toThrow()
  })

  it("rejects a non-integer expires_in_seconds", () => {
    expect(() =>
      DownloadURLResponseSchema.parse({
        url: "https://example.com/signed-url",
        expires_in_seconds: 300.5,
      })
    ).toThrow()
  })

  it("rejects a missing url", () => {
    expect(() =>
      DownloadURLResponseSchema.parse({ expires_in_seconds: 300 })
    ).toThrow()
  })
})

describe("FADetailResponseSchema", () => {
  const baseDetail = {
    id: "b3e1c9a0-1111-4a2b-8c3d-000000000003",
    agreement_name: "RV-SSKM-2026-001",
    lc_partner_id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
    lc_partner_name: "New Group Trade",
    status: "active",
    is_expired: false,
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
    effective_rate: null,
    vfe_rate: null,
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
        effective_rate: 4.75,
        vfe_rate: "1.5000",
        created_by: "b3e1c9a0-1111-4a2b-8c3d-000000000004",
        created_by_name: "Vincent Brooke",
      })
    ).not.toThrow()
  })

  it("coerces a numeric-string vfe_rate and accepts null", () => {
    expect(
      FADetailResponseSchema.parse({ ...baseDetail, vfe_rate: "2.5000" })
        .vfe_rate
    ).toBe(2.5)
    expect(FADetailResponseSchema.parse(baseDetail).vfe_rate).toBeNull()
  })

  it("rejects a missing required id", () => {
    const rest = { ...baseDetail } as Record<string, unknown>
    delete rest.id
    expect(() => FADetailResponseSchema.parse(rest)).toThrow()
  })

  it("strips base_rate/spread/rate_type/rate_lock_period_months/lg_coverage_rate_override — trimmed to effective_rate + vfe_rate (CR PRD1042-1552 A1-A4)", () => {
    const parsed = FADetailResponseSchema.parse({
      ...baseDetail,
      base_rate: 4.25,
      spread: 0.5,
      rate_type: "fixed",
      rate_lock_period_months: 12,
      lg_coverage_rate_override: 4.3,
    }) as Record<string, unknown>
    expect(parsed.base_rate).toBeUndefined()
    expect(parsed.spread).toBeUndefined()
    expect(parsed.rate_type).toBeUndefined()
    expect(parsed.rate_lock_period_months).toBeUndefined()
    expect(parsed.lg_coverage_rate_override).toBeUndefined()
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

  it("accepts valid_until after valid_from", () => {
    expect(() =>
      FrameworkAgreementWizardFormSchema.parse({
        ...validForm,
        valid_until: "2028-06-01",
      })
    ).not.toThrow()
  })

  // CreateFARequest raises "valid_until must be after valid_from" on equal dates
  // (PRD1042-1652) — the wizard must not let that reach the API.
  it("rejects valid_until equal to valid_from", () => {
    expect(() =>
      FrameworkAgreementWizardFormSchema.parse({
        ...validForm,
        valid_until: validForm.valid_from,
      })
    ).toThrow()
  })

  // Guards the i18n contract: resolveFrameworkAgreementFieldError only translates
  // known message codes and returns anything else verbatim, so an untranslated Zod
  // default here would be rendered to the user (PRD1042-1653).
  it.each(["max_volume_eur", "effective_rate"])(
    "reports a translatable 'required' message when %s is missing",
    field => {
      const payload = { ...validForm } as Record<string, unknown>
      delete payload[field]
      const result = FrameworkAgreementWizardFormSchema.safeParse(payload)
      expect(result.success).toBe(false)
      const issue = result.error!.issues.find(i => i.path[0] === field)
      expect(issue?.message).toBe("required")
    }
  )

  it.each([
    { field: "effective_rate", value: 26, code: "effectiveRateRange" },
    { field: "vfe_rate", value: 101, code: "vfeRateRange" },
  ])("reports '$code' when $field is $value", ({ field, value, code }) => {
    const result = FrameworkAgreementWizardFormSchema.safeParse({
      ...validForm,
      [field]: value,
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues.find(i => i.path[0] === field)?.message).toBe(
      code
    )
  })

  it("reports 'required' for an empty number input coerced to NaN", () => {
    const result = FrameworkAgreementWizardFormSchema.safeParse({
      ...validForm,
      max_volume_eur: Number.NaN,
    })
    expect(result.success).toBe(false)
    expect(
      result.error!.issues.find(i => i.path[0] === "max_volume_eur")?.message
    ).toBe("required")
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

describe("FieldDiffItemSchema", () => {
  it("accepts a diff with scalar old/new values", () => {
    expect(() =>
      FieldDiffItemSchema.parse({
        field: "max_volume_eur",
        old_value: 25000000,
        new_value: 30000000,
      })
    ).not.toThrow()
  })

  it("accepts null old_value (field newly set)", () => {
    expect(() =>
      FieldDiffItemSchema.parse({
        field: "lg_coverage_rate_override",
        old_value: null,
        new_value: 1.5,
      })
    ).not.toThrow()
  })

  it("rejects a missing field name", () => {
    expect(() =>
      FieldDiffItemSchema.parse({
        old_value: 1,
        new_value: 2,
      })
    ).toThrow()
  })
})

const validAuditEvent = {
  id: "b3e1c9a0-1111-4a2b-8c3d-000000000010",
  event_type: "edited",
  actor_id: "b3e1c9a0-1111-4a2b-8c3d-000000000011",
  actor_first_name: "Jane",
  actor_last_name: "Doe",
  actor_type: "user",
  recorded_at: "2026-07-01T10:00:00Z",
  justification: "Updated pricing per client request",
  old_data: { base_rate: 4.0 },
  new_data: { base_rate: 4.25 },
  changed_fields: ["base_rate"],
  field_diffs: [{ field: "base_rate", old_value: 4.0, new_value: 4.25 }],
}

describe("FAAuditEventResponseSchema", () => {
  it("accepts a full field-change event", () => {
    expect(() =>
      FAAuditEventResponseSchema.parse(validAuditEvent)
    ).not.toThrow()
  })

  it("accepts a system-actor event with null actor fields and diffs", () => {
    expect(() =>
      FAAuditEventResponseSchema.parse({
        ...validAuditEvent,
        event_type: "activation_expired",
        actor_id: null,
        actor_first_name: null,
        actor_last_name: null,
        actor_type: "system",
        justification: null,
        old_data: null,
        new_data: null,
        changed_fields: null,
        field_diffs: null,
      })
    ).not.toThrow()
  })

  it("rejects a missing recorded_at", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { recorded_at: _omit, ...rest } = validAuditEvent
    expect(() => FAAuditEventResponseSchema.parse(rest)).toThrow()
  })
})

describe("FAAuditHistoryResponseSchema", () => {
  it("accepts a page with a next_cursor", () => {
    expect(() =>
      FAAuditHistoryResponseSchema.parse({
        items: [validAuditEvent],
        next_cursor: "eyJvZmZzZXQiOjUwfQ==",
      })
    ).not.toThrow()
  })

  it("accepts the last page with next_cursor null", () => {
    expect(() =>
      FAAuditHistoryResponseSchema.parse({
        items: [],
        next_cursor: null,
      })
    ).not.toThrow()
  })

  it("rejects a missing items array", () => {
    expect(() =>
      FAAuditHistoryResponseSchema.parse({ next_cursor: null })
    ).toThrow()
  })
})

describe("FAReconstructResponseSchema", () => {
  it("accepts a reconstructed state snapshot", () => {
    expect(() =>
      FAReconstructResponseSchema.parse({
        fa_id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
        as_of: "2026-06-15T00:00:00Z",
        events_replayed: 4,
        state: { status: "active", max_volume_eur: 25000000 },
      })
    ).not.toThrow()
  })

  it("rejects a missing events_replayed", () => {
    expect(() =>
      FAReconstructResponseSchema.parse({
        fa_id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
        as_of: "2026-06-15T00:00:00Z",
        state: {},
      })
    ).toThrow()
  })
})

describe("FALCPartnerItemSchema / FALCPartnersResponseSchema", () => {
  const validItem = {
    id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
    legal_name: "New Group Trade",
  }

  it("accepts a valid LC partner item", () => {
    expect(() => FALCPartnerItemSchema.parse(validItem)).not.toThrow()
  })

  it("rejects a missing legal_name", () => {
    expect(() => FALCPartnerItemSchema.parse({ id: validItem.id })).toThrow()
  })

  it("rejects a non-uuid id", () => {
    expect(() =>
      FALCPartnerItemSchema.parse({ ...validItem, id: "not-a-uuid" })
    ).toThrow()
  })

  it("accepts a full LC partners response", () => {
    expect(() =>
      FALCPartnersResponseSchema.parse({ items: [validItem] })
    ).not.toThrow()
  })

  it("accepts an empty LC partners response", () => {
    expect(() => FALCPartnersResponseSchema.parse({ items: [] })).not.toThrow()
  })

  it("rejects a missing items array", () => {
    expect(() => FALCPartnersResponseSchema.parse({})).toThrow()
  })
})

describe("FALinkedFinancingsResponseSchema", () => {
  it("accepts an empty linked-financings response", () => {
    expect(() =>
      FALinkedFinancingsResponseSchema.parse({ count: 0, items: [] })
    ).not.toThrow()
  })

  it("accepts a populated linked-financings response with opaque items", () => {
    expect(() =>
      FALinkedFinancingsResponseSchema.parse({
        count: 2,
        items: [{ id: "fin-1" }, { id: "fin-2" }],
      })
    ).not.toThrow()
  })

  it("rejects a missing count", () => {
    expect(() =>
      FALinkedFinancingsResponseSchema.parse({ items: [] })
    ).toThrow()
  })

  it("rejects a non-integer count", () => {
    expect(() =>
      FALinkedFinancingsResponseSchema.parse({ count: 1.5, items: [] })
    ).toThrow()
  })
})

describe("FAEventTypeFilterSchema", () => {
  it.each([
    "draft_created",
    "draft_edited",
    "draft_deleted",
    "document_attached",
    "document_detached",
    "document_downloaded",
    "activation_submitted",
    "activated",
    "activation_rejected",
    "activation_expired",
    "suspended",
    "suspension_blocked",
    "reactivated",
    "terminated",
    "termination_blocked",
    "edited",
    "max_volume_reduced_below_exposure",
    "list_accessed",
    "detail_accessed",
    "pricing_snapshot_accessed",
    "auditor_audit_access",
    "audit_export",
  ])("accepts the documented event type %s", value => {
    expect(() => FAEventTypeFilterSchema.parse(value)).not.toThrow()
  })

  it("rejects an unknown event type", () => {
    expect(() => FAEventTypeFilterSchema.parse("unknown_event")).toThrow()
  })
})
