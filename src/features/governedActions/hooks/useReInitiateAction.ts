import { reInitiateGovernedAction } from "@/features/governedActions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governedActions/hooks/createGovernedActionMutation"

export const useReInitiateAction = makeGovernedActionMutation(
  ({ id, reason }: { id: string; reason?: string }) =>
    reInitiateGovernedAction(id, reason)
)
