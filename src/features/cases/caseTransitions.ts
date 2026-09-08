import { CaseStatusSchema } from "@/features/cases/api/schema"
import { caseDisplayStatusSlug } from "@/features/cases/types"

/**
 * The case's lifecycle transitions (US 1.30) and its three-status model (US 1.31).
 *
 * ── LEGALITY IS THE BACKEND'S, NOT THIS MODULE'S ───────────────────────────────────────────────
 * Q-004 was answered on 2026-09-08: *"Gate / transition logic is defined at step / task level.
 * Statuses live on the respective entities, while transitions are configured on the task."*
 *
 * So there is **no client-side legality matrix here, deliberately**. Reproducing one would be
 * inventing a rule the backend configures per task, and it would go stale the first time the
 * configuration changed. What this module does instead is hide the transitions that are
 * *structurally* impossible — a closed case cannot be resubmitted, whatever any task says — and
 * let the backend refuse the rest with a 409 the UI surfaces.
 *
 * ── THE THREE STATUSES ─────────────────────────────────────────────────────────────────────────
 * `case_status` (4 values) is the case's own state. `display_status` is the **derived** value,
 * covering all three sets, and is what a user reads. The request's and the financing's own statuses
 * are not separate fields on `CaseResponse` — the derivation folds them in, which is why filtering
 * and sorting must run on the stored sets and never on this value (US 1.1's acceptance criteria).
 */

export const CASE_TRANSITIONS = [
  "resubmit",
  "return_to_queue",
  "reactivate",
  "cancel",
] as const

export type CaseTransition = (typeof CASE_TRANSITIONS)[number]

/**
 * Display statuses that mean the case is finished.
 *
 * Structural, not configured: a committed, rejected, cancelled or done case has nothing left to
 * resubmit or return. `reactivate` is the exception — it exists precisely to bring one of these
 * back, so it is offered *only* here.
 */
const TERMINAL_SLUGS = new Set(["committed", "rejected", "cancelled", "done"])

export function isTerminalDisplayStatus(displayStatus: string): boolean {
  return TERMINAL_SLUGS.has(caseDisplayStatusSlug(displayStatus))
}

/**
 * Which transitions to offer.
 *
 * A short list of structural impossibilities, not a legality matrix — see the note above. Anything
 * offered here may still be refused by the backend, and the caller surfaces that refusal.
 */
export function offeredTransitions(displayStatus: string): CaseTransition[] {
  if (isTerminalDisplayStatus(displayStatus)) return ["reactivate"]

  const slug = caseDisplayStatusSlug(displayStatus)
  const transitions: CaseTransition[] = ["return_to_queue", "cancel"]

  // Resubmission only makes sense on a case that was sent back — that is what it undoes.
  if (slug === "rework" || slug === "missing_information") {
    transitions.unshift("resubmit")
  }

  return transitions
}

/** Cancelling ends the case, so it is the one transition that asks before it acts. */
export function isDestructiveTransition(transition: CaseTransition): boolean {
  return transition === "cancel"
}

/**
 * The case's own four-value status, for display beside the derived one.
 *
 * Exposed as a helper rather than inlined so the distinction stays visible: `case_status` is stored,
 * `display_status` is derived from three sets, and confusing them is what US 1.1 warns against.
 */
export function isKnownCaseStatus(value: string): boolean {
  return CaseStatusSchema.safeParse(value).success
}
