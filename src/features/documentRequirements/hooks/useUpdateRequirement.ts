import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { RequirementResponse } from "@/features/documentRequirements/api/schema"
import { updateRequirement } from "@/features/documentRequirements/api/documentRequirementsApi"
import { invalidateRequirementQueries } from "@/features/documentRequirements/hooks/invalidateRequirementQueries"
import type { UpdateRequirementRequest } from "@/features/documentRequirements/api/schema"

// Scoped by catalogId (for cache invalidation) even though the mutation itself targets a
// requirement id, since the only place this data is read back is the catalog detail response.
type UpdateRequirementInput = {
  requirementId: string
  body: UpdateRequirementRequest
}

export function useUpdateRequirement(
  catalogId: string
): UseMutationResult<RequirementResponse, Error, UpdateRequirementInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requirementId, body }: UpdateRequirementInput) =>
      updateRequirement(requirementId, body),
    onSuccess: () => {
      invalidateRequirementQueries(queryClient, catalogId)
    },
  })
}
