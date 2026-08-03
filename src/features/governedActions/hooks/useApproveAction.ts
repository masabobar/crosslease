import { approveGovernedAction } from "@/features/governedActions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governedActions/hooks/createGovernedActionMutation"

export const useApproveAction = makeGovernedActionMutation(
  ({
    id,
    comment,
    extraParams,
  }: {
    id: string
    comment?: string
    extraParams?: Record<string, unknown>
  }) => approveGovernedAction(id, comment, extraParams)
)
