import { describe, it, expect } from "vitest"
import {
  PartnerTypeSchema,
  PartnerStatusSchema,
  PartnerRoleSchema,
  RoleStatusSchema,
  ActorSummarySchema,
  UboCompletenessStatusSchema,
  IdentityChangeStatusSchema,
  RegisteredAddressSchema,
  LegalEntityIdentityDetailSchema,
  NaturalPersonIdentityDetailSchema,
  SoleProprietorIdentityDetailSchema,
  PartnerIdentityDetailSchema,
  PartnerListItemSchema,
  PartnerListResponseSchema,
  PartnerDetailResponseSchema,
  PartnerMatchResponseSchema,
  PartnerSubmitResponseSchema,
  ResolutionCandidatesResponseSchema,
  PartnerRolesResponseSchema,
  PartnerUboResponseSchema,
  ConfirmationHistoryResponseSchema,
  DecisionHistoryResponseSchema,
  ArchiveEligibilityResponseSchema,
  ArchivePartnerResponseSchema,
  IdentityHistoryResponseSchema,
  MergeLineageRecordResponseSchema,
  MergeHistoryResponseSchema,
  DuplicateConfidenceSchema,
  DuplicateCandidatePairStatusSchema,
  DuplicateResolutionReasonCodeSchema,
  MergeReasonCodeSchema,
  MatchingEvidenceItemSchema,
  DuplicateCandidatePairResponseSchema,
  DuplicatePairListResponseSchema,
  ResolveDuplicatePairResponseSchema,
  MergeInitiateResponseSchema,
} from "@/features/partners/api/schema"

// ── Enum schemas ──────────────────────────────────────────────────────────────

describe("PartnerTypeSchema", () => {
  it("accepts all valid values", () => {
    for (const v of [
      "legal_entity",
      "natural_person",
      "sole_proprietor",
    ] as const) {
      expect(() => PartnerTypeSchema.parse(v)).not.toThrow()
    }
  })
  it("rejects unknown values", () => {
    expect(() => PartnerTypeSchema.parse("company")).toThrow()
  })
})

describe("PartnerStatusSchema", () => {
  const values = [
    "draft",
    "pending_confirmation",
    "confirmed",
    "rejected",
    "merged",
    "archived",
    "pending_archive",
  ] as const
  it("accepts all valid values", () => {
    for (const v of values) {
      expect(() => PartnerStatusSchema.parse(v)).not.toThrow()
    }
  })
  it("rejects unknown values", () => {
    expect(() => PartnerStatusSchema.parse("active")).toThrow()
  })
})

describe("PartnerRoleSchema", () => {
  const values = ["lessee", "guarantor", "supplier"] as const
  it("accepts all valid values", () => {
    for (const v of values) {
      expect(() => PartnerRoleSchema.parse(v)).not.toThrow()
    }
  })
  it("rejects unknown values", () => {
    expect(() => PartnerRoleSchema.parse("borrower")).toThrow()
  })
})

describe("RoleStatusSchema", () => {
  it("accepts all valid values", () => {
    for (const v of [
      "active",
      "pending_four_eyes",
      "rejected",
      "withdrawn",
    ] as const) {
      expect(() => RoleStatusSchema.parse(v)).not.toThrow()
    }
  })
  it("rejects unknown values", () => {
    expect(() => RoleStatusSchema.parse("inactive")).toThrow()
  })
  it("normalizes BE's governed_action-status 'pending' to 'pending_four_eyes'", () => {
    expect(RoleStatusSchema.parse("pending")).toBe("pending_four_eyes")
  })
})

describe("ActorSummarySchema", () => {
  it("accepts BE's human-readable user_id code (not a UUID)", () => {
    expect(() =>
      ActorSummarySchema.parse({
        user_id: "USR-00086",
        display_name: "Jane Doe",
        email: "jane@example.com",
      })
    ).not.toThrow()
  })

  it("accepts an empty email (BE's actor-lookup-failed fallback)", () => {
    expect(() =>
      ActorSummarySchema.parse({
        user_id: "USR-00086",
        display_name: "",
        email: "",
      })
    ).not.toThrow()
  })
})

