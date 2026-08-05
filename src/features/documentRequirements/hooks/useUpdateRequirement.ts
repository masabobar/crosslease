import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
  updateRequirement,
} from "@/features/documentRequirements/api/documentRequirementsApi"
import type { UpdateRequirementRequest } from "@/features/documentRequirements/api/schema"

// Scoped by catalogId (for cache invalidation) even though the mutation itself targets a
// requirement id, since the only place this data is read back is the catalog detail response.
export function useUpdateRequirement(catalogId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      requirementId,
      body,
    }: {
      requirementId: string
      body: UpdateRequirementRequest
    }) => updateRequirement(requirementId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.detail(catalogId),
      })
    },
  })
}
