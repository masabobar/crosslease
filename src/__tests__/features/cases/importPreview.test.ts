import { describe, expect, it } from "vitest"
import {
  ALL_ROWS_FILTER,
  canCommitImport,
  committableRowCount,
  filterImportRows,
  importRowFilters,
  importRowReason,
  importTotals,
} from "@/features/cases/importPreview"
import type {
  ImportBatchPreviewResponse,
  ImportRowItem,
} from "@/features/cases/api/schema"

function row(overrides: Partial<ImportRowItem> = {}): ImportRowItem {
  return {
    row_number: 1,
    status: "valid",
    rejection_kind: null,
    error_field: null,
    error_message: null,
    raw_data: {},
    contract_id: null,
    ...overrides,
  }
}

// The design's own figures: 15 total, 8 valid, 4 failed, 3 duplicates, "Continue with 11".
function batch(
  overrides: Partial<ImportBatchPreviewResponse> = {}
): ImportBatchPreviewResponse {
  return {
    batch_id: "00000000-0000-4000-8000-0000000000b1",
    case_id: "00000000-0000-4000-8000-0000000000c1",
    file_name: "contracts.csv",
    status: "assessed",
    rows: [],
    rows_committed: 0,
    rows_valid: 8,
    rows_failed: 4,
    rows_held: 3,
    precondition_error: null,
    ...overrides,
  }
}

describe("importTotals", () => {
  // There is no total on the wire; it is valid + failed + held. The design's tiles confirm the
  // arithmetic, which is why they are asserted against its exact numbers.
  it("derives the total the design shows from the three counts", () => {
    expect(importTotals(batch())).toEqual({
      total: 15,
      valid: 8,
      failed: 4,
      held: 3,
    })
  })

  it("totals zero for an empty file", () => {
    expect(
      importTotals(batch({ rows_valid: 0, rows_failed: 0, rows_held: 0 })).total
    ).toBe(0)
  })
})

describe("committableRowCount", () => {
  // 8 valid + 3 held = 11, which is exactly what the design's button reads. Held rows ARE
  // committed; only failures are dropped. Getting this wrong would silently drop duplicates.
  it("counts valid plus held, matching the design's button", () => {
    expect(committableRowCount(batch())).toBe(11)
  })

  it("counts valid alone when nothing is held", () => {
    expect(committableRowCount(batch({ rows_held: 0 }))).toBe(8)
  })
})

describe("canCommitImport", () => {
  it("allows a commit when there is something to commit", () => {
    expect(canCommitImport(batch())).toBe(true)
  })

  // A precondition error means no row was assessed at all, so the counts are not a basis for
  // committing however they read.
  it("refuses when the whole file was rejected", () => {
    expect(
      canCommitImport(
        batch({ precondition_error: "No product template is bound." })
      )
    ).toBe(false)
  })

  it("refuses a batch that has already been committed", () => {
    expect(canCommitImport(batch({ rows_committed: 11 }))).toBe(false)
  })

  it("refuses when every row failed", () => {
    expect(
      canCommitImport(batch({ rows_valid: 0, rows_held: 0, rows_failed: 4 }))
    ).toBe(false)
  })
})

describe("importRowFilters", () => {
  it("always leads with an all-rows filter carrying the full count", () => {
    const filters = importRowFilters([row(), row({ row_number: 2 })])
    expect(filters[0]).toEqual({ key: ALL_ROWS_FILTER, count: 2 })
  })

  // Derived from the data, not hard-coded to the design's three tabs, because `status` is an
  // unconstrained string — a value the backend adds must get a tab rather than vanish.
  it("derives one filter per distinct status, in first-seen order", () => {
    const filters = importRowFilters([
      row({ row_number: 1, status: "failed" }),
      row({ row_number: 2, status: "valid" }),
      row({ row_number: 3, status: "failed" }),
      row({ row_number: 4, status: "something_new" }),
    ])

    expect(filters).toEqual([
      { key: ALL_ROWS_FILTER, count: 4 },
      { key: "failed", count: 2 },
      { key: "valid", count: 1 },
      { key: "something_new", count: 1 },
    ])
  })

  it("gives an empty file just the all filter, at zero", () => {
    expect(importRowFilters([])).toEqual([{ key: ALL_ROWS_FILTER, count: 0 }])
  })
})

describe("filterImportRows", () => {
  const rows = [
    row({ row_number: 1, status: "valid" }),
    row({ row_number: 2, status: "failed" }),
    row({ row_number: 3, status: "held" }),
  ]

  it("returns every row for the all filter", () => {
    expect(filterImportRows(rows, ALL_ROWS_FILTER)).toHaveLength(3)
  })

  it("returns only the matching status", () => {
    expect(filterImportRows(rows, "failed").map(r => r.row_number)).toEqual([2])
  })

  it("returns nothing for a status no row carries", () => {
    expect(filterImportRows(rows, "committed")).toEqual([])
  })

  it("does not hand back the original array", () => {
    expect(filterImportRows(rows, ALL_ROWS_FILTER)).not.toBe(rows)
  })
})

describe("importRowReason", () => {
  it("is null for a row with nothing wrong", () => {
    expect(importRowReason(row())).toBeNull()
  })

  it("names the offending column when the wire supplies one", () => {
    expect(
      importRowReason(
        row({ error_field: "term_months", error_message: "Term is missing" })
      )
    ).toBe("term_months: Term is missing")
  })

  // A duplicate's reason has no single offending field ("Matches CT-1000, already in an open
  // case"), so the message stands alone rather than being prefixed with a blank.
  it("returns the message alone when no field is named", () => {
    expect(
      importRowReason(
        row({ error_message: "Matches CT-1000, already in an open case" })
      )
    ).toBe("Matches CT-1000, already in an open case")
  })
})
