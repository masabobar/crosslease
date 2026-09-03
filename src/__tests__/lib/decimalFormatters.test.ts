import { describe, expect, it } from "vitest"
import { formatDecimalCurrency, formatDecimalPercent } from "@/lib/formatters"
import { EUR_CURRENCY_CODE } from "@/lib/constants"

describe("formatDecimalCurrency", () => {
  it("formats a decimal string the way the design shows amounts", () => {
    expect(formatDecimalCurrency("423171.22", EUR_CURRENCY_CODE)).toBe(
      "€ 423.171,22"
    )
  })

  it("renders an em-dash for null instead of a zero amount", () => {
    // The whole reason this helper exists: `formatCurrency(Number(null), …)` yields "€ 0,00", which
    // reads as a real figure of zero rather than "not calculated yet".
    expect(formatDecimalCurrency(null, EUR_CURRENCY_CODE)).toBe("—")
  })

  it("renders an em-dash for a non-numeric string rather than NaN", () => {
    expect(formatDecimalCurrency("pending", EUR_CURRENCY_CODE)).toBe("—")
  })

  it("keeps a genuine zero distinguishable from null", () => {
    expect(formatDecimalCurrency("0.00", EUR_CURRENCY_CODE)).toBe("€ 0,00")
  })

  it("formats cent precision without rounding it away", () => {
    expect(formatDecimalCurrency("372868.01", EUR_CURRENCY_CODE)).toBe(
      "€ 372.868,01"
    )
  })
})

describe("formatDecimalPercent", () => {
  it("formats a rate to three decimals when asked", () => {
    // The design shows 4,650 % and rates are priced to a basis point — two decimals would round
    // away half a basis point on a figure the bank prices from.
    expect(formatDecimalPercent("4.650", 3)).toBe("4,650 %")
  })

  it("defaults to two decimals for quotas and ratios", () => {
    expect(formatDecimalPercent("97.00")).toBe("97,00 %")
  })

  it("pads a value that carries fewer decimals than requested", () => {
    expect(formatDecimalPercent("4.6", 3)).toBe("4,600 %")
  })

  it("renders an em-dash for null", () => {
    expect(formatDecimalPercent(null)).toBe("—")
  })

  it("renders an em-dash for a non-numeric string", () => {
    expect(formatDecimalPercent("n/a")).toBe("—")
  })
})
