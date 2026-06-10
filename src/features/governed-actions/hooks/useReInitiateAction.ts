import { reInitiateGovernedAction } from "@/features/governed-actions/api/governedActionsApi"
import { createGovernedActionMutation } from "@/features/governed-actions/hooks/createGovernedActionMutation"

export const useReInitiateAction = createGovernedActionMutation(
  ({ id, reason }: { id: string; reason?: string }) =>
    reInitiateGovernedAction(id, reason)
)
