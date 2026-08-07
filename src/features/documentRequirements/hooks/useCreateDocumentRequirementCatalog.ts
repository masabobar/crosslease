import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { DocumentRequirementCatalogResponse } from "@/features/documentRequirements/api/schema"
import {
  createDocumentRequirementCatalog,
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
} from "@/features/documentRequirements/api/documentRequirementsApi"
import type { CreateDocumentRequirementCatalogRequest } from "@/features/documentRequirements/api/schema"

export function useCreateDocumentRequirementCatalog(
  tenantId: string | undefined
): UseMutationResult<
  DocumentRequirementCatalogResponse,
  Error,
  CreateDocumentRequirementCatalogRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateDocumentRequirementCatalogRequest) =>
      createDocumentRequirementCatalog(tenantId as string, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.all,
      })
    },
  })
}