describe("UboCompletenessStatusSchema", () => {
  it("accepts all valid values", () => {
    for (const v of ["missing", "partial", "complete"] as const) {
      expect(() => UboCompletenessStatusSchema.parse(v)).not.toThrow()
    }
  })
  it("rejects unknown values", () => {
    expect(() => UboCompletenessStatusSchema.parse("unknown")).toThrow()
  })
})

describe("IdentityChangeStatusSchema", () => {
  it("accepts all valid values", () => {
    for (const v of ["pending_four_eyes", "committed", "rejected"] as const) {
      expect(() => IdentityChangeStatusSchema.parse(v)).not.toThrow()
    }
  })
  it("rejects unknown values", () => {
    expect(() => IdentityChangeStatusSchema.parse("approved")).toThrow()
  })
})

// ── RegisteredAddressSchema ───────────────────────────────────────────────────

describe("RegisteredAddressSchema", () => {
  it("accepts all-null address", () => {
    expect(() =>
      RegisteredAddressSchema.parse({
        street: null,
        city: null,
        postal_code: null,
        country: null,
        state_region: null,
      })
    ).not.toThrow()
  })

  it("accepts fully populated address", () => {
    expect(() =>
      RegisteredAddressSchema.parse({
        street: "Hauptstraße 1",
        city: "Berlin",
        postal_code: "10115",
        country: "DE",
        state_region: "Bavaria",
      })
    ).not.toThrow()
  })

  it("accepts null state_region", () => {
    expect(() =>
      RegisteredAddressSchema.parse({
        street: "Hauptstraße 1",
        city: "Berlin",
        postal_code: "10115",
        country: "DE",
        state_region: null,
      })
    ).not.toThrow()
  })

  it("rejects missing required fields", () => {
    expect(() => RegisteredAddressSchema.parse({ city: "Berlin" })).toThrow()
  })
})

// ── Identity detail schemas ───────────────────────────────────────────────────

const validAddress = {
  street: "Hauptstraße 1",
  city: "Berlin",
  postal_code: "10115",
  country: "DE",
  state_region: null,
}

describe("LegalEntityIdentityDetailSchema", () => {
  const valid = {
    partner_type: "legal_entity",
    legal_name: "Acme GmbH",
    legal_form: "GmbH",
    country: "DE",
    tax_id_vat: "DE123456789",
    lei: null,
    commercial_register_no: "HRB 12345",
    registered_address: validAddress,
    foreign_identifier: null,
  }

  it("accepts a valid legal entity", () => {
    expect(() => LegalEntityIdentityDetailSchema.parse(valid)).not.toThrow()
  })

  it("accepts nullable optional fields", () => {
    expect(() =>
      LegalEntityIdentityDetailSchema.parse({
        ...valid,
        legal_form: null,
        tax_id_vat: null,
        lei: null,
        commercial_register_no: null,
        registered_address: null,
        foreign_identifier: null,
      })
    ).not.toThrow()
  })

  it("rejects wrong partner_type", () => {
    expect(() =>
      LegalEntityIdentityDetailSchema.parse({
        ...valid,
        partner_type: "natural_person",
      })
    ).toThrow()
  })

  it("rejects missing legal_name", () => {
    const rest = { ...valid }
    delete (rest as Partial<typeof valid>).legal_name
    expect(() => LegalEntityIdentityDetailSchema.parse(rest)).toThrow()
  })
})

describe("NaturalPersonIdentityDetailSchema", () => {
  const valid = {
    partner_type: "natural_person",
    full_name: "Max Mustermann",
    date_of_birth: "1985-03-15",
    place_of_birth: "Munich",
    country: "DE",
    birth_name: null,
    national_id: null,
    registered_address: null,
  }

  it("accepts a valid natural person", () => {
    expect(() => NaturalPersonIdentityDetailSchema.parse(valid)).not.toThrow()
  })

  it("rejects missing required fields", () => {
    const rest = { ...valid }
    delete (rest as Partial<typeof valid>).full_name
    expect(() => NaturalPersonIdentityDetailSchema.parse(rest)).toThrow()
  })

  it("rejects wrong partner_type", () => {
    expect(() =>
      NaturalPersonIdentityDetailSchema.parse({
        ...valid,
        partner_type: "legal_entity",
      })
    ).toThrow()
  })
})

