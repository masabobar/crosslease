import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  addCaseComment,
  bulkRemoveContracts,
  fetchCaseActivity,
  fetchCaseComments,
} from "@/features/cases/api/casesApi"
import type {
  BulkRemoveResponse,
  CaseActivityResponse,
  CaseCommentItem,
  CaseCommentListResponse,
} from "@/features/cases/api/schema"

// One page of the activity trail. Kept modest: the trail grows without bound and the design pages
// it rather than scrolling forever.
export const CASE_ACTIVITY_PER_PAGE = 25

export function useCaseActivity(caseId: string | undefined, page: number) {
  return useQuery<CaseActivityResponse>({
    queryKey: CASE_QUERY_KEYS.activity(caseId ?? "", page),
    queryFn: () =>
      fetchCaseActivity(caseId as string, page, CASE_ACTIVITY_PER_PAGE),
    enabled: Boolean(caseId),
    // An audit record never changes once written, so a page that has been read is final. Only a
    // NEW event can appear, and that arrives on page 1 — which the comment mutation invalidates.
    placeholderData: prev => prev,
  })
}

export function useCaseComments(caseId: string | undefined) {
  return useQuery<CaseCommentListResponse>({
    queryKey: CASE_QUERY_KEYS.comments(caseId ?? ""),
    queryFn: () => fetchCaseComments(caseId as string),
    enabled: Boolean(caseId),
  })
}

/**
 * Adds a comment (US 1.28).
 *
 * Invalidates the activity trail as well as the comments: adding a comment is itself an event on
 * the case, so the trail gains a row. Invalidated by prefix so every cached page is refetched
 * rather than only the one currently shown.
 */
export function useAddCaseComment(): UseMutationResult<
  CaseCommentItem,
  Error,
  { caseId: string; body: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, body }) => addCaseComment(caseId, body),
    onSuccess: (_comment, { caseId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.comments(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: ["cases", "activity", caseId],
      })
    },
  })
}

/**
 * Removes contracts from a request (US 1.12).
 *
 * Invalidates the contract list, the totals and the activity trail: the set shrank, the derived
 * figures change with it, and the removal is an auditable event.
 */
export function useBulkRemoveContracts(): UseMutationResult<
  BulkRemoveResponse,
  Error,
  { caseId: string; contractIds: string[]; reason: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, contractIds, reason }) =>
      bulkRemoveContracts(caseId, contractIds, reason),
    onSuccess: (_result, { caseId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contracts(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contractTotals(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: ["cases", "activity", caseId],
      })
    },
  })
}
