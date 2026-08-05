import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  deactivateRequirement,
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
} from "@/features/documentRequirements/api/documentRequirementsApi"

export function useDeactivateRequirement(catalogId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requirementId: string) => deactivateRequirement(requirementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.detail(catalogId),
      })
    },
  })
}
