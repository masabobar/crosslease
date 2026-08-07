import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  deleteFrameworkAgreementDraft,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useDeleteFrameworkAgreementDraft(): UseMutationResult<
  void,
  Error,
  string
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFrameworkAgreementDraft(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.list(),
      })
    },
  })
}
