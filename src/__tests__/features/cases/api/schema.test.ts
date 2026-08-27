import { describe, it, expect } from "vitest"
import {
  CaseSchema,
  CaseListItemSchema,
  CaseListResponseSchema,
  CaseResponseSchema,
  CaseTypeSchema,
  CaseStatusSchema,
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
