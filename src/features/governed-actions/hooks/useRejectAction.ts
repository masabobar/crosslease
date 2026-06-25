import { rejectGovernedAction } from "@/features/governed-actions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governed-actions/hooks/createGovernedActionMutation"

export const useRejectAction = makeGovernedActionMutation(
  ({ id, comment }: { id: string; comment?: string }) =>
    rejectGovernedAction(id, comment)
)
