import { describe, expect, it } from "vitest"
import {
  KIND_OF_OBLIGATION_OPTIONS,
  isPartnerUsableAsParty,
} from "@/features/cases/contractParties"
import type { PartnerListItem } from "@/features/partners/api/schema"

function partner(overrides: Partial<PartnerListItem> = {}): PartnerListItem {
  return {
    partner_id: "00000000-0000-4000-8000-0000000000a1",
    display_name: "Muster Transport GmbH",
    partner_type: "legal_entity",
    status: "confirmed",
    country: "DE",
    ubo_completeness_status: "complete",
    roles: ["lessee"],
    ...overrides,
  }
}

describe("KIND_OF_OBLIGATION_OPTIONS", () => {
  // `kind_of_obligation` is an unconstrained string on the wire, so this is a UI-side vocabulary
  // covering the two US 1.7 names. Asserted so a silent third value is a deliberate change.
  it("is the two kinds US 1.7 names", () => {
    expect(KIND_OF_OBLIGATION_OPTIONS).toEqual(["guarantor", "co_obligor"])
  })
})

describe("isPartnerUsableAsParty", () => {
  it("allows a confirmed partner", () => {
    expect(isPartnerUsableAsParty(partner())).toBe(true)
  })

  // The API would accept these, but the case stalls later on a party that is not a real
  // counterparty — so the refusal happens where it can be explained.
  it("refuses a partner that is not confirmed", () => {
    for (const status of [
      "draft",
      "pending_confirmation",
      "rejected",
      "merged",
      "archived",
      "pending_archive",
    ] as const) {
      expect(isPartnerUsableAsParty(partner({ status }))).toBe(false)
    }
  })
})
