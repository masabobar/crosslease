import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { AttachDocumentResponse } from "@/features/frameworkAgreements/api/schema"
import {
  attachFrameworkAgreementDocument,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { FADocumentType } from "@/features/frameworkAgreements/api/schema"

type AttachInput = {
  faId: string
  file: File
  documentType: FADocumentType
  documentLabel?: string
}

export function useAttachFrameworkAgreementDocument(): UseMutationResult<
  AttachDocumentResponse,
  Error,
  AttachInput
> {
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
