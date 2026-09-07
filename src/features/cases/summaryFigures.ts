import type { CaseContract } from "@/features/cases/api/schema"

/**
 * The wizard summary's contract figures (US 1.17), derived from the case's contract list.
 *
 * ── WHY THESE ARE DERIVED AND NOT READ ─────────────────────────────────────────────────────────
 * The design's Contracts card shows six figures. `GET /cases/{id}/contracts/totals`
 * (`PackageTotalsRead`) carries only `contract_count` and three money sums — **no lessee count, no
 * earliest or latest start date, no average term**. Those four exist per contract on `ContractRead`,
 * so they are computed here rather than requested.
 *
 * ── WHY THE RESULT CAN BE NULL ─────────────────────────────────────────────────────────────────
 * A derived aggregate is only true if every contract was counted. The list endpoint pages, and the
 * design's own example shows 156 contracts, so a short page is a realistic state. When the fetched
 * rows do not cover the server's `total`, this returns `null` and the card omits the figures — a
 * missing figure is honest, a figure computed from 200 of 156… or from 200 of 400 is a wrong number
 * presented as fact.
 *
 * ── "NUMBER OF OBJECTS" IS NOT HERE ────────────────────────────────────────────────────────────
 * It cannot be derived. `ContractRead` carries no object count, and the only `object_count` on the
 * wire hangs off the financing overview — which does not exist until the request is approved, long
 * after this screen. So that one figure is genuinely unavailable and is omitted outright.
 */
export interface DerivedContractFigures {
  /** Distinct `lessee_partner_id` values. Contracts with no lessee recorded are not counted. */
  lesseeCount: number
  /** ISO date strings, or null when no contract carries a start date. */
  earliestStart: string | null
  latestStart: string | null
  /** Mean term in whole months, rounded. Null when no contract carries a term. */
  averageTermMonths: number | null
}

export function deriveContractFigures(
  contracts: readonly CaseContract[],
  total: number
): DerivedContractFigures | null {
  // The guard that makes this safe. `>=` rather than `===` because a server total lower than the
  // rows returned would also mean the two disagree, and guessing which is right is not this
  // function's job.
  if (contracts.length < total) return null

  const lessees = new Set<string>()
  const startDates: string[] = []
  const terms: number[] = []

  for (const contract of contracts) {
    if (contract.lessee_partner_id !== null) {
      lessees.add(contract.lessee_partner_id)
    }
    if (contract.contract_start !== null) {
      startDates.push(contract.contract_start)
    }
    if (contract.term_months !== null) {
      terms.push(contract.term_months)
    }
  }

  // ISO dates sort lexicographically, so no parsing is needed to find the extremes — and no
  // timezone can shift them, which a Date round-trip could.
  const sorted = [...startDates].sort()

  return {
    lesseeCount: lessees.size,
    earliestStart: sorted[0] ?? null,
    latestStart: sorted[sorted.length - 1] ?? null,
    averageTermMonths:
      terms.length === 0
        ? null
        : Math.round(terms.reduce((sum, term) => sum + term, 0) / terms.length),
  }
}

/**
 * Whether the framework agreement's remaining-available figure may be shown.
 *
 * The spec is explicit that when no framework volume is maintained the remaining-available line
 * must **disappear rather than read zero** — and it records that no volume is known for any of the
 * seven leasing companies, so the empty case is the normal one. `limit_available_flag` is the
 * backend's own statement of whether the figure means anything; a null flag is treated as "no",
 * because an unstated flag is not permission to display a number.
 */
export function canShowRemainingAvailable(utilization: {
  limit_available_flag: boolean | null
  // A number, not a decimal string: `FAUtilizationResponseSchema` coerces this resource's money to
  // numbers, unlike the case and financing responses. Following the schema rather than the house
  // convention, because the schema is what the data actually arrives as.
  available_volume_eur: number | null
}): boolean {
  return (
    utilization.limit_available_flag === true &&
    utilization.available_volume_eur !== null
  )
}
