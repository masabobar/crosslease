/**
 * Row selection for the wizard's contract list (US 1.12).
 *
 * Pure so the header checkbox's three states and the "removable" rule are testable without a table.
 */

/** What the header checkbox shows. `mixed` is the shadcn/BaseUI indeterminate value. */
export type HeaderCheckState = boolean | "mixed"

export function headerCheckState(
  selected: ReadonlySet<string>,
  allIds: readonly string[]
): HeaderCheckState {
  if (allIds.length === 0) return false
  const chosen = allIds.filter(id => selected.has(id)).length
  if (chosen === 0) return false
  if (chosen === allIds.length) return true
  return "mixed"
}

/** Select-all toggles to the *opposite of full* — partial means "select the rest", not "clear". */
export function toggleAll(
  selected: ReadonlySet<string>,
  allIds: readonly string[]
): Set<string> {
  return headerCheckState(selected, allIds) === true
    ? new Set()
    : new Set(allIds)
}

export function toggleOne(
  selected: ReadonlySet<string>,
  id: string
): Set<string> {
  const next = new Set(selected)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

/** Ids still present in the list — a selection must not outlive the rows it referred to. */
export function pruneSelection(
  selected: ReadonlySet<string>,
  allIds: readonly string[]
): Set<string> {
  const present = new Set(allIds)
  return new Set([...selected].filter(id => present.has(id)))
}

/**
 * Whether a removal may be submitted.
 *
 * Something selected **and a reason given**. `BulkRemoveRequest.reason` is required by the
 * contract, and rightly: the case is evidence, so a contract that was in the request and then was
 * not has to say why. A blank reason is refused here rather than sent for the backend to reject.
 */
export function canRemove(
  selected: ReadonlySet<string>,
  reason: string
): boolean {
  return selected.size > 0 && reason.trim().length > 0
}
