import { describe, it, expect } from "vitest"
import {
  PartnerTypeSchema,
  PartnerStatusSchema,
  PartnerRoleSchema,
  RoleStatusSchema,
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
  RoleAssignResponseSchema,
  PartnerUboResponseSchema,
  ConfirmationHistoryResponseSchema,
  DecisionHistoryResponseSchema,
  ArchiveEligibilityResponseSchema,
  ArchivePartnerResponseSchema,
  IdentityHistoryResponseSchema,
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
  const values = [
    "lessee",
    "guarantor",
    "supplier",
    "leasing_company",
    "bank_entity",
    "ubo_related_person",
  ] as const
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

  it("rejects invalid role in roles array", () => {
    expect(() =>
      PartnerListItemSchema.parse({ ...validListItem, roles: ["borrower"] })
    ).toThrow()
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
  it("accepts a NEW classification with no match", () => {
    expect(() =>
      PartnerMatchResponseSchema.parse({
        classification: "NEW",
        confidence: null,
        matched_partner_id: null,
        candidate_summaries: [],
        inputs_hash: "abc123",
      })
    ).not.toThrow()
  })

  it("accepts EXACT_MATCH with a matched ID", () => {
    expect(() =>
      PartnerMatchResponseSchema.parse({
        classification: "EXACT_MATCH",
        confidence: "high",
        matched_partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        candidate_summaries: [],
        inputs_hash: "abc123",
      })
    ).not.toThrow()
  })

  it("rejects missing inputs_hash", () => {
    expect(() =>
      PartnerMatchResponseSchema.parse({
        classification: "NEW",
        confidence: null,
        matched_partner_id: null,
        candidate_summaries: [],
      })
    ).toThrow()
  })
})

describe("PartnerSubmitResponseSchema", () => {
  it("accepts a valid submit response", () => {
    expect(() =>
      PartnerSubmitResponseSchema.parse({
        partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        display_name: "Acme GmbH",
        partner_type: "legal_entity",
        status: "pending_confirmation",
        role: "lessee",
        is_new: true,
      })
    ).not.toThrow()
  })

  it("rejects invalid role", () => {
    expect(() =>
      PartnerSubmitResponseSchema.parse({
        partner_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        display_name: "Acme GmbH",
        partner_type: "legal_entity",
        status: "pending_confirmation",
        role: "borrower",
        is_new: true,
      })
    ).toThrow()
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

describe("RoleAssignResponseSchema", () => {
  it("accepts a valid assign response", () => {
    expect(() =>
      RoleAssignResponseSchema.parse({
        results: [{ role: "lessee", status: "active", is_new: true }],
      })
    ).not.toThrow()
  })

  it("rejects invalid role in results", () => {
    expect(() =>
      RoleAssignResponseSchema.parse({
        results: [{ role: "borrower", status: "active", is_new: true }],
      })
    ).toThrow()
  })
})

// ── UBO ───────────────────────────────────────────────────────────────────────

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
