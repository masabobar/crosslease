import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CASE_COLLATERAL_KEYS,
  confirmCollateral,
  fetchCaseCollateral,
  redetermineCollateral,
  setCollateralTotal,
  setCollateralType,
} from "@/features/cases/api/casesApi"
import type { CollateralType } from "@/features/cases/api/schema"

export function useCaseCollateral(caseId: string) {
  return useQuery({
    queryKey: CASE_COLLATERAL_KEYS.detail(caseId),
    queryFn: () => fetchCaseCollateral(caseId),
  })
}

/**
 * Every collateral act answers with the whole `CollateralResponse`, so the cache is **set from the
 * response** rather than invalidated. That matters here beyond saving a request: the re-check state
 * and `redetermined_by` decide which button the panel offers next, and a refetch round-trip would
 * leave the old buttons on screen in between.
 */
function useCollateralMutation<TArgs>(
  run: (
    args: TArgs & { caseId: string }
  ) => ReturnType<typeof confirmCollateral>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: (data, variables) => {
      const { caseId } = variables as { caseId: string }
      queryClient.setQueryData(CASE_COLLATERAL_KEYS.detail(caseId), data)
    },
  })
}

export function useSetCollateralTotal() {
  return useCollateralMutation<{ totalEur: string }>(({ caseId, totalEur }) =>
    setCollateralTotal(caseId, totalEur)
  )
}

export function useSetCollateralType() {
  return useCollateralMutation<{ collateralType: CollateralType }>(
    ({ caseId, collateralType }) => setCollateralType(caseId, collateralType)
  )
}

export function useRedetermineCollateral() {
  return useCollateralMutation<{ totalEur: string }>(({ caseId, totalEur }) =>
    redetermineCollateral(caseId, totalEur)
  )
}

export function useConfirmCollateral() {
  return useCollateralMutation<object>(({ caseId }) =>
    confirmCollateral(caseId)
  )
}