describe("SoleProprietorIdentityDetailSchema", () => {
  const valid = {
    partner_type: "sole_proprietor",
    full_name: "Hans Meier",
    date_of_birth: "1970-06-01",
    country: "DE",
    tax_id_vat: null,
    commercial_register_no: null,
    registered_address: null,
  }

  it("accepts a valid sole proprietor", () => {
    expect(() => SoleProprietorIdentityDetailSchema.parse(valid)).not.toThrow()
  })

  it("rejects wrong partner_type", () => {
    expect(() =>
      SoleProprietorIdentityDetailSchema.parse({
        ...valid,
        partner_type: "guarantor",
      })
    ).toThrow()
  })
})

describe("PartnerIdentityDetailSchema (discriminated union)", () => {
  it("picks legal_entity branch by partner_type", () => {
    const result = PartnerIdentityDetailSchema.parse({
      partner_type: "legal_entity",
      legal_name: "Acme GmbH",
      legal_form: null,
      country: "DE",
      tax_id_vat: null,
      lei: null,
      commercial_register_no: null,
      registered_address: null,
      foreign_identifier: null,
    })
    expect(result.partner_type).toBe("legal_entity")
  })

  it("rejects unknown partner_type discriminator", () => {
    expect(() =>
      PartnerIdentityDetailSchema.parse({
        partner_type: "cooperative",
        legal_name: "Acme",
        country: "DE",
      })
    ).toThrow()
  })
})

// ── List response schemas ─────────────────────────────────────────────────────

const validListItem = {
  partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  display_name: "Acme GmbH",
  partner_type: "legal_entity",
  status: "confirmed",
  country: "DE",
  ubo_completeness_status: "complete",
  roles: ["lessee"],
}

describe("PartnerListItemSchema", () => {
  it("accepts a valid list item", () => {
    expect(() => PartnerListItemSchema.parse(validListItem)).not.toThrow()
  })

  it("accepts null country", () => {
    expect(() =>
      PartnerListItemSchema.parse({ ...validListItem, country: null })
    ).not.toThrow()
  })

  it("accepts empty roles array", () => {
    expect(() =>
      PartnerListItemSchema.parse({ ...validListItem, roles: [] })
    ).not.toThrow()
  })

  it("accepts legacy role values removed from the enum (PRD1042-1453)", () => {
    expect(() =>
      PartnerListItemSchema.parse({
        ...validListItem,
        roles: ["leasing_company", "ubo_related_person"],
      })
    ).not.toThrow()
  })

  it("rejects invalid status", () => {
    expect(() =>
      PartnerListItemSchema.parse({ ...validListItem, status: "active" })
    ).toThrow()
  })
})

describe("PartnerListResponseSchema", () => {
  it("accepts a valid paginated response", () => {
    expect(() =>
      PartnerListResponseSchema.parse({
        items: [validListItem],
        total: 1,
        limit: 20,
        offset: 0,
      })
    ).not.toThrow()
  })

  it("accepts empty items", () => {
    expect(() =>
      PartnerListResponseSchema.parse({
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
      })
    ).not.toThrow()
  })

  it("rejects non-integer total", () => {
    expect(() =>
      PartnerListResponseSchema.parse({
        items: [],
        total: 1.5,
        limit: 20,
        offset: 0,
      })
    ).toThrow()
  })
})

// ── Detail response schema ────────────────────────────────────────────────────

describe("PartnerDetailResponseSchema", () => {
  const valid = {
    partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    display_name: "Acme GmbH",
    partner_type: "legal_entity",
    status: "confirmed",
    ubo_completeness_status: "complete",
    identity: {
      partner_type: "legal_entity",
      legal_name: "Acme GmbH",
      legal_form: "GmbH",
      country: "DE",
      tax_id_vat: null,
      lei: null,
      commercial_register_no: null,
      registered_address: null,
      foreign_identifier: null,
    },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  }

  it("accepts a valid detail response", () => {
    expect(() => PartnerDetailResponseSchema.parse(valid)).not.toThrow()
  })

  it("rejects if identity partner_type mismatches partner_type", () => {
    // discriminated union will reject if identity.partner_type is invalid
    expect(() =>
      PartnerDetailResponseSchema.parse({
        ...valid,
        identity: { ...valid.identity, partner_type: "unknown_type" },
      })
    ).toThrow()
  })
})

