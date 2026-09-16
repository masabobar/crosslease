import { describe, expect, it } from "vitest"
import { FinancingListResponseSchema } from "@/features/financing/api/financingListSchema"

function listWith(overrides: Record<string, unknown>) {
  return {
    total: 1,
    page: 1,
    per_page: 25,
    total_pages: 1,
    items: [
      {
        id: "00000000-0000-4000-8000-0000000f1000",
        case_id: "00000000-0000-4000-8000-00000000c001",
        case_reference: "RR-2026-066",
        financing_reference: "FIN-2026-066",
        status: "active",
        kind: "package",
        refinancing_rate: "4.650",
        value_date: "2026-09-15",
        loan_number: "LIQ-88-014772",
        lc_number: null,
        lc_partner_name: "Premium Leasing GmbH",
        contract_count: 3,
        calculation_state: "complete",
        created_at: "2026-08-01T09:00:00Z",
        ...overrides,
      },
    ],
  }
}

describe("FinancingListResponseSchema", () => {
  it("accepts a fully populated financing", () => {
    expect(() => FinancingListResponseSchema.parse(listWith({}))).not.toThrow()
  })

  // Five fields are nullable on the wire and a financing that has not been set up yet carries
  // none of them — a schema that required them would reject every calculating row.
  it("accepts a financing with none of its optional figures", () => {
    expect(() =>
      FinancingListResponseSchema.parse(
        listWith({
          refinancing_rate: null,
          value_date: null,
          loan_number: null,
          lc_number: null,
          lc_partner_name: null,
        })
      )
    ).not.toThrow()
  })

  // The rate is a decimal STRING. Coercing it to a number is what turns a null into a
  // convincing 0, which is why the schema refuses the number form.
  it("rejects a numeric refinancing rate", () => {
    expect(() =>
      FinancingListResponseSchema.parse(listWith({ refinancing_rate: 4.65 }))
    ).toThrow()
  })

  it("rejects a status outside the backend's seven", () => {
    expect(() =>
      FinancingListResponseSchema.parse(listWith({ status: "approved" }))
    ).toThrow()
  })

  it("rejects a kind outside single / package", () => {
    expect(() =>
      FinancingListResponseSchema.parse(listWith({ kind: "bundle" }))
    ).toThrow()
  })
})
