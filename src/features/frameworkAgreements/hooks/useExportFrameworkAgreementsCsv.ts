import { useMutation } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { exportFrameworkAgreementsCsv } from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { FrameworkAgreementExportParams } from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useExportFrameworkAgreementsCsv(): UseMutationResult<
  Blob,
  Error,
  FrameworkAgreementExportParams | undefined
> {
  return useMutation({
    mutationFn: (params?: FrameworkAgreementExportParams) =>
      exportFrameworkAgreementsCsv(params),
  })
}
