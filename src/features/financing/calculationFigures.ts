import { FRONT_OFFICE_ROLE } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import type {
  FinancingComponentResponse,
  FinancingRead,
} from "@/features/financing/api/schema"

/**
 * Pure helpers for the case's Calculation area — US 1.15.
 *
 * Nothing here computes a financing. The engine is server-side, and the calculation specification
 * warns that its own reproduction page "nudges values before rounding" and says not to copy the
 * trick. What this module does is **sum figures the backend already rounded**, decide what may be
 * edited, and convert between the wire's quota fraction and the percentage a person reads.
 *
 * ── WHY THE SUMS ARE IN INTEGER CENTS ──────────────────────────────────────────────────────────
 * "Amounts and rates are decimal strings on purpose — do not parse them into binary floats."
 * The acceptance gate is 0.02 EUR per reference case, so a float sum of eighteen contracts can
 * drift inside the tolerance that decides whether the figure is right.
 *
 * ── R2: ROUND PER CONTRACT, THEN SUM — AND MAKE THE WRONG ORDER HARD TO WRITE ──────────────────
 * The story calls summing unrounded per-contract figures "a real defect rather than a stylistic
 * preference" and forbids any shared helper from doing it. `sumRoundedCents` therefore only ever
 * accepts the **already-rounded per-contract strings the backend sends**; it has no access to an
 * unrounded figure and no code path that could produce one. There is deliberately no helper here
 * that takes a rate and a cash flow.
 */

// Two decimal places, matched exactly — a third would mean the value was never rounded per contract,
// which is the defect R2 exists to prevent, so it is refused rather than silently truncated.
const AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/

const CENTS_PER_EURO = 100

/**
 * The Treasury notification threshold. Crossing it is a **warning, not a block**: the case is
 * flagged, the notice step becomes applicable, and nothing already done is undone.
 */
export const TREASURY_THRESHOLD_EUR = 2_000_000

// The rate carries three decimals everywhere — on entry, on screen and in the hand-over file —
// because the bank's own system carries three and a difference in the third decimal produces a
// different repayment schedule.
export const RATE_DECIMAL_PLACES = 3

// Seven by default; seven or fourteen per tenant, never longer.
export const RATE_LOCK_DAY_OPTIONS = [7, 14] as const
export const DEFAULT_RATE_LOCK_DAYS = 7

/**
 * Parse one already-rounded decimal-string amount into integer cents.
 *
 * Returns null for an absent figure and **throws** for a value carrying more than two decimals,
 * because that means an unrounded per-contract figure reached this layer.
 */
export function amountToCents(amount: string | null): number | null {
  if (amount === null) return null
  const trimmed = amount.trim()
  if (trimmed === "") return null
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw new Error(
      `Refusing to sum "${amount}": a per-contract amount must already be rounded to the cent (US 1.15 R2).`
    )
  }
  const negative = trimmed.startsWith("-")
  const [whole, fraction = ""] = trimmed.replace("-", "").split(".")
  const cents = Number(whole) * CENTS_PER_EURO + Number(fraction.padEnd(2, "0"))
  return negative ? -cents : cents
}

export function centsToAmount(cents: number): string {
  const negative = cents < 0
  const abs = Math.abs(cents)
  const whole = Math.floor(abs / CENTS_PER_EURO)
  const fraction = String(abs % CENTS_PER_EURO).padStart(2, "0")
  return `${negative ? "-" : ""}${whole}.${fraction}`
}

/**
 * Sum per-contract figures the backend already rounded.
 *
 * Returns null when **any** contract's figure is absent: a package total built from a subset would
 * understate the deal while looking like a complete figure. A partial sum is worse than none.
 */
export function sumRoundedCents(amounts: (string | null)[]): string | null {
  if (amounts.length === 0) return null
  let total = 0
  for (const amount of amounts) {
    const cents = amountToCents(amount)
    if (cents === null) return null
    total += cents
  }
  return centsToAmount(total)
}

/**
 * The package's figures, each the sum of its rounded per-contract parts.
 *
 * R4: `financedResidual` and `scheduleFinalInstalment` are returned as two separate fields and are
 * never reconciled against each other. They legitimately differ by cents — by one cent and by four
 * cents in the two real cases on record — and a caller that treats a difference as an error would
 * be reporting correct arithmetic as a fault.
 */
export type PackageFigures = {
  financingAmount: string | null
  financedResidual: string | null
  runningInstalment: string | null
  scheduleFinalInstalment: string | null
}

export function packageFigures(
  components: FinancingComponentResponse[]
): PackageFigures {
  return {
    financingAmount: sumRoundedCents(
      components.map(c => c.financing_amount_share)
    ),
    financedResidual: sumRoundedCents(components.map(c => c.financed_residual)),
    runningInstalment: sumRoundedCents(
      components.map(c => c.share_running_instalment)
    ),
    scheduleFinalInstalment: sumRoundedCents(
      components.map(c => c.share_final_instalment)
    ),
  }
}

