import { rejectGovernedAction } from "@/features/governedActions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governedActions/hooks/createGovernedActionMutation"

export const useRejectAction = makeGovernedActionMutation(
  ({ id, comment }: { id: string; comment?: string }) =>
    rejectGovernedAction(id, comment)
)
