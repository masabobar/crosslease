import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { uploadCaseDocument } from "@/features/documentRequirements/api/documentRequirementsApi"
import { CASE_DOCUMENT_REQUIREMENT_QUERY_KEYS } from "@/features/documentRequirements/hooks/useCaseDocumentRequirements"

type UploadArgs = {
  requirementDefinitionId: string
  file: File
}

// PRD1042-1794 item 6 — upload against one case requirement, then refetch the case-requirements
// surface so the row flips from missing/rejected to uploaded_pending_review. Keyed by catalog +
// business object, the same key the surface query uses.
export function useUploadCaseDocument(
  catalogId: string | undefined,
  businessObjectId: string | undefined
): UseMutationResult<void, Error, UploadArgs> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requirementDefinitionId, file }: UploadArgs) =>
      uploadCaseDocument(
        businessObjectId as string,
        requirementDefinitionId,
        file
      ),
    onSuccess: () => {
      if (catalogId && businessObjectId) {
        queryClient.invalidateQueries({
          queryKey: CASE_DOCUMENT_REQUIREMENT_QUERY_KEYS.forObject(
            catalogId,
            businessObjectId
          ),
        })
      }
    },
  })
}
