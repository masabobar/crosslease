import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query"
import {
  FINANCING_DETAIL_KEYS,
  fetchFinancingCollateral,
  fetchFinancingDetail,
  fetchFinancingSecurities,
  updateMaintainedValues,
  type MaintainedValuesPatch,
} from "@/features/financing/api/financingDetailApi"
import type {
  FinancingCollateral,
  FinancingDetail,
  FinancingSecuritiesResponse,
} from "@/features/financing/api/financingDetailSchema"

export function useFinancingDetail(
  financingId: string | undefined
): UseQueryResult<FinancingDetail, Error> {
  return useQuery({
    queryKey: FINANCING_DETAIL_KEYS.detail(financingId ?? ""),
    queryFn: () => fetchFinancingDetail(financingId as string),
    enabled: Boolean(financingId),
  })
}

export function useFinancingCollateral(
  financingId: string | undefined
): UseQueryResult<FinancingCollateral, Error> {
  return useQuery({
    queryKey: FINANCING_DETAIL_KEYS.collateral(financingId ?? ""),
    queryFn: () => fetchFinancingCollateral(financingId as string),
    enabled: Boolean(financingId),
  })
}

export function useFinancingSecurities(
  financingId: string | undefined
): UseQueryResult<FinancingSecuritiesResponse, Error> {
  return useQuery({
    queryKey: FINANCING_DETAIL_KEYS.securities(financingId ?? ""),
    queryFn: () => fetchFinancingSecurities(financingId as string),
    enabled: Boolean(financingId),
  })
}

export function useUpdateMaintainedValues(): UseMutationResult<
  FinancingDetail,
  Error,
  { financingId: string } & MaintainedValuesPatch
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ financingId, ...body }) =>
      updateMaintainedValues(financingId, body),
    // The response IS the updated record, so it is written straight into the cache — a refetch
    // would show the old `updated_at` for a moment and the next edit would fail its own lock.
    onSuccess: updated => {
      queryClient.setQueryData(
        FINANCING_DETAIL_KEYS.detail(updated.id),
        updated
      )
    },
  })
}
