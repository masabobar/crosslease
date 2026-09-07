import { describe, it, expect } from "vitest"
import {
  CaseSchema,
  CaseListItemSchema,
  CaseListResponseSchema,
  CaseResponseSchema,
  CaseTypeSchema,
  CaseStatusSchema,
  CaseDataMetaSchema,
  CaseProgressResponseSchema,
  PhaseProgressResponseSchema,
  CaseContractSchema,
  CaseContractListResponseSchema,
  ContractDeferredStateSchema,
} from "@/features/cases/api/schema"

const CASE_UUID = "5c2d8b10-6a4f-4e9b-8c31-7d0a1f2b3c44"
const OWNER_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
const LC_UUID = "11111111-2222-4333-8444-555555555555"

const validCase = {
  id: CASE_UUID,
  case_reference: "CASE-2026-000123",
  case_type: "refinancing_request",
  case_status: "open",
  display_status: "open",
  origin: "front_office",
  owner_user_id: OWNER_UUID,
  lc_partner_id: LC_UUID,
  routing_exception: false,
  created_by: "front.office@bank.example",
  created_at: "2026-06-13T10:00:00Z",
}

describe("cases schemas", () => {
  it("parses a valid case", () => {
    expect(CaseSchema.parse(validCase)).toEqual(validCase)
  })

  it("accepts null owner and lc partner (unclaimed / bank-side case)", () => {
    const unclaimed = {
      ...validCase,
      owner_user_id: null,
      lc_partner_id: null,
    }
    expect(CaseSchema.parse(unclaimed)).toEqual(unclaimed)
  })

  it("CaseListItemSchema shares the case shape", () => {
    expect(CaseListItemSchema.parse(validCase)).toEqual(validCase)
  })

  it("CaseResponseSchema shares the case shape", () => {
    expect(CaseResponseSchema.parse(validCase)).toEqual(validCase)
  })

  // The Cases list carries six display fields the contract does not declare (leasing company name,
  // contract count, phase, last activity). They are optional precisely so the real API's narrower
  // response keeps parsing — these tests are what stop that from regressing into required.
  describe("CaseListItemSchema display-field gaps", () => {
    const withDisplayFields = {
      ...validCase,
      lc_partner_name: "Premium Leasing GmbH",
      contract_count: 3,
      phase_name: "Application & credit review",
      phase_position: 1,
      phase_count: 5,
      last_activity_at: "2026-06-14T08:30:00Z",
      last_activity_by: "Front Office",
    }

    it("parses the real API's row, which carries none of them", () => {
      const parsed = CaseListItemSchema.parse(validCase)
      expect(parsed.lc_partner_name).toBeUndefined()
      expect(parsed.contract_count).toBeUndefined()
      expect(parsed.phase_position).toBeUndefined()
      expect(parsed.last_activity_at).toBeUndefined()
    })

    it("keeps them when the mock layer supplies them", () => {
      expect(CaseListItemSchema.parse(withDisplayFields)).toEqual(
        withDisplayFields
      )
    })

    it("accepts them as explicitly null", () => {
      // A backend that adds the columns but has no value yet would send null, not omit the key.
      const nulled = {
        ...validCase,
        lc_partner_name: null,
        contract_count: null,
        phase_name: null,
        phase_position: null,
        phase_count: null,
        last_activity_at: null,
        last_activity_by: null,
      }
      expect(CaseListItemSchema.parse(nulled)).toEqual(nulled)
    })

    it("still rejects a wrongly-typed display field", () => {
      expect(() =>
        CaseListItemSchema.parse({ ...validCase, contract_count: "3" })
      ).toThrow()
    })

    it("does not widen the detail endpoint — CaseResponseSchema strips them", () => {
      // The detail endpoint promises no more than the contract does, so the display fields must not
      // leak into it just because the list row shares a base schema.
      expect(CaseResponseSchema.parse(withDisplayFields)).toEqual(validCase)
    })
  })

  it("parses a case list response", () => {
    const response = { items: [validCase], total: 1 }
    expect(CaseListResponseSchema.parse(response)).toEqual(response)
  })

  it("parses an empty case list", () => {
    const response = { items: [], total: 0 }
    expect(CaseListResponseSchema.parse(response)).toEqual(response)
  })

  it("rejects an unknown case_type (a backend addition must widen the enum, not slip through)", () => {
    expect(() =>
      CaseSchema.parse({ ...validCase, case_type: "totally_new_type" })
    ).toThrow()
  })

  it("rejects an unknown case_status", () => {
    expect(() =>
      CaseSchema.parse({ ...validCase, case_status: "archived" })
    ).toThrow()
  })

  it("rejects a non-uuid id", () => {
    expect(() => CaseSchema.parse({ ...validCase, id: "not-a-uuid" })).toThrow()
  })

  it("keeps display_status permissive (a widened backend value renders, never fails to parse)", () => {
    const widened = { ...validCase, display_status: "waiting_on_lessee" }
    expect(CaseSchema.parse(widened).display_status).toBe("waiting_on_lessee")
  })

  it("exposes the full case_type enum", () => {
    expect(CaseTypeSchema.options).toEqual([
      "refinancing_request",
      "package_redemption",
      "single_redemption",
      "lessee_change",
      "object_swap",
      "extension",
      "asset_event",
    ])
  })

  it("exposes the full case_status enum", () => {
    expect(CaseStatusSchema.options).toEqual([
      "open",
      "waiting",
      "done",
      "cancelled",
    ])
  })
})

