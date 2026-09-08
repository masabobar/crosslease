import { BACK_OFFICE_ROLE, FRONT_OFFICE_ROLE } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import type { CollateralResponse } from "@/features/cases/api/schema"

/**
 * The collateral re-check rules — US 1.14 R2, and the design's "DAT DATA … Edit" block.
 *
 * The whole reason this is a module rather than three conditions inside the panel: the re-check
 * clears through **three acts by two roles, and never through confirmation alone**. Every one of
 * the rules below is a way that could go wrong invisibly, so each is named and tested.
 *
 * - `needs_recheck` → the composition changed; approval is blocked and there is nothing to confirm
 *   yet, because no new figure exists.
 * - `redetermined` → the preparing role has entered a fresh figure; still blocked until someone
 *   else confirms it.
 * - `clear` → the releasing role, **a different person**, confirmed that re-determined figure.
 *
 * The trap this guards against is offering Confirm while the state is `needs_recheck`: that would
 * let the *old* figure be confirmed, which is exactly what the three-act rule exists to prevent.
 */

/** Approval is blocked while the collateral figure is not confirmed. */
export function isApprovalBlockedByCollateral(
  collateral: CollateralResponse
): boolean {
  return collateral.recheck_state !== "clear"
}

/**
 * Re-determining is the preparing role's act, and only makes sense while a re-check is outstanding.
 *
 * It stays available in `redetermined` too: a first re-determination that was itself wrong must be
 * correctable before anyone confirms it.
 */
export function canRedetermine(
  collateral: CollateralResponse,
  role: UserRole | undefined
): boolean {
  return role === FRONT_OFFICE_ROLE && collateral.recheck_state !== "clear"
}

/**
 * Confirming requires the `redetermined` state — never `needs_recheck`.
 *
 * `currentUserId` is compared against `redetermined_by` so the same person cannot supply both
 * pairs of eyes. The backend is the security boundary; hiding the control is the UX half, and
 * showing it to the re-determiner would invite a refusal they cannot act on.
 */
export function canConfirm(
  collateral: CollateralResponse,
  role: UserRole | undefined,
  currentUserId: string | undefined
): boolean {
  if (role !== BACK_OFFICE_ROLE) return false
  if (collateral.recheck_state !== "redetermined") return false
  return (
    currentUserId !== undefined && currentUserId !== collateral.redetermined_by
  )
}

/**
 * Editing the figure outright — as opposed to re-determining it — belongs to the preparing role
 * while no re-check is outstanding. Once a re-check is raised, the figure moves only through
 * re-determine, so that the change is recorded as a determination rather than as an edit.
 */
export function canEditTotal(
  collateral: CollateralResponse,
  role: UserRole | undefined
): boolean {
  return role === FRONT_OFFICE_ROLE && collateral.recheck_state === "clear"
}

/** Amounts are money: two decimals at most, never negative. */
const TOTAL_PATTERN = /^\d+(\.\d{1,2})?$/

export function isValidCollateralTotal(input: string): boolean {
  return TOTAL_PATTERN.test(input.trim())
}

/**
 * Which single act the screen should ask for next, so the panel renders one instruction rather than
 * three competing buttons. `null` means nothing is outstanding.
 */
export type CollateralNextAct = "redetermine" | "confirm" | null

export function nextAct(collateral: CollateralResponse): CollateralNextAct {
  switch (collateral.recheck_state) {
    case "needs_recheck":
      return "redetermine"
    case "redetermined":
      return "confirm"
    case "clear":
      return null
  }
}

/** The most recent figure in the trail, or null when the collateral has never carried one. */
export function latestValue(
  collateral: CollateralResponse
): CollateralResponse["value_history"][number] | null {
  return collateral.value_history.at(-1) ?? null
}
