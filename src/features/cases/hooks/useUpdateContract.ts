import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { CASE_QUERY_KEYS, updateContract } from "@/features/cases/api/casesApi"
import type { CaseContract } from "@/features/cases/api/schema"

/**
 * Saves a contract's terms (US 1.9).
 *
 * Invalidates the case's contract list and its totals: the terms feed step 2's table and step 3's
 * summary figures, both of which are derived from them.
 */
export function useUpdateContract(
  caseId: string
): UseMutationResult<
  CaseContract,
  Error,
  { contractId: string; body: Record<string, unknown> }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, body }) => updateContract(contractId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contracts(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractTotals(caseId),
      })
    },
  })
}
