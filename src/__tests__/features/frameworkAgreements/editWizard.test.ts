import { describe, it, expect } from "vitest"
import {
  buildUpdateFAPayload,
  isFrameworkAgreementDraft,
  toEditFormDefaults,
} from "@/features/frameworkAgreements/editWizard"
import type {
  EditFrameworkAgreementFormValues,
  FADetailResponse,
} from "@/features/frameworkAgreements/api/schema"

const activeAgreement: FADetailResponse = {
  id: "b3e1c9a0-1111-4a2b-8c3d-000000000003",
  agreement_name: "RV-SSKM-2026-001",
  lc_partner_id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
  lc_partner_name: "Example Leasing GmbH",
  status: "active",
  is_expired: false,
  agreement_lifecycle: "active",
  currency: "EUR",
  max_volume_eur: 25000000,
  valid_from: "2026-06-01",
  valid_until: null,
  edit_version_counter: 3,
  product_template_ids: ["b3e1c9a0-1111-4a2b-8c3d-000000000002"],
  document_count: 1,
  linked_financings_count: 0,
  utilization_pct: null,
  limit_available: null,
  limit_breach: null,
  bank_entity: "sparkasse",
  vfe_amount_eur: 1500,
  special_conditions: "Reviewed annually",
  effective_from: null,
  activated_at: null,
  activated_by: null,
  activated_by_name: null,
  deactivated_at: null,
  deactivated_by: null,
  reactivated_at: null,
  reactivated_by: null,
  terminated_at: null,
  terminated_by: null,
  created_by: null,
  created_by_name: null,
  created_at: "2026-06-01T10:00:00Z",
}

describe("isFrameworkAgreementDraft", () => {
  it.each(["active", "terminated"] as const)("is false for %s", status => {
    expect(isFrameworkAgreementDraft({ ...activeAgreement, status })).toBe(
      false
    )
  })

  it("is true for draft", () => {
    expect(
      isFrameworkAgreementDraft({ ...activeAgreement, status: "draft" })
    ).toBe(true)
  })
})

describe("toEditFormDefaults", () => {
  it("maps a populated agreement onto the form shape", () => {
    expect(toEditFormDefaults(activeAgreement)).toEqual({
      agreement_name: "RV-SSKM-2026-001",
      max_volume_eur: 25000000,
      vfe_amount_eur: 1500,
      valid_from: "2026-06-01",
      valid_until: "",
      special_conditions: "Reviewed annually",
      product_template_ids: ["b3e1c9a0-1111-4a2b-8c3d-000000000002"],
      justification: "",
      expected_version: 3,
    })
  })

  // Nullable wire fields must land as "" / undefined, never as the string "null" or a
  // null the RHF inputs would render literally.
  it("normalizes the nullable fields", () => {
    const defaults = toEditFormDefaults({
      ...activeAgreement,
      valid_until: null,
      special_conditions: null,
      vfe_amount_eur: null,
    })
    expect(defaults.valid_until).toBe("")
    expect(defaults.special_conditions).toBe("")
    expect(defaults.vfe_amount_eur).toBeUndefined()
  })

  // Seeds the optimistic-concurrency field the BE checks to raise FA_VERSION_CONFLICT.
  it("seeds expected_version from edit_version_counter", () => {
    expect(
      toEditFormDefaults({ ...activeAgreement, edit_version_counter: 11 })
        .expected_version
    ).toBe(11)
  })
})

describe("buildUpdateFAPayload", () => {
  const values: EditFrameworkAgreementFormValues = {
    agreement_name: "RV-SSKM-2026-002",
    max_volume_eur: 30000000,
    vfe_amount_eur: 2000,
    valid_from: "2026-07-01",
    valid_until: "2029-06-01",
    special_conditions: "Reviewed annually",
    product_template_ids: ["b3e1c9a0-1111-4a2b-8c3d-000000000002"],
    justification: "Adjusting envelope after annual credit review",
    expected_version: 3,
  }

  it("sends agreement_name and valid_from for a draft", () => {
    const body = buildUpdateFAPayload(values, true)
    expect(body.agreement_name).toBe("RV-SSKM-2026-002")
    expect(body.valid_from).toBe("2026-07-01")
  })

  // edit_governed() rejects both as FA_IMMUTABLE_FIELDS once the agreement leaves Draft,
  // so they must not be in the payload at all — not even unchanged.
  it("omits agreement_name and valid_from once past draft", () => {
    const body = buildUpdateFAPayload(values, false)
    expect(body).not.toHaveProperty("agreement_name")
    expect(body).not.toHaveProperty("valid_from")
  })

  it("always sends the editable fields, the justification and the expected version", () => {
    const body = buildUpdateFAPayload(values, false)
    expect(body).toMatchObject({
      max_volume_eur: 30000000,
      vfe_amount_eur: 2000,
      special_conditions: "Reviewed annually",
      product_template_ids: ["b3e1c9a0-1111-4a2b-8c3d-000000000002"],
      justification: "Adjusting envelope after annual credit review",
      expected_version: 3,
    })
  })

  // An empty date input yields "", which the wire schema rejects — it must become undefined.
  it("converts an empty valid_until to undefined", () => {
    expect(
      buildUpdateFAPayload({ ...values, valid_until: "" }, true).valid_until
    ).toBeUndefined()
  })
})
