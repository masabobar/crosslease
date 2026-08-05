import { useQuery } from "@tanstack/react-query"
import {
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
  fetchDocumentRequirementCatalogPreview,
} from "@/features/documentRequirements/api/documentRequirementsApi"

// US 16.21 — on-demand: the caller controls `enabled` (a "Preview" button trigger), not just a
// process-context selection, so opening the tab does not fire a request on its own.
export function useDocumentRequirementCatalogPreview(
  catalogId: string,
  processContext: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.preview(
      catalogId,
      processContext
    ),
    queryFn: () =>
      fetchDocumentRequirementCatalogPreview(catalogId, processContext),
    enabled: enabled && !!catalogId && !!processContext,
  })
}
