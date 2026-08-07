import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type {
  CreateFARequest,
  FADraftResponse,
} from "@/features/frameworkAgreements/api/schema"
import {
  createFrameworkAgreementDraft,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useCreateFrameworkAgreementDraft(): UseMutationResult<
  FADraftResponse,
  Error,
  CreateFARequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFrameworkAgreementDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.list(),
      })
    },
  })
}
