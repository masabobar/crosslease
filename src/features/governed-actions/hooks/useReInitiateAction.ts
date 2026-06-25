import { reInitiateGovernedAction } from "@/features/governed-actions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governed-actions/hooks/createGovernedActionMutation"

export const useReInitiateAction = makeGovernedActionMutation(
  ({ id, reason }: { id: string; reason?: string }) =>
    reInitiateGovernedAction(id, reason)
)