// ── Match / Submit ────────────────────────────────────────────────────────────

describe("PartnerMatchResponseSchema", () => {
  it("accepts a no_match classification with no match", () => {
    expect(() =>
      PartnerMatchResponseSchema.parse({
        classification: "no_match",
        confidence: null,
        matched_partner_id: null,
        candidate_summaries: [],
        inputs_hash: "abc123",
      })
    ).not.toThrow()
  })

  it("accepts an exact classification with a matched ID", () => {
    expect(() =>
      PartnerMatchResponseSchema.parse({
        classification: "exact",
        confidence: "high",
        matched_partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        candidate_summaries: [],
        inputs_hash: "abc123",
      })
    ).not.toThrow()
  })

  it("accepts an ambiguous classification", () => {
    expect(() =>
      PartnerMatchResponseSchema.parse({
        classification: "ambiguous",
        confidence: "medium",
        matched_partner_id: null,
        candidate_summaries: [],
        inputs_hash: "abc123",
      })
    ).not.toThrow()
  })

  it("rejects an unknown classification value", () => {
    expect(() =>
      PartnerMatchResponseSchema.parse({
        classification: "NEW",
        confidence: null,
        matched_partner_id: null,
        candidate_summaries: [],
        inputs_hash: "abc123",
      })
    ).toThrow()
  })

  it("rejects missing inputs_hash", () => {
    expect(() =>
      PartnerMatchResponseSchema.parse({
        classification: "no_match",
        confidence: null,
        matched_partner_id: null,
        candidate_summaries: [],
      })
    ).toThrow()
  })
})

describe("PartnerSubmitResponseSchema", () => {
  it("accepts a valid submit response (no roles — PRD1042-1453)", () => {
    expect(() =>
      PartnerSubmitResponseSchema.parse({
        partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        display_name: "Acme GmbH",
        partner_type: "legal_entity",
        status: "pending_confirmation",
        is_new: true,
      })
    ).not.toThrow()
  })
})

// ── Resolution candidates ─────────────────────────────────────────────────────

describe("ResolutionCandidatesResponseSchema", () => {
  it("accepts a response with no candidates", () => {
    expect(() =>
      ResolutionCandidatesResponseSchema.parse({
        partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        status: "pending_confirmation",
        resolution: null,
        candidates: [],
      })
    ).not.toThrow()
  })
})

// ── Roles response ────────────────────────────────────────────────────────────

describe("PartnerRolesResponseSchema", () => {
  it("accepts empty roles and history", () => {
    expect(() =>
      PartnerRolesResponseSchema.parse({
        partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        roles: [],
        history: [],
      })
    ).not.toThrow()
  })
})

describe("PartnerUboResponseSchema", () => {
  it("accepts a response with no records", () => {
    expect(() =>
      PartnerUboResponseSchema.parse({
        ubo_completeness_status: "missing",
        records: [],
      })
    ).not.toThrow()
  })
})

// ── History responses ─────────────────────────────────────────────────────────

describe("ConfirmationHistoryResponseSchema", () => {
  it("accepts empty items with null cursor", () => {
    expect(() =>
      ConfirmationHistoryResponseSchema.parse({ items: [], next_cursor: null })
    ).not.toThrow()
  })
})

describe("DecisionHistoryResponseSchema", () => {
  it("accepts empty items", () => {
    expect(() =>
      DecisionHistoryResponseSchema.parse({ items: [], next_cursor: null })
    ).not.toThrow()
  })
})

// ── Archive ───────────────────────────────────────────────────────────────────

