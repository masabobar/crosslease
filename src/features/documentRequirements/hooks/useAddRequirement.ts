import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { RequirementResponse } from "@/features/documentRequirements/api/schema"
import { addRequirement } from "@/features/documentRequirements/api/documentRequirementsApi"
import { invalidateRequirementQueries } from "@/features/documentRequirements/hooks/invalidateRequirementQueries"
import type { AddRequirementRequest } from "@/features/documentRequirements/api/schema"

export function useAddRequirement(
  catalogId: string
): UseMutationResult<RequirementResponse, Error, AddRequirementRequest> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: AddRequirementRequest) =>
      addRequirement(catalogId, body),
    onSuccess: () => {
      invalidateRequirementQueries(queryClient, catalogId)
    },
  })
}
