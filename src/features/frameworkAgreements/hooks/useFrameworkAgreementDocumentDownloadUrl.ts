import { useMutation } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { DownloadURLResponse } from "@/features/frameworkAgreements/api/schema"
import { fetchFrameworkAgreementDocumentDownloadUrl } from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

type DownloadInput = {
  faId: string
  docId: string
}

export function useFrameworkAgreementDocumentDownloadUrl(): UseMutationResult<
  DownloadURLResponse,
  Error,
  DownloadInput
> {
  return useMutation({
    mutationFn: ({ faId, docId }: DownloadInput) =>
      fetchFrameworkAgreementDocumentDownloadUrl(faId, docId),
  })
}
