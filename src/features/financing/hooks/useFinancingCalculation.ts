import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FINANCING_CALCULATION_KEYS,
  commitRate,
  fetchContractContributions,
  fetchFinancing,
  fetchFinancingComponents,
  overrideQuota,
  recalculateFinancing,
  setRefinancingRate,
  setValueDate,
} from "@/features/financing/api/financingApi"

/**
 * Queries and mutations for the case's Calculation area — US 1.15.
 *
 * Every mutation invalidates **all three** reads. Setting the rate changes the financing record,
 * but it is the per-contract components and contributions that carry the figures derived from it,
 * and those are separate resources. Invalidating only the record would leave the screen showing
 * figures computed against the previous rate — the exact "looks computed but isn't" state the story
 * requires be shown as pending instead.
 */
export function useFinancing(caseId: string) {
  return useQuery({
    queryKey: FINANCING_CALCULATION_KEYS.financing(caseId),
    queryFn: () => fetchFinancing(caseId),
  })
}

export function useFinancingComponents(caseId: string) {
  return useQuery({
    queryKey: FINANCING_CALCULATION_KEYS.components(caseId),
    queryFn: () => fetchFinancingComponents(caseId),
  })
}

export function useContractContributions(caseId: string) {
  return useQuery({
    queryKey: FINANCING_CALCULATION_KEYS.contributions(caseId),
    queryFn: () => fetchContractContributions(caseId),
  })
}

function useCalculationMutation<TArgs>(
  run: (args: TArgs & { caseId: string }) => Promise<unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: (_data, variables) => {
      const { caseId } = variables as { caseId: string }
      for (const key of [
        FINANCING_CALCULATION_KEYS.financing(caseId),
        FINANCING_CALCULATION_KEYS.components(caseId),
        FINANCING_CALCULATION_KEYS.contributions(caseId),
      ]) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

export function useSetRefinancingRate() {
  return useCalculationMutation<{ rate: string }>(({ caseId, rate }) =>
    setRefinancingRate(caseId, rate)
  )
}

export function useOverrideQuota() {
  return useCalculationMutation<{ quota: string }>(({ caseId, quota }) =>
    overrideQuota(caseId, quota)
  )
}

export function useSetValueDate() {
  return useCalculationMutation<{ valueDate: string }>(
    ({ caseId, valueDate }) => setValueDate(caseId, valueDate)
  )
}

// Takes no argument beyond the case, so the generic is an empty object rather than a record whose
// index signature would fight the `caseId` every mutation carries.
export function useRecalculateFinancing() {
  return useCalculationMutation<object>(({ caseId }) =>
    recalculateFinancing(caseId)
  )
}

export function useCommitRate() {
  return useCalculationMutation<{ lockDays: number }>(({ caseId, lockDays }) =>
    commitRate(caseId, lockDays)
  )
}
