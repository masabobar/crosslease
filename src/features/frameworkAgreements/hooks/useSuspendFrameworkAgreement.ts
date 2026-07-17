import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  suspendFrameworkAgreement,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { SuspendFARequest } from "@/features/frameworkAgreements/api/schema"

type SuspendInput = {
  id: string
  body: SuspendFARequest
}

export function useSuspendFrameworkAgreement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: SuspendInput) =>
      suspendFrameworkAgreement(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.list(),
      })
    },
  })
}
