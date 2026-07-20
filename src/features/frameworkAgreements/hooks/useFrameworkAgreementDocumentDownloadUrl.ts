import { useMutation } from "@tanstack/react-query"
import { fetchFrameworkAgreementDocumentDownloadUrl } from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

type DownloadInput = {
  faId: string
  docId: string
}

export function useFrameworkAgreementDocumentDownloadUrl() {
  return useMutation({
    mutationFn: ({ faId, docId }: DownloadInput) =>
      fetchFrameworkAgreementDocumentDownloadUrl(faId, docId),
  })
}
