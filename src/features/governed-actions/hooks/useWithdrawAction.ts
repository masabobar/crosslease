import { withdrawGovernedAction } from "@/features/governed-actions/api/governedActionsApi"
import { createGovernedActionMutation } from "@/features/governed-actions/hooks/createGovernedActionMutation"

export const useWithdrawAction = createGovernedActionMutation(
  ({ id }: { id: string }) => withdrawGovernedAction(id)
)
