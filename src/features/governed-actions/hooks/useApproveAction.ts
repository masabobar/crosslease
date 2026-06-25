import { approveGovernedAction } from "@/features/governed-actions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governed-actions/hooks/createGovernedActionMutation"

export const useApproveAction = makeGovernedActionMutation(
  ({ id, comment }: { id: string; comment?: string }) =>
    approveGovernedAction(id, comment)
)
