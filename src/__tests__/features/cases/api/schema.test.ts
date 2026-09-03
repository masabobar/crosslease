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