describe("ArchiveEligibilityResponseSchema", () => {
  it("accepts an archivable response", () => {
    expect(() =>
      ArchiveEligibilityResponseSchema.parse({
        can_archive: true,
        active_references: [],
        requires_counter_confirmation: false,
        risk_sensitive_roles: [],
      })
    ).not.toThrow()
  })

  it("accepts a non-archivable response with references", () => {
    expect(() =>
      ArchiveEligibilityResponseSchema.parse({
        can_archive: false,
        active_references: [{ type: "contract", id: "C-001" }],
        requires_counter_confirmation: true,
        risk_sensitive_roles: ["leasing_company"],
      })
    ).not.toThrow()
  })
})

describe("ArchivePartnerResponseSchema", () => {
  it("accepts immediate archive response", () => {
    expect(() =>
      ArchivePartnerResponseSchema.parse({
        partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        status: "archived",
        is_immediate: true,
        governed_action_id: null,
      })
    ).not.toThrow()
  })

  it("accepts pending_archive response with governed_action_id", () => {
    expect(() =>
      ArchivePartnerResponseSchema.parse({
        partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        status: "pending_archive",
        is_immediate: false,
        governed_action_id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      })
    ).not.toThrow()
  })
})

// ── Identity changes ──────────────────────────────────────────────────────────

describe("IdentityHistoryResponseSchema", () => {
  it("accepts empty history", () => {
    expect(() =>
      IdentityHistoryResponseSchema.parse({
        partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        items: [],
      })
    ).not.toThrow()
  })
})

// ── Merge history ─────────────────────────────────────────────────────────────

describe("MergeLineageRecordResponseSchema", () => {
  const valid = {
    record_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    source_partner_id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    target_partner_id: "c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f",
    governed_action_id: "d4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f80",
    executed_by: "e5f6a7b8-c9d0-4e1f-8a3b-4c5d6e7f8091",
    executed_at: "2026-06-08T15:39:00Z",
    merge_reason_code: "same_legal_entity_different_name",
    reference_manifest: {
      contracts: [],
      financings: [],
      note: "module_not_active",
    },
  }

  it("accepts a well-formed merge lineage record", () => {
    expect(() => MergeLineageRecordResponseSchema.parse(valid)).not.toThrow()
  })

  it("rejects a non-UUID source_partner_id", () => {
    expect(() =>
      MergeLineageRecordResponseSchema.parse({
        ...valid,
        source_partner_id: "not-a-uuid",
      })
    ).toThrow()
  })

  it("rejects a missing reference_manifest", () => {
    const withoutManifest: Record<string, unknown> = { ...valid }
    delete withoutManifest.reference_manifest
    expect(() =>
      MergeLineageRecordResponseSchema.parse(withoutManifest)
    ).toThrow()
  })
})

describe("MergeHistoryResponseSchema", () => {
  it("accepts empty history", () => {
    expect(() =>
      MergeHistoryResponseSchema.parse({
        partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        items: [],
      })
    ).not.toThrow()
  })
})

describe("DuplicateConfidenceSchema", () => {
  it("accepts all valid values", () => {
    for (const v of ["definite", "probable", "possible"] as const) {
      expect(() => DuplicateConfidenceSchema.parse(v)).not.toThrow()
    }
  })
  it("rejects unknown values", () => {
    expect(() => DuplicateConfidenceSchema.parse("high")).toThrow()
  })
})

describe("DuplicateCandidatePairStatusSchema", () => {
  const values = [
    "pending",
    "confirmed_duplicate",
    "confirmed_distinct",
    "deferred",
    "merge_in_progress",
    "merged",
  ] as const
  it("accepts all valid values", () => {
    for (const v of values) {
      expect(() => DuplicateCandidatePairStatusSchema.parse(v)).not.toThrow()
    }
  })
  it("rejects unknown values", () => {
    expect(() => DuplicateCandidatePairStatusSchema.parse("resolved")).toThrow()
  })
})

describe("DuplicateResolutionReasonCodeSchema", () => {
  const values = [
    "identical_registry_identifiers",
    "same_legal_entity_different_name",
    "data_entry_error",
    "system_import_error",
    "legal_restructuring",
    "confirmed_different_entities",
    "subsidiary_not_duplicate",
    "insufficient_evidence",
  ] as const
  it("accepts all valid values", () => {
    for (const v of values) {
      expect(() => DuplicateResolutionReasonCodeSchema.parse(v)).not.toThrow()
    }
  })
  it("rejects unknown values", () => {
    expect(() => DuplicateResolutionReasonCodeSchema.parse("other")).toThrow()
  })
})

