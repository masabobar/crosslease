import { withdrawGovernedAction } from "@/features/governedActions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governedActions/hooks/createGovernedActionMutation"

export const useWithdrawAction = makeGovernedActionMutation(
  ({ id }: { id: string }) => withdrawGovernedAction(id)
)
