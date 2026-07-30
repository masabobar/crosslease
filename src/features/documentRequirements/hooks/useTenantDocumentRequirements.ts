import { useQuery } from "@tanstack/react-query"
import {
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
  fetchDocumentRequirements,
  fetchTenantDocumentRequirementCatalogs,
} from "@/features/documentRequirements/api/documentRequirementsApi"
import type { DocumentRequirement } from "@/features/documentRequirements/api/schema"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

/**
 * Every ACTIVE document requirement in the tenant, flattened across its catalogues.
 *
 * **No endpoint returns this directly**, so it composes two calls: list the tenant's document
 * requirement catalogues, then read each one's requirements. Same shape as
 * `useGlobalDefaultTasks`, and for the same reason — the collection the UI needs is not the
 * collection the API exposes.
 *
 * Tenant-wide and unfiltered by process context or product template **on purpose**: US 15.7 says
 * the picker offers "Active entries in Tenant", and the BE validates a task's `doc_requirement_ref`
 * against exactly that — active, same tenant, nothing else (`task_service._validate_doc_requirement_ref`).
 * Filtering narrower here would hide requirements the server would have accepted.
 *
 * Used for display as well as authoring: a task carries only `doc_requirement_ref` as a UUID, so
 * rendering its code means resolving the id against this set.
 */
export function useTenantDocumentRequirements(tenantId: string | undefined) {
  return useQuery({
    queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.tenantRequirements(
      tenantId ?? ""
    ),
    queryFn: async (): Promise<DocumentRequirement[]> => {
      const catalogs = await fetchTenantDocumentRequirementCatalogs(
        tenantId as string
      )
      if (catalogs.items.length === 0) return []

      const pages = await Promise.all(
        catalogs.items.map(catalog => fetchDocumentRequirements(catalog.id))
      )

      return pages
        .flatMap(page => page.items)
        .filter(requirement => requirement.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
    },
    enabled: !!tenantId,
    staleTime: THIRTY_SECONDS_MS,
  })
}
