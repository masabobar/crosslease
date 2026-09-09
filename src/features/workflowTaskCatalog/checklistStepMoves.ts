/**
 * What resolving a checklist step moves — the click dummy's blue pill on a step row.
 *
 * Seven of the 41 steps do more than record that work happened: they advance the request, the
 * financing or the case, or they freeze something. The dummy draws that as a pill on the row
 * (`↗ Commits the request and creates the financing`) with the consequence in its tooltip, and
 * it is the one thing on that screen a reader cannot infer from the step's own wording — "Bank
 * settlement and repayment schedule created and saved" does not say that the contract set becomes
 * read-only at that moment.
 *
 * ── WHY THIS IS KEYED BY TASK CODE AND NOT BY A STEP NUMBER ────────────────────────────────────
 * The dummy keys these off the client sheet's step number (4, 11, 15, 18, 28, 38, 44). That number
 * is **not on the wire** — a `ChecklistItemResponse` carries `task_code` and `display_order`, and
 * `display_order` is a position in the list, so it would shift the moment a task were added or made
 * inapplicable. The catalogue's `task_code` is the stable identifier, so the map is keyed by it.
 *
 * The codes below are this client's catalogue, read off the same rows the sheet numbers point at.
 * A code that is not in the map simply gets **no pill** — the map is a set of annotations, not a
 * claim about which codes may exist, and a tenant with a differently-coded catalogue loses the
 * annotation rather than gaining a wrong one.
 *
 * ── AND WHY IT IS ONLY A LABEL ─────────────────────────────────────────────────────────────────
 * Nothing here drives behaviour. The transitions themselves are configured per task on the backend
 * (Q-004) and executed by `set_item_status`; this module only tells the reader what a step is about
 * to do. Deriving a client-side legality rule from it would be exactly the matrix
 * `caseTransitions.ts` deliberately refuses to build.
 */

export const STEP_MOVE_KEYS = [
  "commitsRequest",
  "putsOnHold",
  "freezesInputs",
  "closesWayBack",
  "releasesDisbursement",
  "startsMoveToActive",
  "completesAndArchives",
] as const

export type StepMoveKey = (typeof STEP_MOVE_KEYS)[number]

/** Task code → the move it makes. Sheet step numbers are in the comments for traceability. */
const MOVE_BY_TASK_CODE: Record<string, StepMoveKey> = {
  "A-3": "commitsRequest", // sheet 4  — the financing is created here, at Calculating
  "B-7": "putsOnHold", // sheet 11 — the case waits on an external delivery
  "C-1": "freezesInputs", // sheet 15 — contract set and calculation inputs become read-only
  "C-4": "closesWayBack", // sheet 18 — settlement and schedule freeze; no rollback
  "D-5": "releasesDisbursement", // sheet 28 — the four-eyes release, all contracts in one action
  "E-6": "startsMoveToActive", // sheet 38 — completes at archiving, so nothing moves yet
  "E-12": "completesAndArchives", // sheet 44 — three moves at once
}

export function stepMoveFor(
  taskCode: string | null | undefined
): StepMoveKey | null {
  if (taskCode === null || taskCode === undefined) return null
  return MOVE_BY_TASK_CODE[taskCode.trim().toUpperCase()] ?? null
}

/**
 * The steps that freeze something, which the dummy marks with a second, separate `🔒 freezes` tag.
 *
 * It is deliberately not folded into the move above: freezing and advancing are different
 * consequences, and step 15 does both.
 */
const FREEZING_TASK_CODES = new Set(["C-1", "C-4"])

export function isFreezingStep(taskCode: string | null | undefined): boolean {
  if (taskCode === null || taskCode === undefined) return false
  return FREEZING_TASK_CODES.has(taskCode.trim().toUpperCase())
}
