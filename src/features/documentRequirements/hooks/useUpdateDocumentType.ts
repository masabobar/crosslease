import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type {
  DocumentType,
  UpdateDocumentTypeRequest,
} from "@/features/documentRequirements/api/schema"
import { updateDocumentType } from "@/features/documentRequirements/api/documentRequirementsApi"
import { DOCUMENT_TYPE_QUERY_KEYS } from "@/features/documentRequirements/hooks/useTenantDocumentTypes"

type UpdateDocumentTypeArgs = {
  documentTypeId: string
  body: UpdateDocumentTypeRequest
}

// PRD1042-1794 Block 10 — edit a registry entry (type_name/role_scope/note) or flip is_active via
// the deactivate/reactivate row action. Invalidates the whole document-types key so the management
// list and the authoring picker both reflect the change.
export function useUpdateDocumentType(
  tenantId: string | undefined
): UseMutationResult<DocumentType, Error, UpdateDocumentTypeArgs> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ documentTypeId, body }: UpdateDocumentTypeArgs) =>
      updateDocumentType(tenantId as string, documentTypeId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DOCUMENT_TYPE_QUERY_KEYS.all,
      })
    },
  })
}
