import { approveGovernedAction } from "@/features/governed-actions/api/governedActionsApi"
import { createGovernedActionMutation } from "@/features/governed-actions/hooks/createGovernedActionMutation"

export const useApproveAction = createGovernedActionMutation(
  ({ id, comment }: { id: string; comment?: string }) =>
    approveGovernedAction(id, comment)
)
