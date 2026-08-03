import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CASE_CHECKLIST_QUERY_KEYS,
  setCasePhaseGate,
} from "@/features/workflowTaskCatalog/api/caseChecklistApi"
import type { SetPhaseGateRequest } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { StageCategorization } from "@/features/workflowTaskCatalog/api/schema"

type SetCasePhaseGateInput = {
  businessObjectId: string
  phase: StageCategorization
  body: SetPhaseGateRequest
}

export function useSetCasePhaseGate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessObjectId, phase, body }: SetCasePhaseGateInput) =>
      setCasePhaseGate(businessObjectId, phase, body),
    onSuccess: (_data, { businessObjectId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_CHECKLIST_QUERY_KEYS.case(businessObjectId),
      })
    },
  })
}
