import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { DocumentRequirementCatalogDetailResponse } from "@/features/documentRequirements/api/schema"
import {
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
  fetchDocumentRequirementCatalogDetail,
} from "@/features/documentRequirements/api/documentRequirementsApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useDocumentRequirementCatalogDetail(
  catalogId: string | undefined
): UseQueryResult<DocumentRequirementCatalogDetailResponse, Error> {
  return useQuery({
    queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.detail(catalogId ?? ""),
    queryFn: () => fetchDocumentRequirementCatalogDetail(catalogId as string),
    enabled: !!catalogId,
    staleTime: THIRTY_SECONDS_MS,
  })
}
