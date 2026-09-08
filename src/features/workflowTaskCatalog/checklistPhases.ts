import { ChecklistItemStatusSchema } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { ChecklistItemResponse } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { UserRole } from "@/features/users/types"
import type { CaseProgressResponse } from "@/features/cases/api/schema"

/**
 * Grouping the case checklist into the design's five phase sections — the Details-page Checklist
 * tab, which shows `A · Application & credit review` with `2 open · 3 yours` and numbered tasks
 * underneath, not one flat table.
 *
 * ── WHERE THE PHASE COMES FROM, AND WHY IT IS NOT `stage_categorization` ───────────────────────
 * An item carries **two** independent classifications and it is easy to reach for the wrong one:
 *
 * - `stage_categorization` is a six-value axis — `Pre-Submission`, `Stage 1 review`, `Stage 2
 *   review` and so on. It describes *when in the review* a task sits.
 * - The design's phases are the five the case's own progress reports: Application & credit review,
 *   Settlement documents, Data entry & loan setup, Approval & disbursement, Post-processing &
 *   archive. Those are a different axis, and no field on the item names them.
 *
 * What links the two is the **task code prefix**: codes run `A-01 … A-04`, `B-01 … B-08`, and so
 * on. The per-phase totals the progress endpoint reports corroborate it exactly — A carries 4
 * tasks, B 8, C 11, D 9, E 12, which is the 44 the band adds up to. So the prefix is read as the
 * phase letter, and the phase's *name* comes from the progress response, which is the same source
 * the progress band already uses.
 *
 * An item whose code carries no recognisable prefix is **not dropped** — it lands in an
 * unclassified group, because a task that exists but cannot be placed still has to be workable.
 */

const PHASE_CODE_PATTERN = /^([A-Z])-/

/** The phase letter a task code implies, or null when the code does not carry one. */
export function phaseLetterFromTaskCode(
  taskCode: string | null | undefined
): string | null {
  if (taskCode === null || taskCode === undefined) return null
  const match = PHASE_CODE_PATTERN.exec(taskCode.trim().toUpperCase())
  return match === null ? null : match[1]
}

export type ChecklistPhaseGroup = {
  /** `A`–`E`, or null for the unclassified group. */
  letter: string | null
  /** The phase's name from the case progress, when it reports one. */
  name: string | null
  items: ChecklistItemResponse[]
  openCount: number
  /** Open items this user's role is responsible for — the design's "N yours". */
  yoursCount: number
}

function isOpen(item: ChecklistItemResponse): boolean {
  return item.status === ChecklistItemStatusSchema.enum.open
}

/**
 * The catalogue's own role vocabulary is not quite the platform's.
 *
 * `responsible_role` comes from `TaskResponsibleRole` — `front_office`, `back_office_risk`,
 * `compliance`, `legal`, `treasury`, `support`, `system` — while a signed-in user carries a
 * `UserRole`. The one pair that differs by name and means the same thing is
 * **`back_office_risk` = `back_office`**, which US 1.15's permission matrix states outright
 * ("Back Office / Risk is back_office"). Without this the tasks a back-office user owns would
 * never count as theirs, and the design's "N yours" would read 0 on every phase for that role.
 *
 * The rest of the catalogue's roles have no platform counterpart, so they match nobody — correctly.
 */
const CATALOGUE_ROLE_ALIASES: Record<string, UserRole> = {
  back_office_risk: "back_office",
}

function normaliseRole(value: string): string {
  return CATALOGUE_ROLE_ALIASES[value] ?? value
}

/** Every role a task names, whichever of the two fields carries them. */
export function responsibleRolesOf(item: ChecklistItemResponse): string[] {
  const roles = item.responsible_roles
  if (roles !== null && roles !== undefined && roles.length > 0) {
    return [...roles]
  }
  const single = item.responsible_role
  return single !== null && single !== undefined ? [single] : []
}

