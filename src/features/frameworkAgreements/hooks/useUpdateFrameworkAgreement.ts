import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  updateFrameworkAgreement,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { UpdateFARequest } from "@/features/frameworkAgreements/api/schema"

type UpdateInput = {
  id: string
  body: UpdateFARequest
}

export function useUpdateFrameworkAgreement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: UpdateInput) =>
      updateFrameworkAgreement(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: ["framework-agreements", "list"],
      })
    },
  })
}
