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
