// UI-only labels for the Document Requirement Catalog. Wire enums that the backend actually
// constrains live in api/schema.ts per .claude/rules/enums-and-constants.md §3.

import { CaseTypeSchema } from "@/features/cases/api/schema"

// PRD1042-1794 DRC usability — a requirement declares which CASE TYPES it applies to. The seven
// values are the authoritative CaseType enum (reused from the cases feature via CaseTypeSchema), so
// the picker offers exactly what a case can be, not a free-form list. Labels live under this
// feature's `caseTypes.*` namespace.
export const CASE_TYPE_OPTIONS = CaseTypeSchema.options.map(value => ({
  value,
  labelKey: `caseTypes.${value}` as const,
}))

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
