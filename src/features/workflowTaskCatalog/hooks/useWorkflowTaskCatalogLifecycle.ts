import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { QueryClient, UseMutationResult } from "@tanstack/react-query"
import {
  activateWorkflowTaskCatalog,
  reactivateWorkflowTaskCatalog,
  suspendWorkflowTaskCatalog,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import type {
  CatalogDetailResponse,
  CatalogResponse,
  CatalogState,
  SuspendCatalogResponse,
} from "@/features/workflowTaskCatalog/api/schema"

/**
 * PRD1042-1894 Block 8 (AC §7) — the catalogue lifecycle transitions.
 *
 * Three separate mutations rather than one taking an action argument: each returns a different
 * shape (suspend reports the affected cases, the other two return the catalogue) and each has its
 * own success message, so a single hook would only hide a switch inside itself.
 */

/**
 * Refresh the feature, then write back the state the transition itself returned.
 *
 * The order matters. `get_async_db` (refinext-api shared/db/session.py) yields the session and
 * commits *after* the route returns, and FastAPI runs that teardown after the response is already
 * on the wire — so a refetch fired the instant a transition resolves can read the pre-commit row
 * and put the old state straight back on screen. Observed: reactivate returns 200, the detail
 * refetch it triggers answers `suspended`, and the header keeps offering Reactivate until a
 * manual reload.
 *
 * Awaiting the invalidation lets that racy refetch land first, then `setQueryData` overwrites it
 * with the state the server reported in the mutation response — which is the post-transition
 * truth, not a guess, so this is a correction rather than an optimistic update. The list and audit
 * trail are inactive while the detail page is open, so invalidation only marks them stale and they
 * refetch on their next mount, by which time the commit is long done.
 */
async function settleLifecycleTransition(
  queryClient: QueryClient,
  catalogId: string,
  catalogState: CatalogState
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.all,
  })
  queryClient.setQueryData(
    WORKFLOW_TASK_CATALOG_QUERY_KEYS.detail(catalogId),
    (cached: CatalogDetailResponse | undefined) =>
      cached ? { ...cached, catalog_state: catalogState } : cached
  )
}

export function useActivateWorkflowTaskCatalog(): UseMutationResult<
  CatalogResponse,
  Error,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (catalogId: string) => activateWorkflowTaskCatalog(catalogId),
    onSuccess: (result, catalogId) =>
      settleLifecycleTransition(queryClient, catalogId, result.catalog_state),
  })
}

export function useSuspendWorkflowTaskCatalog(): UseMutationResult<
  SuspendCatalogResponse,
  Error,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (catalogId: string) => suspendWorkflowTaskCatalog(catalogId),
    onSuccess: (result, catalogId) =>
      settleLifecycleTransition(queryClient, catalogId, result.catalog_state),
  })
}

export function useReactivateWorkflowTaskCatalog(): UseMutationResult<
  CatalogResponse,
  Error,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (catalogId: string) => reactivateWorkflowTaskCatalog(catalogId),
    onSuccess: (result, catalogId) =>
      settleLifecycleTransition(queryClient, catalogId, result.catalog_state),
  })
}
