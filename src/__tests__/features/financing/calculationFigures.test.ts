import { describe, expect, it } from "vitest"
import {
  DEFAULT_RATE_LOCK_DAYS,
  RATE_LOCK_DAY_OPTIONS,
  TREASURY_THRESHOLD_EUR,
  amountToCents,
  canEditRate,
  centsToAmount,
  formatRate,
  isCommittedRateFrozen,
  isPlanFrozen,
  isRateEditable,
  isTreasuryThresholdCrossed,
  isValidRateInput,
  packageFigures,
  quotaFractionToPercent,
  quotaPercentToFraction,
  sumRoundedCents,
} from "@/features/financing/calculationFigures"
import type {
  FinancingComponentResponse,
  FinancingRead,
} from "@/features/financing/api/schema"

function component(
  overrides: Partial<FinancingComponentResponse> = {}
): FinancingComponentResponse {
  return {
    id: "00000000-0000-4000-8000-00000000fc01",
    contract_id: "00000000-0000-4000-8000-0000000000c1",
    status: "calculated",
    calculated_as_of: "2026-09-08T09:00:00Z",
    freeze_timestamp: null,
    financing_amount_share: "744621.03",
    financed_residual: "719779.83",
    share_running_instalment: "8322.91",
    share_final_instalment: "719779.78",
    ...overrides,
  }
}

function financing(overrides: Partial<FinancingRead> = {}): FinancingRead {
  return {
    id: "00000000-0000-4000-8000-00000000f001",
    case_id: "00000000-0000-4000-8000-00000000c005",
    financing_reference: "FIN-2026-0005",
    framework_agreement_id: null,
    product_template_id: null,
    product_template_version: null,
    kind: "package",
    refinancing_rate: null,
    refinancing_quota_override: null,
    effective_quota: "0.98",
    value_date: "2026-10-01",
    committed_rate: null,
    committed_rate_expiry: null,
    rate_lock_days: null,
    settlement_ready: false,
    calculation_state: "pending",
    calculation_version: 1,
    loan_number: null,
    loan_account: null,
    status: "active",
    created_by: "00000000-0000-4000-8000-000000000005",
    created_at: "2026-08-01T09:00:00Z",
    ...overrides,
  }
}

describe("amountToCents / centsToAmount", () => {
  it("round-trips a two-decimal amount exactly", () => {
    expect(centsToAmount(amountToCents("744621.03") as number)).toBe(
      "744621.03"
    )
  })

  it("treats a missing decimal part as whole euros", () => {
    expect(amountToCents("1000")).toBe(100_000)
  })

  it("pads a single decimal place", () => {
    expect(amountToCents("10.5")).toBe(1050)
  })

  it("returns null for an absent or blank figure", () => {
    expect(amountToCents(null)).toBeNull()
    expect(amountToCents("   ")).toBeNull()
  })

  it("handles negatives", () => {
    expect(amountToCents("-12.34")).toBe(-1234)
    expect(centsToAmount(-1234)).toBe("-12.34")
  })

  // This is the R2 guard: an amount carrying a third decimal was never rounded per contract, and
  // summing it is the defect the story calls "a real defect rather than a stylistic preference".
  it("throws rather than silently truncating an unrounded figure", () => {
    expect(() => amountToCents("100.005")).toThrow(/already be rounded/)
  })

  it("throws on a non-numeric string instead of coercing to NaN", () => {
    expect(() => amountToCents("1.2.3")).toThrow()
    expect(() => amountToCents("abc")).toThrow()
  })
})

