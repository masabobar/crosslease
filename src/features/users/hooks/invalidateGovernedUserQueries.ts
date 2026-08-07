import type { QueryClient } from "@tanstack/react-query"
import { USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import { GOVERNED_ACTIONS_QUERY_KEYS } from "@/features/governedActions/api/governedActionsApi"

/**
 * Role, email, access-period and four-eyes invite changes return a governed action rather
 * than an updated user, so three caches go stale at once: the user's own detail, the list
 * its row is rendered from, and the approval queue the new action has to appear in. Leaving
 * the queue out means an approver opening it inside the stale window sees no pending action.
 */
export function invalidateGovernedUserQueries(
  queryClient: QueryClient,
  userId?: string
): void {
  if (userId) {
    void queryClient.invalidateQueries({
      queryKey: USERS_QUERY_KEYS.detail(userId),
    })
  }
  void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.lists() })
  void queryClient.invalidateQueries({
    queryKey: GOVERNED_ACTIONS_QUERY_KEYS.lists(),
  })
}
