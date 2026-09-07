import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  bindCaseLeasingCompany,
} from "@/features/cases/api/casesApi"
import type { CaseLeasingCompanyResponse } from "@/features/cases/api/schema"

type BindLeasingCompanyInput = {
  caseId: string
  /** The Händlernummer, four digits — see bindCaseLeasingCompany for why not a partner id. */
  lcNumber: string
}

/**
 * Binds a leasing company to a case (wizard step 1, US 1.2).
 *
 * Invalidates the product-template query as well as the leasing-company one: the framework
 * agreement determines which templates may be picked, so changing the company can invalidate a
 * template chosen against the previous agreement.
 */
export function useBindLeasingCompany(): UseMutationResult<
  CaseLeasingCompanyResponse,
  Error,
  BindLeasingCompanyInput
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, lcNumber }: BindLeasingCompanyInput) =>
      bindCaseLeasingCompany(caseId, lcNumber),
    onSuccess: (_data, { caseId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.leasingCompany(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.productTemplate(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.detail(caseId),
      })
    },
  })
}
