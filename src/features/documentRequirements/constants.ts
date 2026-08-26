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

// Process Context is single-value on the wire (GET .../document-requirement-catalogs takes one
// `process_context` param, matched via an array-contains check). Its field spec asks for
// multi-select; see open-questions.md for that gap. CR-1794 removed the catalog-type filter.
export type DocumentRequirementCatalogFilterState = {
  processContext: string | null
}
