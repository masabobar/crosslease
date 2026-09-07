import type {
  ImportBatchPreviewResponse,
  ImportRowItem,
} from "@/features/cases/api/schema"

/**
 * Read model for the bulk-import preview modal (US 1.5).
 *
 * Kept pure so the arithmetic and the bucketing are unit-testable without a file upload — the
 * numbers on this screen decide how many contracts enter the case, so they are worth asserting.
 */

/** The design's four headline tiles. */
export interface ImportTotals {
  /**
   * Total rows assessed. **Derived**: the wire carries no total, so this is
   * `valid + failed + held` — which the design's own figures confirm (8 + 4 + 3 = 15).
   */
  total: number
  valid: number
  failed: number
  /** The design's "Possible Duplicates" — `rows_held` on the wire. */
  held: number
}

export function importTotals(batch: ImportBatchPreviewResponse): ImportTotals {
  return {
    total: batch.rows_valid + batch.rows_failed + batch.rows_held,
    valid: batch.rows_valid,
    failed: batch.rows_failed,
    held: batch.rows_held,
  }
}

/**
 * How many contracts the commit will create.
 *
 * Valid **plus held**, not valid alone. The design's button reads "Continue with 11 valid
 * contracts" against 8 valid and 3 duplicates, so a held row is committed — only failures are
 * dropped. Labelling it "valid" is the design's wording, not the wire's meaning.
 */
export function committableRowCount(batch: ImportBatchPreviewResponse): number {
  return batch.rows_valid + batch.rows_held
}

/**
 * Whether the batch may be committed at all.
 *
 * A precondition error means no row was assessed, so there is nothing to commit however the counts
 * read. An already-committed batch is not committed twice.
 */
export function canCommitImport(batch: ImportBatchPreviewResponse): boolean {
  if (batch.precondition_error !== null) return false
  if (batch.rows_committed > 0) return false
  return committableRowCount(batch) > 0
}

/**
 * The filter tabs: "all", then one per distinct row status present, in first-seen order.
 *
 * Derived from the data rather than hard-coded to the design's Valid / Error / Duplicate, because
 * `ImportRowItem.status` is an **unconstrained string** on the wire — no enum declares the set. A
 * fixed tab list would silently hide any status the backend adds; deriving means an unexpected
 * value gets its own tab with its raw name rather than vanishing.
 */
export const ALL_ROWS_FILTER = "all"

export interface ImportRowFilter {
  key: string
  count: number
}

export function importRowFilters(
  rows: readonly ImportRowItem[]
): ImportRowFilter[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1)
  }

  return [
    { key: ALL_ROWS_FILTER, count: rows.length },
    ...[...counts.entries()].map(([key, count]) => ({ key, count })),
  ]
}

export function filterImportRows(
  rows: readonly ImportRowItem[],
  filterKey: string
): ImportRowItem[] {
  if (filterKey === ALL_ROWS_FILTER) return [...rows]
  return rows.filter(row => row.status === filterKey)
}

/**
 * The reason cell.
 *
 * `error_message` is the only typed, human-readable explanation on the row. `error_field` is
 * prepended when present so a validation failure names the column it came from, which is what makes
 * the row fixable in the source spreadsheet — the design's reasons read like
 * "Term is missing, mandatory field".
 */
export function importRowReason(row: ImportRowItem): string | null {
  if (row.error_message === null) return null
  return row.error_field === null
    ? row.error_message
    : `${row.error_field}: ${row.error_message}`
}
