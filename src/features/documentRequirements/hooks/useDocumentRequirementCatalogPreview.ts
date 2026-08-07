import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { MaterializationResponse } from "@/features/documentRequirements/api/schema"
import {
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
  fetchDocumentRequirementCatalogPreview,
} from "@/features/documentRequirements/api/documentRequirementsApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

// US 16.21 — on-demand: the caller controls `enabled` (a "Preview" button trigger), not just a
// process-context selection, so opening the tab does not fire a request on its own.
export function useDocumentRequirementCatalogPreview(
  catalogId: string,
  processContext: string,
  enabled: boolean
): UseQueryResult<MaterializationResponse, Error> {
  return useQuery({
    queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.preview(
      catalogId,
      processContext
    ),
    queryFn: () =>
      fetchDocumentRequirementCatalogPreview(catalogId, processContext),
    enabled: enabled && !!catalogId && !!processContext,
    // Diagnostic and non-persisting, so a stale window costs nothing — matches the rest of the
    // feature's queries and the note on the `preview` query key.
    staleTime: THIRTY_SECONDS_MS,
  })
}
