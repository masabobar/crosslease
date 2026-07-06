import type { UboCompletenessStatus } from "@/features/partners/api/schema"

// Single source of truth for the UBO completeness status dot color — shared
// between the partner list table and the partner detail overview tab so the
// same status always renders the same color.
export const UBO_STATUS_DOT_COLOR: Record<UboCompletenessStatus, string> = {
  complete: "bg-success",
  partial: "bg-warning",
  missing: "bg-muted-foreground",
}
