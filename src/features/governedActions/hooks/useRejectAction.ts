import { rejectGovernedAction } from "@/features/governedActions/api/governedActionsApi"
import { makeGovernedActionMutation } from "@/features/governedActions/hooks/makeGovernedActionMutation"

export const useRejectAction = makeGovernedActionMutation(
  ({ id, comment }: { id: string; comment?: string }) =>
    rejectGovernedAction(id, comment)
)
