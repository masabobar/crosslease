import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query"
import { GOVERNED_ACTIONS_QUERY_KEYS } from "@/features/governedActions/api/governedActionsApi"

export function makeGovernedActionMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>
): () => UseMutationResult<unknown, Error, TVariables> {
  return function () {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn,
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: GOVERNED_ACTIONS_QUERY_KEYS.lists(),
        })
      },
    })
  }
}
