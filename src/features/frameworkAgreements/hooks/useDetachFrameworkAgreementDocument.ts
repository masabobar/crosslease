import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  detachFrameworkAgreementDocument,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

type DetachInput = {
  faId: string
  docId: string
}

export function useDetachFrameworkAgreementDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ faId, docId }: DetachInput) =>
      detachFrameworkAgreementDocument(faId, docId),
    onSuccess: (_data, { faId }) => {
      queryClient.invalidateQueries({
        queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.documents(faId),
      })
      queryClient.invalidateQueries({
        queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.detail(faId),
      })
    },
  })
}
