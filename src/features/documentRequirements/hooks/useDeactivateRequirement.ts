import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { RequirementResponse } from "@/features/documentRequirements/api/schema"
import { deactivateRequirement } from "@/features/documentRequirements/api/documentRequirementsApi"
import { invalidateRequirementQueries } from "@/features/documentRequirements/hooks/invalidateRequirementQueries"

export function useDeactivateRequirement(
  catalogId: string
): UseMutationResult<RequirementResponse, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requirementId: string) => deactivateRequirement(requirementId),
    onSuccess: () => {
      invalidateRequirementQueries(queryClient, catalogId)
    },
  })
}
