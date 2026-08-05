import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  addRequirement,
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
} from "@/features/documentRequirements/api/documentRequirementsApi"
import type { AddRequirementRequest } from "@/features/documentRequirements/api/schema"

export function useAddRequirement(catalogId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: AddRequirementRequest) =>
      addRequirement(catalogId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.detail(catalogId),
      })
    },
  })
}
