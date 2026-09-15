import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  addContractCollateral,
  fetchContractCollaterals,
  removeContractCollateral,
} from "@/features/cases/api/casesApi"
import type {
  CollateralListResponse,
  ContractCollateralResponse,
  ContractCollateralType,
  ObligationKind,
} from "@/features/cases/api/schema"

export function useContractCollaterals(contractId: string | undefined) {
  return useQuery<CollateralListResponse>({
    queryKey: CASE_QUERY_KEYS.contractCollaterals(contractId ?? ""),
    queryFn: () => fetchContractCollaterals(contractId as string),
    enabled: Boolean(contractId),
  })
}

export function useAddCollateral(): UseMutationResult<
  ContractCollateralResponse,
  Error,
  {
    contractId: string
    collateralType: ContractCollateralType
    value: string | null
    existingPartnerId?: string
    kindOfObligation?: ObligationKind
  }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addContractCollateral,
    onSuccess: (_created, { contractId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractCollaterals(contractId),
      })
      // A guarantee collateral IS the guarantor link, so the guarantor list the backend derives
      // from it is stale the moment one is added.
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractGuarantors(contractId),
      })
    },
  })
}

export function useRemoveCollateral(): UseMutationResult<
  void,
  Error,
  { contractId: string; collateralId: string; reason: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contractId, collateralId, reason }) =>
      removeContractCollateral(contractId, collateralId, reason),
    onSuccess: (_result, { contractId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractCollaterals(contractId),
      })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractGuarantors(contractId),
      })
    },
  })
}
