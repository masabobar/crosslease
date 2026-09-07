import { describe, expect, it } from "vitest"
import {
  canShowRemainingAvailable,
  deriveContractFigures,
} from "@/features/cases/summaryFigures"
import type { CaseContract } from "@/features/cases/api/schema"

function contract(overrides: Partial<CaseContract> = {}): CaseContract {
  return {
    id: "00000000-0000-4000-8000-0000000000c1",
    leasing_company_contract_number: "LC-0001",
    lessee_partner_id: "00000000-0000-4000-8000-0000000000a1",
    short_name: null,
    contract_type: "lease",
    amortisation_type: "full",
    term_months: 48,
    net_instalment: "1250.00",
    residual_value: null,
    contract_start: "2026-01-15",
    deferred_state: "active",
    ...overrides,
  }
}

describe("deriveContractFigures", () => {
  // The guard that keeps the summary honest. The design's own example has 156 contracts, so a page
  // shorter than the total is realistic — and a mean computed over part of the set, presented as
  // "Average term", is a wrong number stated as fact.
  it("returns null when the fetched rows do not cover the server's total", () => {
    expect(deriveContractFigures([contract()], 156)).toBeNull()
  })

  it("computes the figures when the list is complete", () => {
    const figures = deriveContractFigures(
      [
        contract({ id: "00000000-0000-4000-8000-0000000000c1" }),
        contract({
          id: "00000000-0000-4000-8000-0000000000c2",
          lessee_partner_id: "00000000-0000-4000-8000-0000000000a2",
          contract_start: "2025-03-01",
          term_months: 60,
        }),
      ],
      2
    )

    expect(figures).toEqual({
      lesseeCount: 2,
      earliestStart: "2025-03-01",
      latestStart: "2026-01-15",
      averageTermMonths: 54,
    })
  })

  // Two contracts for one lessee is the whole point of counting distinct ids rather than rows —
  // "Number of lessees" and "Number of contracts" are different figures on the design's card.
  it("counts a lessee once however many contracts it holds", () => {
    const figures = deriveContractFigures(
      [
        contract({ id: "00000000-0000-4000-8000-0000000000c1" }),
        contract({ id: "00000000-0000-4000-8000-0000000000c2" }),
      ],
      2
    )
    expect(figures?.lesseeCount).toBe(1)
  })

  it("does not count a contract whose lessee is not recorded", () => {
    const figures = deriveContractFigures(
      [
        contract({ id: "00000000-0000-4000-8000-0000000000c1" }),
        contract({
          id: "00000000-0000-4000-8000-0000000000c2",
          lessee_partner_id: null,
        }),
      ],
      2
    )
    expect(figures?.lesseeCount).toBe(1)
  })

  // A bulk-imported contract can arrive with no start date and no term, so the extremes and the
  // mean have to survive rows that carry neither.
  it("returns null dates and term when no contract carries them", () => {
    const figures = deriveContractFigures(
      [contract({ contract_start: null, term_months: null })],
      1
    )
    expect(figures).toEqual({
      lesseeCount: 1,
      earliestStart: null,
      latestStart: null,
      averageTermMonths: null,
    })
  })

  it("ignores rows with no term when averaging the rest", () => {
    const figures = deriveContractFigures(
      [
        contract({
          id: "00000000-0000-4000-8000-0000000000c1",
          term_months: 12,
        }),
        contract({
          id: "00000000-0000-4000-8000-0000000000c2",
          term_months: null,
        }),
        contract({
          id: "00000000-0000-4000-8000-0000000000c3",
          term_months: 24,
        }),
      ],
      3
    )
    // 12 and 24 average to 18; the null row must not drag it toward zero.
    expect(figures?.averageTermMonths).toBe(18)
  })

  it("rounds a fractional average to whole months", () => {
    const figures = deriveContractFigures(
      [
        contract({
          id: "00000000-0000-4000-8000-0000000000c1",
          term_months: 12,
        }),
        contract({
          id: "00000000-0000-4000-8000-0000000000c2",
          term_months: 13,
        }),
      ],
      2
    )
    expect(figures?.averageTermMonths).toBe(13)
  })

  it("handles an empty but complete list", () => {
    expect(deriveContractFigures([], 0)).toEqual({
      lesseeCount: 0,
      earliestStart: null,
      latestStart: null,
      averageTermMonths: null,
    })
  })
})

describe("canShowRemainingAvailable", () => {
  // The spec requires the line to disappear rather than read zero when no volume is maintained —
  // and records that none is known for any of the seven leasing companies, so this is the norm.
  it("hides the figure when the backend says the limit is not available", () => {
    expect(
      canShowRemainingAvailable({
        limit_available_flag: false,
        available_volume_eur: 850000,
      })
    ).toBe(false)
  })

  // An unstated flag is not permission to display a number.
  it("hides the figure when the flag is null", () => {
    expect(
      canShowRemainingAvailable({
        limit_available_flag: null,
        available_volume_eur: 850000,
      })
    ).toBe(false)
  })

  it("hides the figure when there is no figure", () => {
    expect(
      canShowRemainingAvailable({
        limit_available_flag: true,
        available_volume_eur: null,
      })
    ).toBe(false)
  })

  it("shows the figure only when the flag is true and a value exists", () => {
    expect(
      canShowRemainingAvailable({
        limit_available_flag: true,
        available_volume_eur: 850000,
      })
    ).toBe(true)
  })

  // Zero with the flag set is a real answer — the limit is fully used — and must render rather
  // than being swallowed by a falsy check.
  it("shows a genuine zero", () => {
    expect(
      canShowRemainingAvailable({
        limit_available_flag: true,
        available_volume_eur: 0,
      })
    ).toBe(true)
  })
})
