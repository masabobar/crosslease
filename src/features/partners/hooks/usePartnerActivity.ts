import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query"
import {
  PARTNER_ACTIVITY_KEYS,
  addPartnerComment,
  fetchPartnerActivity,
  fetchPartnerComments,
} from "@/features/partners/api/partnerActivityApi"
import type {
  CaseActivityResponse,
  CaseCommentItem,
  CaseCommentListResponse,
} from "@/features/cases/api/schema"

export function usePartnerActivity(
  partnerId: string | undefined,
  page: number
): UseQueryResult<CaseActivityResponse, Error> {
  return useQuery({
    queryKey: PARTNER_ACTIVITY_KEYS.activity(partnerId ?? "", page),
    queryFn: () => fetchPartnerActivity(partnerId as string, page),
    enabled: Boolean(partnerId),
    placeholderData: previous => previous,
  })
}

export function usePartnerComments(
  partnerId: string | undefined
): UseQueryResult<CaseCommentListResponse, Error> {
  return useQuery({
    queryKey: PARTNER_ACTIVITY_KEYS.comments(partnerId ?? ""),
    queryFn: () => fetchPartnerComments(partnerId as string),
    enabled: Boolean(partnerId),
  })
}

export function useAddPartnerComment(): UseMutationResult<
  CaseCommentItem,
  Error,
  { partnerId: string; body: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ partnerId, body }) => addPartnerComment(partnerId, body),
    onSuccess: (_created, { partnerId }) => {
      void queryClient.invalidateQueries({
        queryKey: PARTNER_ACTIVITY_KEYS.comments(partnerId),
      })
      // A comment is itself an audited event, so the trail beside it is stale too.
      void queryClient.invalidateQueries({
        queryKey: ["partners", "activity", partnerId],
      })
    },
  })
}