describe("sumRoundedCents", () => {
  // The whole reason the sum is done in integer cents: 0.1 + 0.2 !== 0.3 in binary floating point,
  // and the acceptance gate is two cents across eighteen contracts.
  it("sums without floating-point drift", () => {
    expect(sumRoundedCents(["0.10", "0.20"])).toBe("0.30")
  })

  it("sums the two-contract reference figures exactly", () => {
    expect(sumRoundedCents(["744621.03", "744621.03"])).toBe("1489242.06")
  })

  it("returns null when any contract's figure is absent", () => {
    // A package total built from a subset would understate the deal while looking complete.
    expect(sumRoundedCents(["744621.03", null])).toBeNull()
  })

  it("returns null for no contracts at all", () => {
    expect(sumRoundedCents([])).toBeNull()
  })

  it("refuses to sum an unrounded per-contract figure", () => {
    expect(() => sumRoundedCents(["1.001", "2.00"])).toThrow(
      /already be rounded/
    )
  })
})

describe("packageFigures", () => {
  const rows = [
    component({ share_final_instalment: "719779.78" }),
    component({
      id: "00000000-0000-4000-8000-00000000fc02",
      contract_id: "00000000-0000-4000-8000-0000000000c2",
      share_final_instalment: "719779.84",
    }),
  ]

  it("sums each figure from its rounded per-contract parts", () => {
    const figures = packageFigures(rows)
    expect(figures.financingAmount).toBe("1489242.06")
    expect(figures.runningInstalment).toBe("16645.82")
  })

  // R4: the two final figures are separate quantities, neither computed from the other. Here they
  // differ by four cents — which is correct arithmetic, not a rounding fault to be reconciled.
  it("keeps the schedule final instalment and the quota'd residual apart", () => {
    const figures = packageFigures(rows)
    expect(figures.scheduleFinalInstalment).toBe("1439559.62")
    expect(figures.financedResidual).toBe("1439559.66")
    expect(figures.scheduleFinalInstalment).not.toBe(figures.financedResidual)
  })

  it("reports every figure as null when there are no components", () => {
    expect(packageFigures([])).toEqual({
      financingAmount: null,
      financedResidual: null,
      runningInstalment: null,
      scheduleFinalInstalment: null,
    })
  })

  it("reports a figure as null when one contract is missing it, leaving the others intact", () => {
    const figures = packageFigures([
      rows[0],
      component({ financed_residual: null }),
    ])
    expect(figures.financedResidual).toBeNull()
    expect(figures.financingAmount).toBe("1489242.06")
  })
})

describe("isTreasuryThresholdCrossed", () => {
  it("is false below and at the threshold, true above it", () => {
    expect(isTreasuryThresholdCrossed("1999999.99")).toBe(false)
    expect(isTreasuryThresholdCrossed(String(TREASURY_THRESHOLD_EUR))).toBe(
      false
    )
    expect(isTreasuryThresholdCrossed("2000000.01")).toBe(true)
  })

  // Pending is not "under the threshold" — with no amount there is nothing to compare, and a
  // warning shown against an absent figure would be noise.
  it("is false when the amount is pending", () => {
    expect(isTreasuryThresholdCrossed(null)).toBe(false)
  })
})

describe("the three freeze points (R5)", () => {
  it("freezes the committed rate only once one is committed", () => {
    expect(isCommittedRateFrozen(financing())).toBe(false)
    expect(isCommittedRateFrozen(financing({ committed_rate: "4.250" }))).toBe(
      true
    )
  })

  it("freezes the plan when any component carries a freeze timestamp", () => {
    expect(isPlanFrozen([component()])).toBe(false)
    expect(
      isPlanFrozen([
        component(),
        component({ freeze_timestamp: "2026-11-01T10:00:00Z" }),
      ])
    ).toBe(true)
  })

  // The three are independent. Committing the rate at step 4 must NOT close the field at step 15 —
  // collapsing them would lock the rate before it is known.
  it("leaves the rate editable after the committed rate freezes", () => {
    const record = financing({
      committed_rate: "4.250",
      committed_rate_expiry: "2026-09-15",
    })
    expect(isCommittedRateFrozen(record)).toBe(true)
    expect(isRateEditable(record, [component()])).toBe(true)
  })

  it("closes the rate field once the loan exists", () => {
    expect(
      isRateEditable(financing({ loan_number: "LN-4711" }), [component()])
    ).toBe(false)
  })

  it("closes the rate field once the plan is frozen", () => {
    expect(
      isRateEditable(financing(), [
        component({ freeze_timestamp: "2026-11-01T10:00:00Z" }),
      ])
    ).toBe(false)
  })

  // `settlement_ready` means "may now settle", not "has settled". Reading it as the latter would
  // close the field at exactly the moment the rate is finally needed.
  it("does not close the rate field merely because settlement is ready", () => {
    expect(
      isRateEditable(
        financing({ settlement_ready: true, refinancing_rate: "4.250" }),
        [component()]
      )
    ).toBe(true)
  })
})

