import { approveGovernedAction } from "@/features/governed-actions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governed-actions/hooks/createGovernedActionMutation"

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
