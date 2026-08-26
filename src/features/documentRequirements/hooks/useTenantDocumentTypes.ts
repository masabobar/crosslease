import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { DocumentTypeListResponse } from "@/features/documentRequirements/api/schema"
import { fetchTenantDocumentTypes } from "@/features/documentRequirements/api/documentRequirementsApi"

export const DOCUMENT_TYPE_QUERY_KEYS = {
  all: ["document-types"] as const,
  byTenant: (tenantId: string) => ["document-types", tenantId] as const,
} as const

// PRD1042-1794 Block 10 — the registry a requirement's document type must come from. It changes only
// when a Bank Admin maintains it, so it is cached for the session rather than refetched per sheet.
const ONE_HOUR_MS = 60 * 60 * 1000

export function useTenantDocumentTypes(
  tenantId: string | undefined
): UseQueryResult<DocumentTypeListResponse, Error> {
  return useQuery({
    queryKey: DOCUMENT_TYPE_QUERY_KEYS.byTenant(tenantId ?? ""),
    queryFn: () => fetchTenantDocumentTypes(tenantId as string),
    enabled: Boolean(tenantId),
    staleTime: ONE_HOUR_MS,
  })
}
