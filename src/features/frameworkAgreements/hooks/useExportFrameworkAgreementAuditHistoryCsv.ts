import { useMutation } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { exportFrameworkAgreementAuditHistoryCsv } from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { FrameworkAgreementAuditHistoryExportParams } from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

type Variables = {
  id: string
  params?: FrameworkAgreementAuditHistoryExportParams
}

export function useExportFrameworkAgreementAuditHistoryCsv(): UseMutationResult<
  Blob,
  Error,
  Variables
> {
  return useMutation({
    mutationFn: ({ id, params }: Variables) =>
      exportFrameworkAgreementAuditHistoryCsv(id, params),
  })
}
