import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  reactivateFrameworkAgreement,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { ReactivateFARequest } from "@/features/frameworkAgreements/api/schema"

type ReactivateInput = {
  id: string
  body: ReactivateFARequest
}

export function useReactivateFrameworkAgreement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: ReactivateInput) =>
      reactivateFrameworkAgreement(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.detail(id),
      })
    },
  })
}
