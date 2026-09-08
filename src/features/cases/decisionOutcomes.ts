/**
 * The four outcomes of the step-4 decision (US 1.29).
 *
 * ── FOUR, CONFIRMED TWICE ──────────────────────────────────────────────────────────────────────
 * The client confirmed these on 2026-09-08 (Q-007), and the wire agrees: `StateTransitionOutcome`
 * is exactly `committed | rejected | missing_information | rework`. The Figma frame's two-button
 * Approve/Reject modal is wrong on both counts, and the spec's AC-04 forbids collapsing
 * *missing information* into *rework* — they are different asks of different people.
 *
 * ── THE ENDPOINT'S TYPE IS WIDER THAN THE LEGAL SET ────────────────────────────────────────────
 * `DecideRequestRequest.outcome` is typed **`RequestStatus`**, which carries six values — the four
 * above plus `draft` and `submitted`. Those two are *states a request passes through*, not
 * decisions someone can take: deciding "draft" is not a verdict. `StateTransitionOutcome` exists in
 * the registry and is the right type for this field, but the endpoint does not use it — so the
 * narrowing lives here, and the mismatch is recorded rather than silently relied upon.
 */
export const DECISION_OUTCOMES = [
  "committed",
  "rejected",
  "missing_information",
  "rework",
] as const

export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number]

/**
 * Whether an outcome needs a reason before it may be submitted.
 *
 * Every outcome except `committed`. A refusal, a request for information and a rework instruction
 * all send the case back to somebody who has to know what to do next — an unexplained one is a
 * dead end. Approval needs no explanation: the case itself is the record of what was approved.
 */
export function requiresReason(outcome: DecisionOutcome): boolean {
  return outcome !== "committed"
}

export function canSubmitDecision(
  outcome: DecisionOutcome | null,
  reason: string
): boolean {
  if (outcome === null) return false
  return !requiresReason(outcome) || reason.trim().length > 0
}

/** Approve reads as constructive, the three that send it back do not. */
export function outcomeVariant(
  outcome: DecisionOutcome
): "default" | "destructive" | "secondary" {
  if (outcome === "committed") return "default"
  if (outcome === "rejected") return "destructive"
  return "secondary"
}
