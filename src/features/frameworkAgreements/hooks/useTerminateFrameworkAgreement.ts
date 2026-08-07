import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { FATerminatedResponse } from "@/features/frameworkAgreements/api/schema"
import {
  terminateFrameworkAgreement,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { TerminateFARequest } from "@/features/frameworkAgreements/api/schema"

type TerminateInput = {
  id: string
  body: TerminateFARequest
}

export function useTerminateFrameworkAgreement(): UseMutationResult<
  FATerminatedResponse,
  Error,
  TerminateInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: TerminateInput) =>
      terminateFrameworkAgreement(id, body),
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
