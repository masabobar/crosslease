import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
  updateDocumentRequirementCatalog,
} from "@/features/documentRequirements/api/documentRequirementsApi"
import type { UpdateDocumentRequirementCatalogRequest } from "@/features/documentRequirements/api/schema"

export function useUpdateDocumentRequirementCatalog(catalogId: string) {
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
