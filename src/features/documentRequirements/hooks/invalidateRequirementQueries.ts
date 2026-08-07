import type { QueryClient } from "@tanstack/react-query"
import { DOCUMENT_REQUIREMENT_QUERY_KEYS } from "@/features/documentRequirements/api/documentRequirementsApi"

/**
 * Adding, editing or deactivating a requirement changes two things: the catalogue detail it
 * belongs to, and the tenant-wide active set the Workflow Task Catalogue's document picker
 * reads. Only the first used to be invalidated, so the picker kept offering a requirement
 * that had just been deactivated — which the backend then rejected on submit.
 */
export function invalidateRequirementQueries(
  queryClient: QueryClient,
  catalogId: string
): void {
  void queryClient.invalidateQueries({
    queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.detail(catalogId),
  })
  void queryClient.invalidateQueries({
    queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.allTenantRequirements(),
  })
}
