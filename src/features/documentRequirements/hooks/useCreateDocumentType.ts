import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type {
  CreateDocumentTypeRequest,
  DocumentType,
} from "@/features/documentRequirements/api/schema"
import { createDocumentType } from "@/features/documentRequirements/api/documentRequirementsApi"
import { DOCUMENT_TYPE_QUERY_KEYS } from "@/features/documentRequirements/hooks/useTenantDocumentTypes"

// PRD1042-1794 Block 10 — a new registry entry. Invalidates the whole document-types key so both
// the management list (either include_inactive value) and the authoring picker pick it up.
export function useCreateDocumentType(
  tenantId: string | undefined
): UseMutationResult<DocumentType, Error, CreateDocumentTypeRequest> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateDocumentTypeRequest) =>
      createDocumentType(tenantId as string, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DOCUMENT_TYPE_QUERY_KEYS.all,
      })
    },
  })
}
