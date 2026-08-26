import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { transitionFulfilmentStatus } from "@/features/documentRequirements/api/documentRequirementsApi"
import { CASE_DOCUMENT_REQUIREMENT_QUERY_KEYS } from "@/features/documentRequirements/hooks/useCaseDocumentRequirements"

// A refinancing-request case is the business object these fulfilments hang off; keep the type in one
// place so the review action and the surface query agree on it.
const CASE_BUSINESS_OBJECT_TYPE = "refinancing_request"

type TransitionArgs = {
  requirementDefinitionId: string
  newStatus: "fulfilled" | "rejected"
}

// PRD1042-1794 A10/B3 — the bank's review of a case document: check (fulfilled) or reject (reopens).
// On success it refetches the case-requirements surface (same key the surface query uses) so the row
// flips to Met/Rejected and the blocking banner recomputes.
export function useTransitionFulfilment(
  catalogId: string | undefined,
  businessObjectId: string | undefined
): UseMutationResult<void, Error, TransitionArgs> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requirementDefinitionId, newStatus }: TransitionArgs) =>
      transitionFulfilmentStatus(catalogId as string, {
        requirementDefinitionId,
        businessObjectId: businessObjectId as string,
        businessObjectType: CASE_BUSINESS_OBJECT_TYPE,
        newStatus,
      }),
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
