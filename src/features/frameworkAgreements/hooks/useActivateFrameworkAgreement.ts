import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { FADraftResponse } from "@/features/frameworkAgreements/api/schema"
import {
  activateFrameworkAgreement,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { ActivateFARequest } from "@/features/frameworkAgreements/api/schema"

type ActivateInput = {
  id: string
  body: ActivateFARequest
}

export function useActivateFrameworkAgreement(): UseMutationResult<
  FADraftResponse,
  Error,
  ActivateInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: ActivateInput) =>
      activateFrameworkAgreement(id, body),
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
