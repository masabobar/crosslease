import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  FINANCING_CONDITION_KEYS,
  FINANCING_QUERY_KEYS,
  addApprovalCondition,
  fetchApprovalConditions,
  requestConditionWaiver,
  settleApprovalCondition,
} from "@/features/financing/api/financingApi"
import type {
  ApprovalConditionListResponse,
  ApprovalConditionResponse,
} from "@/features/financing/api/schema"

export function useApprovalConditions(caseId: string | undefined) {
  return useQuery<ApprovalConditionListResponse>({
    queryKey: FINANCING_CONDITION_KEYS.list(caseId ?? ""),
    queryFn: () => fetchApprovalConditions(caseId as string),
    enabled: Boolean(caseId),
  })
}

// The overview carries `covenants` and `open_covenant_count` too, so both caches move together —
// otherwise the Data tab's count and this list would disagree after a change.
function invalidateConditions(
  queryClient: ReturnType<typeof useQueryClient>,
  caseId: string
): void {
  void queryClient.invalidateQueries({
    queryKey: FINANCING_CONDITION_KEYS.list(caseId),
  })
  void queryClient.invalidateQueries({
    queryKey: FINANCING_QUERY_KEYS.overview(caseId),
  })
}

export function useAddApprovalCondition(): UseMutationResult<
  ApprovalConditionResponse,
  Error,
  {
    caseId: string
    condition_text: string
    due_date: string
    step_reference: string | null
  }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, ...body }) => addApprovalCondition(caseId, body),
    onSuccess: (_c, { caseId }) => invalidateConditions(queryClient, caseId),
  })
}

export function useSettleApprovalCondition(): UseMutationResult<
  ApprovalConditionResponse,
  Error,
  { caseId: string; conditionId: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, conditionId }) =>
      settleApprovalCondition(caseId, conditionId),
    onSuccess: (_c, { caseId }) => invalidateConditions(queryClient, caseId),
  })
}

/**
 * Requests a waiver — which does **not** waive the condition.
 *
 * The endpoint returns a governed action needing a second approver, so the conditions list is NOT
 * invalidated on success: the condition has not changed state and refetching would only redraw the
 * same `open` row, implying the request failed. What is invalidated is the pending-approvals list,
 * where the request now sits.
 */
export function useRequestConditionWaiver(): UseMutationResult<
  unknown,
  Error,
  {
    caseId: string
    conditionId: string
    reason: string
    waiver_expiry: string
  }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, conditionId, ...body }) =>
      requestConditionWaiver(caseId, conditionId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["governed-actions"] })
    },
  })
}
