import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { DocumentRequirementCatalogResponse } from "@/features/documentRequirements/api/schema"
import {
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
  updateDocumentRequirementCatalog,
} from "@/features/documentRequirements/api/documentRequirementsApi"
import type { UpdateDocumentRequirementCatalogRequest } from "@/features/documentRequirements/api/schema"

export function useUpdateDocumentRequirementCatalog(
  catalogId: string
): UseMutationResult<
  DocumentRequirementCatalogResponse,
  Error,
  UpdateDocumentRequirementCatalogRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: UpdateDocumentRequirementCatalogRequest) =>
      updateDocumentRequirementCatalog(catalogId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.all,
      })
    },
  })
}