describe("PhaseProgressResponseSchema", () => {
  const validPhase = {
    phase_name: "Application & credit review",
    position: 1,
    steps_done: 3,
    steps_applicable: 4,
    is_complete: false,
    is_current: true,
  }

  it("accepts a phase the wire can fully describe", () => {
    expect(PhaseProgressResponseSchema.parse(validPhase)).toEqual(validPhase)
  })

  // Both are nullable on the wire, so a phase the backend cannot name must still parse — the band
  // falls back to the array index for its letter and to a placeholder for the label.
  it("accepts a null phase_name and a null position", () => {
    const parsed = PhaseProgressResponseSchema.parse({
      ...validPhase,
      phase_name: null,
      position: null,
    })
    expect(parsed.phase_name).toBeNull()
    expect(parsed.position).toBeNull()
  })

  it("rejects a missing steps_applicable", () => {
    const withoutTotal: Record<string, unknown> = { ...validPhase }
    delete withoutTotal.steps_applicable
    expect(() => PhaseProgressResponseSchema.parse(withoutTotal)).toThrow()
  })

  it("rejects a non-integer step count", () => {
    expect(() =>
      PhaseProgressResponseSchema.parse({ ...validPhase, steps_done: 1.5 })
    ).toThrow()
  })

  it("rejects a string where a boolean flag belongs", () => {
    expect(() =>
      PhaseProgressResponseSchema.parse({ ...validPhase, is_current: "yes" })
    ).toThrow()
  })
})

describe("CaseProgressResponseSchema", () => {
  const validProgress = {
    business_object_id: CASE_UUID,
    phases: [
      {
        phase_name: "Application & credit review",
        position: 1,
        steps_done: 3,
        steps_applicable: 4,
        is_complete: false,
        is_current: true,
      },
    ],
    overall_done: 3,
    overall_applicable: 44,
    percent_complete: 7,
    all_complete: false,
  }

  it("accepts the documented shape", () => {
    expect(CaseProgressResponseSchema.parse(validProgress)).toEqual(
      validProgress
    )
  })

  // A case with no phases is legitimate — the band renders nothing rather than an empty stepper.
  it("accepts an empty phases array", () => {
    expect(
      CaseProgressResponseSchema.parse({ ...validProgress, phases: [] }).phases
    ).toEqual([])
  })

  it("rejects a business_object_id that is not a UUID", () => {
    expect(() =>
      CaseProgressResponseSchema.parse({
        ...validProgress,
        business_object_id: "case-1",
      })
    ).toThrow()
  })

  it("rejects a phase array holding a malformed phase", () => {
    expect(() =>
      CaseProgressResponseSchema.parse({
        ...validProgress,
        phases: [{ phase_name: "A" }],
      })
    ).toThrow()
  })
})

