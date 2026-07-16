import { useMutation } from "@tanstack/react-query"
import { createFrameworkAgreementDraft } from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useCreateFrameworkAgreementDraft() {
  return useMutation({
    mutationFn: createFrameworkAgreementDraft,
  })
}
