/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * A bulk-import batch, shaped to the design's own example (`BULK.pdf`): 15 rows, 8 valid, 4 failed,
 * 3 possible duplicates, so the modal's tiles and its "Continue with 11" button are reachable with
 * the exact figures the frame shows.
 *
 * The four failure reasons are the frame's, verbatim, because they are the only record of what the
 * backend's rejection messages look like:
 *   - "Term is missing, mandatory field"          (a missing mandatory field)
 *   - "Matches CT-1000, already in an open case"  (a duplicate — held, not failed)
 *   - "Object category not allowed by product template"
 *   - "Net acquisition cost exceeds template maximum"
 *
 * `status` is an unconstrained string on the wire, so the values here are the plainest reading of
 * the design's badges — `valid` / `failed` / `held`. If the real backend uses other words the UI
 * still renders them, because the label lookup falls back to the raw value.
 */
import type {
  CaseContract,
  ImportBatchPreviewResponse,
  ImportBatchResponse,
  ImportRowItem,
} from "@/features/cases/api/schema"

// Imported contracts are spread across three lessees so the summary's derived lessee count is a
// real number rather than 1-per-file or equal to the contract count.
const LESSEE_PARTNER_IDS = [
  "00000000-0000-4000-8000-00000000a101",
  "00000000-0000-4000-8000-00000000a102",
  "00000000-0000-4000-8000-00000000a103",
]

const VALID_ROWS = 8
const FAILED_ROWS = 4
const HELD_ROWS = 3

let batchCounter = 0

function hex(n: number): string {
  return n.toString(16).padStart(2, "0")
}

function validRow(rowNumber: number): ImportRowItem {
  return {
    row_number: rowNumber,
    status: "valid",
    rejection_kind: null,
    error_field: null,
    error_message: null,
    raw_data: { contract_number: `PL-2025-0030${rowNumber}` },
    contract_id: null,
  }
}

const FAILURES: { field: string | null; message: string }[] = [
  { field: "term_months", message: "Term is missing, mandatory field" },
  {
    field: "object_group",
    message: "Object category not allowed by product template",
  },
  {
    field: "acquisition_cost",
    message: "Net acquisition cost exceeds template maximum",
  },
  { field: null, message: "Contract start date could not be read" },
]

function failedRow(rowNumber: number, index: number): ImportRowItem {
  const failure = FAILURES[index % FAILURES.length]
  return {
    row_number: rowNumber,
    status: "failed",
    rejection_kind: "validation",
    error_field: failure.field,
    error_message: failure.message,
    raw_data: { contract_number: `PL-2025-0031${index}` },
    contract_id: null,
  }
}

function heldRow(rowNumber: number, index: number): ImportRowItem {
  return {
    row_number: rowNumber,
    status: "held",
    rejection_kind: "duplicate",
    error_field: null,
    error_message: `Matches CT-100${index}, already in an open case`,
    raw_data: { contract_number: `PL-2025-0032${index}` },
    contract_id: null,
  }
}

export function makeImportBatch(caseId: string): ImportBatchPreviewResponse {
  batchCounter += 1
  const rows: ImportRowItem[] = []
  let rowNumber = 0

  for (let i = 0; i < VALID_ROWS; i += 1) rows.push(validRow(++rowNumber))
  for (let i = 0; i < FAILED_ROWS; i += 1) rows.push(failedRow(++rowNumber, i))
  for (let i = 0; i < HELD_ROWS; i += 1) rows.push(heldRow(++rowNumber, i))

  return {
    batch_id: `00000000-0000-4000-8000-0000000b${hex(batchCounter)}01`,
    case_id: caseId,
    file_name: "contracts-2026-09.csv",
    status: "assessed",
    rows,
    rows_committed: 0,
    rows_valid: VALID_ROWS,
    rows_failed: FAILED_ROWS,
    rows_held: HELD_ROWS,
    precondition_error: null,
  }
}

// The upload's own answer is narrower than the preview — counts but no rows.
export function toBatchResponse(
  batch: ImportBatchPreviewResponse
): ImportBatchResponse {
  return {
    batch_id: batch.batch_id,
    case_id: batch.case_id,
    file_name: batch.file_name,
    status: batch.status,
    rows_held: batch.rows_held,
    rows_valid: batch.rows_valid,
    rows_failed: batch.rows_failed,
    precondition_error: batch.precondition_error,
    created_at: "2026-09-07T09:00:00Z",
  }
}

/**
 * The contracts a commit produces.
 *
 * Deliberately thin: an imported contract arrives with only what the file carried, so most terms
 * are null until someone completes them. A fixture where every imported row came out fully
 * populated would hide that, and step 2's list would look more finished than an import really is.
 */
export function importedContracts(count: number): CaseContract[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: `00000000-0000-4000-8000-0000000c${hex(index + 1)}01`,
    leasing_company_contract_number: `PL-2025-0030${index + 1}`,
    lessee_partner_id: LESSEE_PARTNER_IDS[index % LESSEE_PARTNER_IDS.length],
    short_name: null,
    contract_type: "lease",
    amortisation_type: "partial",
    term_months: index % 3 === 0 ? null : 48,
    net_instalment: index % 3 === 0 ? null : "1250.00",
    residual_value: null,
    contract_residual: null,
    target_closing_balance: null,
    deviating_first_due_date: null,
    contract_start: index % 3 === 0 ? null : "2025-09-01",
    deferred_state: "active",
  }))
}
