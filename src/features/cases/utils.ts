// Phase letters, A-first. Eight is well past the A–E model's five phases (design-extract §2) and
// leaves room for a sixth the backend might add without falling straight through to the fallback.
const PHASE_LETTERS = "ABCDEFGH"

/**
 * The letter a phase is shown as — "Phase A", the ringed `A` node in the progress band.
 *
 * Extracted because two surfaces derive it: the progress band on the case workspace and the Phase
 * column of the Cases list. They **must** agree — a case reading "Phase D" in the list and
 * "Phase C" in the band is a defect the reader cannot resolve — and before this they were two
 * copies with different edge behaviour.
 *
 * `position` is 1-based on the wire and nullable. `fallbackIndex` covers the band's case, where the
 * phase's ordinal in the returned array is a better answer than nothing; callers with no meaningful
 * index (a list row, where there is no array) pass none and get `null` for an unknown position, so
 * they can render an em-dash rather than a wrong letter.
 *
 * Beyond the letters the ordinal itself is returned as a string — a ninth phase reads "9", which is
 * wrong-looking enough to notice and still unique, unlike a repeated "H".
 */
export function phaseLetter(
  position: number | null | undefined,
  fallbackIndex?: number
): string | null {
  const hasPosition =
    position !== null && position !== undefined && position > 0
  if (!hasPosition && fallbackIndex === undefined) return null

  const ordinal = hasPosition ? position - 1 : fallbackIndex!
  return PHASE_LETTERS[ordinal] ?? String(ordinal + 1)
}

/**
 * How near a quoted refinancing rate is to running out, as a tone class.
 *
 * The final dummy colours this one cell and no other on the list, and rightly: a rate quote that
 * has expired is the single thing that makes a case urgent rather than merely open. Past due is
 * destructive, within three days is a warning, anything further off is unremarkable and gets the
 * ordinary muted treatment.
 */
export function rateDueTone(dueDate: string): string {
  const days = daysUntilDate(dueDate)
  if (days === null) return "text-muted-foreground"
  if (days < 0) return "text-destructive"
  if (days <= 3) return "text-warning"
  return "text-muted-foreground"
}

/** Whole days from today to a date, or null when it cannot be read. */
export function daysUntilDate(dueDate: string): number | null {
  const due = new Date(`${dueDate}T00:00:00`)
  if (Number.isNaN(due.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}
