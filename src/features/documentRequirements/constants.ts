// UI-only labels and filter-state shape for the Document Requirement Catalog. Wire enums that the
// backend actually constrains live in api/schema.ts per .claude/rules/enums-and-constants.md §3.

import { DocumentRequirementCatalogTypeSchema } from "@/features/documentRequirements/api/schema"
import type { DocumentRequirementCatalogType } from "@/features/documentRequirements/api/schema"

export const CATALOG_TYPE_OPTIONS = [
  {
    value: DocumentRequirementCatalogTypeSchema.enum.global_default,
    labelKey: "catalogTypes.global_default",
  },
  {
    value: DocumentRequirementCatalogTypeSchema.enum.product_specific,
    labelKey: "catalogTypes.product_specific",
  },
] as const

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

// Both filters are single-value on the wire (GET .../document-requirement-catalogs takes one
// `catalog_type` and one `process_context` param each — the latter matched via an
// array-contains check). Process Context's field spec asks for multi-select; see
// open-questions.md for that gap.
export type DocumentRequirementCatalogFilterState = {
  catalogType: DocumentRequirementCatalogType | null
  processContext: string | null
}
