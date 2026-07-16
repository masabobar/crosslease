import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  attachFrameworkAgreementDocument,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

type AttachInput = {
  faId: string
  file: File
  documentType: string
  documentLabel?: string
}

export function useAttachFrameworkAgreementDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ faId, file, documentType, documentLabel }: AttachInput) =>
      attachFrameworkAgreementDocument(faId, file, documentType, documentLabel),
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
