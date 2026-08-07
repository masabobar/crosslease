import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { PhaseGateResponse } from "@/features/workflowTaskCatalog/api/runtimeSchema"
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

export function useSetCasePhaseGate(): UseMutationResult<
  PhaseGateResponse,
  Error,
  SetCasePhaseGateInput
> {
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
