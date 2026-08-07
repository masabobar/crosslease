import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { DocumentRequirementCatalogListResponse } from "@/features/documentRequirements/api/schema"
import {
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
  fetchDocumentRequirementCatalogs,
} from "@/features/documentRequirements/api/documentRequirementsApi"
import type { DocumentRequirementCatalogListParams } from "@/features/documentRequirements/api/documentRequirementsApi"
import { MIN_SEARCH_LENGTH } from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogListParams"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useDocumentRequirementCatalogList(
  tenantId: string | undefined,
  params: DocumentRequirementCatalogListParams
): UseQueryResult<DocumentRequirementCatalogListResponse, Error> {
  const normalizedParams: DocumentRequirementCatalogListParams = {
    ...params,
    search:
      params.search && params.search.length >= MIN_SEARCH_LENGTH
        ? params.search
        : undefined,
  }

  return useQuery({
    queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.list(
      tenantId ?? "",
      normalizedParams
    ),
    queryFn: () =>
      fetchDocumentRequirementCatalogs(tenantId as string, normalizedParams),
    enabled: !!tenantId,
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
