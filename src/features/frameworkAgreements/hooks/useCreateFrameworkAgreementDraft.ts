import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createFrameworkAgreementDraft,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useCreateFrameworkAgreementDraft() {
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
