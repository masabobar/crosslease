import { rejectGovernedAction } from "@/features/governed-actions/api/governedActionsApi"
import { createGovernedActionMutation } from "@/features/governed-actions/hooks/createGovernedActionMutation"

export const useRejectAction = createGovernedActionMutation(
  ({ id, comment }: { id: string; comment?: string }) =>
    rejectGovernedAction(id, comment)
)
