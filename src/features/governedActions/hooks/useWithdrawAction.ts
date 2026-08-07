import { withdrawGovernedAction } from "@/features/governedActions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governedActions/hooks/makeGovernedActionMutation"

export const useWithdrawAction = makeGovernedActionMutation(
  ({ id }: { id: string }) => withdrawGovernedAction(id)
)
