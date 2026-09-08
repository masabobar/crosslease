import { describe, expect, it } from "vitest"
import {
  EMPTY_PLAN_ROW,
  canSavePlan,
  invalidRowIndexes,
  parseAmountToCents,
  sumPlanRows,
  toPlanRowDrafts,
} from "@/features/cases/paymentPlanRows"
import type { PlanRowDraft } from "@/features/cases/paymentPlanRows"

const row = (o: Partial<PlanRowDraft> = {}): PlanRowDraft => ({
  due_date: "2026-09-01",
  amount: "1250.00",
  is_final: false,
  ...o,
})

describe("parseAmountToCents", () => {
  it("parses a plain decimal", () => {
    expect(parseAmountToCents("1250.00")).toBe(125000)
    expect(parseAmountToCents("1250.5")).toBe(125050)
    expect(parseAmountToCents("7")).toBe(700)
  })

  // A German keyboard produces a comma; the backend should not be left guessing the separator.
  it("accepts a comma decimal", () => {
    expect(parseAmountToCents("1234,56")).toBe(123456)
  })

  it("handles a negative amount", () => {
    expect(parseAmountToCents("-500.25")).toBe(-50025)
  })

  // A third decimal is a figure this schedule cannot represent, so it is refused rather than
  // silently rounded — rounding it would move a number the 0.02 EUR gate is measured against.
  it("refuses more than two decimals", () => {
    expect(parseAmountToCents("1.234")).toBeNull()
  })

  it("refuses what is not money", () => {
    expect(parseAmountToCents("")).toBeNull()
    expect(parseAmountToCents("abc")).toBeNull()
    expect(parseAmountToCents("1.2.3")).toBeNull()
  })
})

describe("sumPlanRows", () => {
  // The reason this exists: 0.1 + 0.2 in floats is 0.30000000000000004. The calculation spec is
  // explicit that amounts are decimal strings and must not become binary floats, and the total is
  // shown beside figures a 0.02 EUR gate applies to.
  it("sums exactly where float arithmetic would not", () => {
    expect(
      sumPlanRows([row({ amount: "0.10" }), row({ amount: "0.20" })])
    ).toBe("0.30")
  })

  it("sums a realistic schedule", () => {
    expect(
      sumPlanRows([
        row({ amount: "16645.82" }),
        row({ amount: "16645.82" }),
        row({ amount: "1439559.66" }),
      ])
    ).toBe("1472851.30")
  })

  it("is zero for no rows", () => {
    expect(sumPlanRows([])).toBe("0.00")
  })

  // An unparseable row must not poison the total with NaN; it is flagged separately.
  it("skips a row whose amount is not money", () => {
    expect(
      sumPlanRows([row({ amount: "100.00" }), row({ amount: "??" })])
    ).toBe("100.00")
  })

  it("carries a negative total", () => {
    expect(
      sumPlanRows([row({ amount: "-50.00" }), row({ amount: "10.00" })])
    ).toBe("-40.00")
  })
})

describe("invalidRowIndexes", () => {
  it("finds nothing wrong with a good schedule", () => {
    expect(invalidRowIndexes([row(), row()])).toEqual([])
  })

  it("flags a row with no date and a row with a bad amount", () => {
    expect(
      invalidRowIndexes([
        row(),
        row({ due_date: "" }),
        row({ amount: "1.234" }),
      ])
    ).toEqual([1, 2])
  })

  it("flags a wholly empty row", () => {
    expect(invalidRowIndexes([EMPTY_PLAN_ROW])).toEqual([0])
  })
})

describe("canSavePlan", () => {
  // Exactly one final line: none and the schedule never closes, two and maturity is ambiguous.
  it("requires exactly one final line", () => {
    expect(canSavePlan([row(), row({ is_final: true })])).toBe(true)
    expect(canSavePlan([row(), row()])).toBe(false)
    expect(
      canSavePlan([row({ is_final: true }), row({ is_final: true })])
    ).toBe(false)
  })

  it("refuses an empty schedule", () => {
    expect(canSavePlan([])).toBe(false)
  })

  it("refuses a schedule with an invalid row even when the final rule holds", () => {
    expect(canSavePlan([row({ amount: "x" }), row({ is_final: true })])).toBe(
      false
    )
  })
})

describe("toPlanRowDrafts", () => {
  // `origin` is dropped on purpose: it is the backend's statement about a line, not something the
  // editor sends back.
  it("keeps date, amount and the final flag, and drops origin", () => {
    expect(
      toPlanRowDrafts([
        {
          due_date: "2026-09-01",
          amount: "1250.00",
          is_final: false,
          origin: "generated",
        },
      ])
    ).toEqual([{ due_date: "2026-09-01", amount: "1250.00", is_final: false }])
  })
})