describe("MergeReasonCodeSchema", () => {
  const values = [
    "same_legal_entity_different_name",
    "identical_registry_identifiers",
    "data_entry_error",
    "system_import_error",
    "legal_restructuring",
  ] as const
  it("accepts all valid values", () => {
    for (const v of values) {
      expect(() => MergeReasonCodeSchema.parse(v)).not.toThrow()
    }
  })
  it("rejects unknown values", () => {
    expect(() => MergeReasonCodeSchema.parse("other")).toThrow()
  })
})

describe("MatchingEvidenceItemSchema", () => {
  it("accepts a well-formed evidence item", () => {
    expect(() =>
      MatchingEvidenceItemSchema.parse({
        anchor: "legal_name",
        a_value: "Capital Lease Solutions",
        b_value: "Capital Lease Solutions GmbH",
        match: false,
      })
    ).not.toThrow()
  })
  it("rejects a missing match flag", () => {
    expect(() =>
      MatchingEvidenceItemSchema.parse({
        anchor: "legal_name",
        a_value: "A",
        b_value: "B",
      })
    ).toThrow()
  })
})

describe("DuplicateCandidatePairResponseSchema", () => {
  const valid = {
    pair_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    tenant_id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    partner_a_id: "c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f",
    partner_b_id: "d4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f80",
    confidence: "probable",
    matching_evidence: [
      { anchor: "legal_name", a_value: "A", b_value: "B", match: false },
    ],
    status: "pending",
    detected_at: "2026-06-08T15:39:00Z",
    resolved_by: null,
    resolved_at: null,
    reason_code: null,
    resolution_note: null,
  }

  it("accepts a well-formed pending pair", () => {
    expect(() =>
      DuplicateCandidatePairResponseSchema.parse(valid)
    ).not.toThrow()
  })

  it("accepts a resolved pair", () => {
    expect(() =>
      DuplicateCandidatePairResponseSchema.parse({
        ...valid,
        status: "confirmed_duplicate",
        resolved_by: "e5f6a7b8-c9d0-4e1f-8a3b-4c5d6e7f8091",
        resolved_at: "2026-06-09T10:00:00Z",
        reason_code: "identical_registry_identifiers",
        resolution_note: "Same VAT number.",
      })
    ).not.toThrow()
  })

  it("rejects an unknown confidence value", () => {
    expect(() =>
      DuplicateCandidatePairResponseSchema.parse({
        ...valid,
        confidence: "certain",
      })
    ).toThrow()
  })

  it("rejects an unknown status value", () => {
    expect(() =>
      DuplicateCandidatePairResponseSchema.parse({ ...valid, status: "open" })
    ).toThrow()
  })
})

describe("DuplicatePairListResponseSchema", () => {
  it("accepts an empty list", () => {
    expect(() =>
      DuplicatePairListResponseSchema.parse({ items: [], total: 0 })
    ).not.toThrow()
  })
})

describe("ResolveDuplicatePairResponseSchema", () => {
  it("accepts a well-formed response", () => {
    expect(() =>
      ResolveDuplicatePairResponseSchema.parse({
        pair_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        status: "confirmed_duplicate",
      })
    ).not.toThrow()
  })
  it("rejects an unknown status value", () => {
    expect(() =>
      ResolveDuplicatePairResponseSchema.parse({
        pair_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        status: "resolved",
      })
    ).toThrow()
  })
})

describe("MergeInitiateResponseSchema", () => {
  it("accepts a well-formed response", () => {
    expect(() =>
      MergeInitiateResponseSchema.parse({
        governed_action_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        source_partner_id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
        target_partner_id: "c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f",
        pair_id: "d4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f80",
        status: "pending",
      })
    ).not.toThrow()
  })
  it("rejects a non-UUID pair_id", () => {
    expect(() =>
      MergeInitiateResponseSchema.parse({
        governed_action_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        source_partner_id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
        target_partner_id: "c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f",
        pair_id: "not-a-uuid",
        status: "pending",
      })
    ).toThrow()
  })
})