/**
 * Whether an open task belongs to this user.
 *
 * A task with **no** responsible role named is nobody's in particular, so it is not counted as
 * yours — inflating that number would make the screen claim work is assigned to you when nothing
 * says so.
 */
export function isOwnedByRole(
  item: ChecklistItemResponse,
  role: UserRole | undefined
): boolean {
  if (role === undefined) return false
  return responsibleRolesOf(item).some(named => normaliseRole(named) === role)
}

/**
 * Build the phase sections in the order the progress response reports them, followed by any phase
 * the items mention that progress does not, and finally the unclassified group.
 *
 * The order is taken from progress rather than from the items so the sections line up with the band
 * above them; sorting by letter would coincidentally agree today and diverge the moment a phase is
 * renamed or reordered.
 */
export function groupChecklistByPhase(
  items: ChecklistItemResponse[],
  progress: CaseProgressResponse | undefined,
  role: UserRole | undefined
): ChecklistPhaseGroup[] {
  const byLetter = new Map<string | null, ChecklistItemResponse[]>()
  for (const item of items) {
    const letter = phaseLetterFromTaskCode(item.task_code)
    const bucket = byLetter.get(letter)
    if (bucket === undefined) byLetter.set(letter, [item])
    else bucket.push(item)
  }

  const ordered: ChecklistPhaseGroup[] = []
  const claimed = new Set<string>()

  for (const [index, phase] of (progress?.phases ?? []).entries()) {
    const letter = letterForPhase(phase, index)
    if (letter === null) continue
    claimed.add(letter)
    const phaseItems = byLetter.get(letter) ?? []
    // A phase the progress reports but which carries no task is not rendered: an empty section
    // reads as "nothing to do here" when the truth is that the checklist has no such task at all.
    if (phaseItems.length === 0) continue
    ordered.push(toGroup(letter, phase.phase_name ?? null, phaseItems, role))
  }

  const leftovers = [...byLetter.keys()]
    .filter(
      (letter): letter is string => letter !== null && !claimed.has(letter)
    )
    .sort()
  for (const letter of leftovers) {
    ordered.push(toGroup(letter, null, byLetter.get(letter) ?? [], role))
  }

  const unclassified = byLetter.get(null)
  if (unclassified !== undefined && unclassified.length > 0) {
    ordered.push(toGroup(null, null, unclassified, role))
  }

  return ordered
}

function letterForPhase(
  phase: CaseProgressResponse["phases"][number],
  index: number
): string | null {
  const position = phase.position
  const ordinal =
    position !== null && position !== undefined && position > 0
      ? position - 1
      : index
  return String.fromCharCode("A".charCodeAt(0) + ordinal)
}

function toGroup(
  letter: string | null,
  name: string | null,
  items: ChecklistItemResponse[],
  role: UserRole | undefined
): ChecklistPhaseGroup {
  // Ordered by display_order where the wire gives one, so the numbering a user reads runs 1, 2, 3
  // down the section. Items without one keep their arrival order behind those that have one.
  const sorted = [...items].sort((a, b) => {
    const left = a.display_order ?? Number.MAX_SAFE_INTEGER
    const right = b.display_order ?? Number.MAX_SAFE_INTEGER
    return left - right
  })
  const open = sorted.filter(isOpen)
  return {
    letter,
    name,
    items: sorted,
    openCount: open.length,
    yoursCount: open.filter(item => isOwnedByRole(item, role)).length,
  }
}

/** `A · Application & credit review`, degrading to whichever half is known. */
export function phaseHeading(group: ChecklistPhaseGroup): string | null {
  if (group.letter !== null && group.name !== null) {
    return `${group.letter} · ${group.name}`
  }
  return group.letter ?? group.name
}

/**
 * The number shown beside a task.
 *
 * `display_order` is preferred because it is what the catalogue intends; the position within the
 * section is the fallback so a section is never numbered with blanks.
 */
export function taskNumber(
  item: ChecklistItemResponse,
  indexInGroup: number
): number {
  return item.display_order ?? indexInGroup + 1
}
