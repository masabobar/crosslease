import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  bindCaseProductTemplate,
} from "@/features/cases/api/casesApi"
import type { CaseProductTemplateResponse } from "@/features/cases/api/schema"

type BindProductTemplateInput = {
  caseId: string
  productTemplateId: string
}

// Binds the bank product template to a case (wizard step 1, US 1.3). The template governs which
// contract rows the bulk import will accept, so step 2's preview depends on this having succeeded.
export function useBindProductTemplate(): UseMutationResult<
  CaseProductTemplateResponse,
  Error,
  BindProductTemplateInput
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, productTemplateId }: BindProductTemplateInput) =>
      bindCaseProductTemplate(caseId, productTemplateId),
    onSuccess: (_data, { caseId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.productTemplate(caseId),
      })
    },
  })
}
