import type { PaymentPlanEntry } from "@/features/cases/api/schema"

/**
 * The Cash flow tab's editable rows (US 1.11).
 *
 * Pure so the row arithmetic and the validity rule are testable without a form — and on this screen
 * the arithmetic is the point: the calculation specification's acceptance gate is 0.02 EUR on the
 * present value, and *"the schedule is what the lessor receives"*.
 */

export interface PlanRowDraft {
  due_date: string
  amount: string
  is_final: boolean
}

export const EMPTY_PLAN_ROW: PlanRowDraft = {
  due_date: "",
  amount: "",
  is_final: false,
}

export function toPlanRowDrafts(
  entries: readonly PaymentPlanEntry[]
): PlanRowDraft[] {
  return entries.map(e => ({
    due_date: e.due_date,
    amount: e.amount,
    is_final: e.is_final,
  }))
}

/**
 * Sums the rows as a **decimal string**, never via float arithmetic.
 *
 * The calculation spec is explicit that amounts are decimal strings *"on purpose — do not parse
 * them into binary floats"*, and this total is shown next to figures a 0.02 EUR gate is measured
 * against. So it is summed in integer cents and formatted back, which is exact for two-decimal
 * money; `0.1 + 0.2` in floats is not.
 *
 * A row whose amount does not parse is skipped rather than poisoning the total with NaN — the row
 * itself is flagged separately by `invalidRowIndexes`.
 */
export function sumPlanRows(rows: readonly PlanRowDraft[]): string {
  let cents = 0
  for (const row of rows) {
    const parsed = parseAmountToCents(row.amount)
    if (parsed !== null) cents += parsed
  }
  const sign = cents < 0 ? "-" : ""
  const abs = Math.abs(cents)
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`
}

/**
 * A money string → integer cents, or null when it is not money.
 *
 * Accepts a comma decimal (a German keyboard produces one) and at most two decimal places, because
 * a third would be a figure this schedule cannot represent rather than something to round silently.
 */
export function parseAmountToCents(value: string): number | null {
  const trimmed = value.trim().replace(",", ".")
  if (trimmed === "") return null
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) return null
  const [whole, frac = ""] = trimmed.replace("-", "").split(".")
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"))
  return trimmed.startsWith("-") ? -cents : cents
}

/** Rows the backend would reject: no date, or an amount that is not money. */
export function invalidRowIndexes(rows: readonly PlanRowDraft[]): number[] {
  return rows.reduce<number[]>((out, row, index) => {
    const badDate = row.due_date.trim() === ""
    const badAmount = parseAmountToCents(row.amount) === null
    if (badDate || badAmount) out.push(index)
    return out
  }, [])
}

/**
 * Whether the draft may be saved.
 *
 * Every row valid, at least one row, and **exactly one final row** — a schedule with no final
 * payment never closes, and one with two has an ambiguous maturity. `is_final` is a required
 * boolean on the wire precisely because the backend needs to know which line closes the plan.
 */
export function canSavePlan(rows: readonly PlanRowDraft[]): boolean {
  if (rows.length === 0) return false
  if (invalidRowIndexes(rows).length > 0) return false
  return rows.filter(row => row.is_final).length === 1
}