describe("CaseDataMetaSchema", () => {
  // Narrowed on purpose: `CaseDataResponse` is a wide aggregate and only the contract count is read.
  // Zod strips the rest, which is what lets the header consume the endpoint without modelling it.
  it("keeps the two fields the header reads and drops the rest", () => {
    const parsed = CaseDataMetaSchema.parse({
      case_id: CASE_UUID,
      contract_count: 134,
      leasing_company: { id: "x", legal_name: "Premium Leasing GmbH" },
      residual_sum: "1200000.00",
      absent_blocks: ["financing"],
    })
    expect(parsed).toEqual({ case_id: CASE_UUID, contract_count: 134 })
  })

  it("rejects a contract_count that is not an integer", () => {
    expect(() =>
      CaseDataMetaSchema.parse({ case_id: CASE_UUID, contract_count: "134" })
    ).toThrow()
  })
})

describe("ContractDeferredStateSchema", () => {
  it("accepts the two values the contract declares", () => {
    expect(ContractDeferredStateSchema.parse("active")).toBe("active")
    expect(ContractDeferredStateSchema.parse("deferred")).toBe("deferred")
  })

  // The design's Contracts tab shows `Active` / `Overdue` / `Ended`. Only the first exists on the
  // wire, so the other two must not parse — if the backend ever sends them the enum should fail
  // loudly rather than let an unmapped badge render.
  it("rejects the design's extra states", () => {
    expect(() => ContractDeferredStateSchema.parse("overdue")).toThrow()
    expect(() => ContractDeferredStateSchema.parse("ended")).toThrow()
  })
})

describe("CaseContractSchema", () => {
  const CONTRACT_UUID = "00000000-0000-4000-8000-0000000000c1"

  const minimalContract = {
    id: CONTRACT_UUID,
    leasing_company_contract_number: null,
    short_name: null,
    contract_type: null,
    amortisation_type: null,
    term_months: null,
    net_instalment: null,
    residual_value: null,
    contract_start: null,
    deferred_state: "active",
  }

  // A bulk-imported contract can be missing every optional term while still being a real row, so
  // the all-null shape has to parse rather than throw.
  it("parses a contract whose every nullable term is null", () => {
    expect(CaseContractSchema.parse(minimalContract)).toEqual(minimalContract)
  })

  it("drops the ContractRead fields this screen does not read", () => {
    const parsed = CaseContractSchema.parse({
      ...minimalContract,
      lessee_partner_id: "00000000-0000-4000-8000-0000000000p1",
      missing_fields: ["residual_value"],
      settlement_blockers: [],
      buy_back_agreement: true,
    })
    expect(parsed).toEqual(minimalContract)
  })

  // Money stays a decimal string end to end; coercing it would turn a null instalment into a
  // convincing 0,00 (see the note in features/financing/api/schema.ts).
  it("rejects a numeric instalment", () => {
    expect(() =>
      CaseContractSchema.parse({ ...minimalContract, net_instalment: 1250 })
    ).toThrow()
  })

  it("rejects a non-integer term", () => {
    expect(() =>
      CaseContractSchema.parse({ ...minimalContract, term_months: "48" })
    ).toThrow()
  })

  it("requires deferred_state", () => {
    const withoutState: Record<string, unknown> = { ...minimalContract }
    delete withoutState.deferred_state
    expect(() => CaseContractSchema.parse(withoutState)).toThrow()
  })

  // `contract_type` is deliberately a string, not an enum: ContractRead does not constrain it, so
  // whatever vocabulary the backend sends must render instead of breaking the page.
  it("accepts a contract_type the spec's enum does not list", () => {
    expect(
      CaseContractSchema.parse({
        ...minimalContract,
        contract_type: "operating_lease",
      }).contract_type
    ).toBe("operating_lease")
  })

  it("parses the list envelope", () => {
    expect(
      CaseContractListResponseSchema.parse({
        items: [minimalContract],
        total: 1,
      })
    ).toEqual({ items: [minimalContract], total: 1 })
  })

  it("rejects a list envelope with no total", () => {
    expect(() => CaseContractListResponseSchema.parse({ items: [] })).toThrow()
  })
})
