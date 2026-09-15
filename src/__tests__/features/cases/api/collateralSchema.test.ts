import { describe, expect, it } from "vitest"
import {
  CollateralListResponseSchema,
  ContractCollateralTypeSchema,
} from "@/features/cases/api/schema"

const contractId = "00000000-0000-4000-8000-0000000acc01"

function listWith(overrides: Record<string, unknown>) {
  return {
    contract_id: contractId,
    count: 1,
    collaterals: [
      {
        collateral_id: "00000000-0000-4000-8000-0000000c01a1",
        collateral_type: "SECURITY_DEPOSIT",
        value: "15000.00",
        guarantor_partner_id: null,
        guarantor_display_name: null,
        evidence_document_id: null,
        kind_of_obligation: null,
        ...overrides,
      },
    ],
  }
}

describe("CollateralListResponseSchema", () => {
  it("accepts a deposit with no party", () => {
    expect(() => CollateralListResponseSchema.parse(listWith({}))).not.toThrow()
  })

  it("accepts a guarantee carrying a party and an obligation kind", () => {
    expect(() =>
      CollateralListResponseSchema.parse(
        listWith({
          collateral_type: "GUARANTEE",
          guarantor_partner_id: "00000000-0000-4000-8000-00000000a101",
          guarantor_display_name: "Sofia Reinhardt",
          kind_of_obligation: "co_obligation",
        })
      )
    ).toBeTruthy()
  })

  // The backend sends either a number or a decimal string depending on the endpoint; a schema that
  // took only one of them would reject real responses.
  it("accepts a numeric value as well as a decimal string", () => {
    expect(() =>
      CollateralListResponseSchema.parse(listWith({ value: 15000 }))
    ).not.toThrow()
  })

  it("rejects a collateral type outside the backend's three", () => {
    expect(() =>
      CollateralListResponseSchema.parse(
        listWith({ collateral_type: "PLEDGE" })
      )
    ).toThrow()
  })

  // Lowercase would be the convention everywhere else on this API, which is exactly why it is
  // worth pinning: these three are SCREAMING_SNAKE on the wire.
  it("rejects a lowercased collateral type", () => {
    expect(() =>
      CollateralListResponseSchema.parse(
        listWith({ collateral_type: "guarantee" })
      )
    ).toThrow()
  })

  it("rejects an obligation kind outside guarantee / co_obligation", () => {
    expect(() =>
      CollateralListResponseSchema.parse(
        listWith({
          collateral_type: ContractCollateralTypeSchema.enum.GUARANTEE,
          kind_of_obligation: "surety",
        })
      )
    ).toThrow()
  })
})