describe("canEditRate", () => {
  it("allows only the preparing role", () => {
    expect(canEditRate("front_office")).toBe(true)
  })

  // The review names the preparing role only; the earlier row letting the releasing role act on
  // the same fields is withdrawn.
  it("refuses every other role, including back_office", () => {
    for (const role of [
      "back_office",
      "bank_power_user",
      "auditor",
      "system_admin",
      "support_user",
      "leasing_company_user",
    ] as const) {
      expect(canEditRate(role)).toBe(false)
    }
  })

  it("refuses an unknown role", () => {
    expect(canEditRate(undefined)).toBe(false)
  })
})

describe("the rate", () => {
  it("accepts up to three decimal places", () => {
    expect(isValidRateInput("4")).toBe(true)
    expect(isValidRateInput("4.2")).toBe(true)
    expect(isValidRateInput("4.250")).toBe(true)
  })

  // The bank's own system carries three decimals and a difference in the third produces a
  // different repayment schedule, so a fourth is refused rather than rounded away.
  it("refuses a fourth decimal place", () => {
    expect(isValidRateInput("4.2501")).toBe(false)
  })

  it("refuses a negative or non-numeric rate", () => {
    expect(isValidRateInput("-1.0")).toBe(false)
    expect(isValidRateInput("four")).toBe(false)
    expect(isValidRateInput("")).toBe(false)
  })

  it("renders at three decimals regardless of how it arrived", () => {
    expect(formatRate("4.25")).toBe("4.250")
    expect(formatRate("4")).toBe("4.000")
  })

  it("renders nothing for an absent rate rather than a zero", () => {
    expect(formatRate(null)).toBeNull()
    expect(formatRate("")).toBeNull()
  })

  it("defaults the lock to seven days and offers only seven or fourteen", () => {
    expect(DEFAULT_RATE_LOCK_DAYS).toBe(7)
    expect([...RATE_LOCK_DAY_OPTIONS]).toEqual([7, 14])
  })
})

describe("the quota", () => {
  // The wire carries a fraction capped at 1.0; a person reads a percentage.
  it("converts the wire fraction to a readable percentage", () => {
    expect(quotaFractionToPercent("0.98")).toBe("98")
    expect(quotaFractionToPercent("1")).toBe("100")
    expect(quotaFractionToPercent("0.955")).toBe("95.5")
  })

  it("converts a typed percentage back to the wire fraction", () => {
    expect(quotaPercentToFraction("98")).toBe("0.98")
    expect(quotaPercentToFraction("95.5")).toBe("0.955")
  })

  // "Never validated; zero on the residual is legitimate."
  it("accepts zero", () => {
    expect(quotaPercentToFraction("0")).toBe("0")
  })

  // The endpoint caps the fraction at 1.0, so anything above 100 % would be refused anyway.
  it("refuses more than one hundred per cent", () => {
    expect(quotaPercentToFraction("101")).toBeNull()
  })

  it("refuses a negative or non-numeric quota", () => {
    expect(quotaPercentToFraction("-5")).toBeNull()
    expect(quotaPercentToFraction("many")).toBeNull()
  })

  it("renders nothing for an absent quota", () => {
    expect(quotaFractionToPercent(null)).toBeNull()
  })
})
