// UI-only labels and filter-state shape for the Document Requirement Catalog. Wire enums that the
// backend actually constrains live in api/schema.ts per .claude/rules/enums-and-constants.md §3.

// `applicable_process_contexts` is a plain `list[str]` on the backend (catalog_schemas.py,
// requirement_schemas.py) — no enum constrains it there, and the story text itself says
// "(others as governed)". These four are what US 16.1/16.2 name explicitly; offered as curated
// options rather than a closed wire enum, so a value added later still parses.
export const PROCESS_CONTEXT_OPTIONS = [
  {
    value: "refinancing_request",
    labelKey: "processContexts.refinancing_request",
  },
  { value: "lease_contract", labelKey: "processContexts.lease_contract" },
  { value: "financing", labelKey: "processContexts.financing" },
  { value: "disbursement", labelKey: "processContexts.disbursement" },
] as const

// PRD1042-1794 item 6 — case-document uploads accept PDF and Excel (the FA dropzone is PDF-only; a
// case document is often a spreadsheet). The backend is the authority; this is the front-line guard
// so a wrong file is rejected before a round trip. `.xls` and `.xlsx` both appear because browsers
// disagree on the legacy MIME.
export const CASE_DOCUMENT_ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const
// Matches the FA dropzone bound (FA_DOCUMENT_MAX_FILE_SIZE_BYTES).
export const CASE_DOCUMENT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

// Process Context is single-value on the wire (GET .../document-requirement-catalogs takes one
// `process_context` param, matched via an array-contains check). Its field spec asks for
// multi-select; see open-questions.md for that gap. CR-1794 removed the catalog-type filter.
export type DocumentRequirementCatalogFilterState = {
  processContext: string | null
}
