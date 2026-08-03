import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CASE_CHECKLIST_QUERY_KEYS,
  setChecklistItemStatus,
} from "@/features/workflowTaskCatalog/api/caseChecklistApi"
import type { SetItemStatusRequest } from "@/features/workflowTaskCatalog/api/runtimeSchema"

type SetChecklistItemStatusInput = {
  businessObjectId: string
  itemId: string
  body: SetItemStatusRequest
}

export function useSetChecklistItemStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessObjectId,
      itemId,
      body,
    }: SetChecklistItemStatusInput) =>
      setChecklistItemStatus(businessObjectId, itemId, body),
    // Invalidates the whole case, not just the item list: settling an item also changes the
    // required projection's `all_required_done`, which drives the outstanding-tasks notice.
    onSuccess: (_data, { businessObjectId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_CHECKLIST_QUERY_KEYS.case(businessObjectId),
      })
    },
  })
}