/** Whether the financing amount crosses the Treasury threshold. A warning, never a block. */
export function isTreasuryThresholdCrossed(
  financingAmount: string | null
): boolean {
  const cents = financingAmount === null ? null : amountToCents(financingAmount)
  if (cents === null) return false
  return cents > TREASURY_THRESHOLD_EUR * CENTS_PER_EURO
}

// ── The three freeze points (R5) ─────────────────────────────────────────────────────────────────
// Three separate predicates on purpose. A single "is the case frozen" check would collapse them,
// and the story is explicit that building against the wrong one of the three either locks the rate
// before it is known or lets it move after the loan exists.

/** Step 4, phase A — the committed rate and its expiry freeze once a rate has been committed. */
export function isCommittedRateFrozen(financing: FinancingRead): boolean {
  return financing.committed_rate !== null
}

/**
 * Step 18, phase C — settlement and plan freeze from the loan's creation in the core banking
 * system. A component carrying a freeze timestamp is the evidence that this has happened.
 */
export function isPlanFrozen(
  components: FinancingComponentResponse[]
): boolean {
  return components.some(c => c.freeze_timestamp !== null)
}

/**
 * Step 15, phase C — the rate field stays editable until the bank settlement, and there is no
 * post-settlement rate editing at all.
 *
 * The loan number is what marks the settlement having happened: it is issued by the core banking
 * system, so it cannot be present before the loan exists. `settlement_ready` deliberately does not
 * appear here — it means "may now settle", not "has settled", and reading it as the latter would
 * close the field at exactly the moment the rate is finally needed.
 */
export function isRateEditable(
  financing: FinancingRead,
  components: FinancingComponentResponse[]
): boolean {
  return financing.loan_number === null && !isPlanFrozen(components)
}

/**
 * Only the preparing role enters the rate, deliberately without four eyes — the audit trail and the
 * "until the bank settlement" boundary are the control instead.
 *
 * The earlier row letting the releasing role act on the same fields is withdrawn: the review names
 * the preparing role only, so back_office reads the figures but does not edit them.
 */
export function canEditRate(role: UserRole | undefined): boolean {
  return role === FRONT_OFFICE_ROLE
}

// ── The rate ─────────────────────────────────────────────────────────────────────────────────────

// Up to three decimals, and nothing else. No default and no prefill anywhere: "a filled field looks
// like a checked field and a wrong rate that arrives prefilled will not be questioned."
const RATE_PATTERN = /^\d+(\.\d{1,3})?$/

export function isValidRateInput(input: string): boolean {
  return RATE_PATTERN.test(input.trim())
}

/** Render a wire rate at three decimals, unconditionally. */
export function formatRate(rate: string | null): string | null {
  if (rate === null || rate.trim() === "") return null
  const value = Number(rate)
  if (!Number.isFinite(value)) return null
  return value.toFixed(RATE_DECIMAL_PLACES)
}

// ── The quota ────────────────────────────────────────────────────────────────────────────────────
// The wire carries a fraction capped at 1.0; a person reads and types a percentage. The two are
// converted at this boundary rather than anywhere a screen might forget to.

const QUOTA_PERCENT_PATTERN = /^\d+(\.\d{1,4})?$/

export function quotaFractionToPercent(fraction: string | null): string | null {
  if (fraction === null || fraction.trim() === "") return null
  const value = Number(fraction)
  if (!Number.isFinite(value)) return null
  // Trailing zeros dropped so 0.98 reads as "98" rather than "98.0000".
  return String(Number((value * 100).toFixed(4)))
}

/**
 * Convert a typed percentage to the wire's fraction, or null when it is not usable.
 *
 * The quota is "never validated; zero on the residual is legitimate", so zero is accepted. What is
 * refused is a value the endpoint itself would reject — above 100 per cent, since the contract caps
 * the fraction at 1.0.
 */
export function quotaPercentToFraction(percent: string): string | null {
  const trimmed = percent.trim()
  if (!QUOTA_PERCENT_PATTERN.test(trimmed)) return null
  const value = Number(trimmed)
  if (value > 100) return null
  return String(Number((value / 100).toFixed(6)))
}

/**
 * Whether the committed rate ran out before the value date — the click dummy's warning: *"The rate
 * was quoted on X and held for Y, so it ran out on Z — before the value date. Quote it again or
 * record why it still applies."*
 *
 * Both dates are plain `YYYY-MM-DD` strings, so they compare lexicographically without parsing —
 * which also avoids the timezone shift a `new Date()` round-trip would introduce on a date-only
 * value.
 *
 * It is a **warning, not a block**. The dummy offers "record why it still applies", so a rate past
 * its expiry is a state the bank can proceed from deliberately; refusing to show the figures would
 * be the screen making that call instead of the user.
 */
export function isCommittedRateStale(financing: FinancingRead): boolean {
  const { committed_rate_expiry: expiry, value_date: valueDate } = financing
  if (expiry === null || valueDate === null) return false
  return expiry < valueDate
}
