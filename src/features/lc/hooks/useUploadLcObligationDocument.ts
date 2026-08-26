import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { uploadCaseDocument } from "@/features/documentRequirements/api/documentRequirementsApi"
import { LC_PORTAL_QUERY_KEYS } from "@/features/lc/api/lcPortalApi"

type UploadArgs = {
  requirementDefinitionId: string
  file: File
}

// PRD1042-1794 — a leasing company uploads a document against one of its own obligations. The wire
// call is the shared POST /cases/{case_id}/documents (its guard accepts the LC_OBLIGATIONS
// permission), reused from the bank flow — the only LC-specific part is which query to refetch on
// success. On success the obligation flips from outstanding/rejected to received, so this invalidates
// the LC obligations surface (keyed by the case alone, the same key the query uses) rather than the
// bank-side case-requirements key the bank hook invalidates.
export function useUploadLcObligationDocument(
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
      if (businessObjectId) {
        queryClient.invalidateQueries({
          queryKey: LC_PORTAL_QUERY_KEYS.obligations(businessObjectId),
        })
      }
    },
  })
}
