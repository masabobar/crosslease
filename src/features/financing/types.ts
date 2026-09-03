import type {
  ApprovalConditionState,
  FinancingStatus,
} from "@/features/financing/api/schema"

type BadgeVariant = "default" | "secondary" | "outline" | "destructive"

/**
 * Unlike the case's `display_status`, financing status is a closed enum in the contract, so this is
 * an exhaustive `Record` rather than a lookup with a fallback: if the backend adds a seventh state,
 * the Zod enum rejects it and this map fails to compile — both of which are better than a badge
 * silently rendering with an undefined variant.
 *
 * The design's badge reads "● Live", which is not one of these six (design-extract §7). `active` is
 * the state it corresponds to; the label comes from i18n, so no new wire value is invented here.
 */
export const FINANCING_STATUS_BADGE_VARIANT: Record<
  FinancingStatus,
  BadgeVariant
> = {
  // Figures are still being computed — nothing on screen is final yet.
  calculating: "secondary",
  ready_for_setup: "secondary",
  disbursed: "default",
  active: "default",
  // Ended is a neutral terminal (the financing ran its course); cancelled is a negative one.
  ended: "outline",
  cancelled: "destructive",
}

export function financingStatusBadgeVariant(
  status: FinancingStatus
): BadgeVariant {
  return FINANCING_STATUS_BADGE_VARIANT[status]
}

/**
 * A covenant that is `open` or `expired` still needs someone to act; `met` and `waived` are settled.
 * `expired` is destructive rather than merely secondary because a lapsed condition is a breach, not
 * a pending task.
 */
export const COVENANT_STATE_BADGE_VARIANT: Record<
  ApprovalConditionState,
  BadgeVariant
> = {
  open: "secondary",
  met: "default",
  waived: "outline",
  expired: "destructive",
}

export function covenantStateBadgeVariant(
  state: ApprovalConditionState
): BadgeVariant {
  return COVENANT_STATE_BADGE_VARIANT[state]
}
