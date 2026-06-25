import { withdrawGovernedAction } from "@/features/governed-actions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governed-actions/hooks/createGovernedActionMutation"

export const useWithdrawAction = makeGovernedActionMutation(
  ({ id }: { id: string }) => withdrawGovernedAction(id)
)
