import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type {
  CataloguePhase,
  CreatePhaseRequest,
  RemovePhaseResponse,
  UpdatePhaseRequest,
} from "@/features/workflowTaskCatalog/api/schema"
import {
  addCatalogPhase,
  removeCatalogPhase,
  reorderCatalogPhases,
  updateCatalogPhase,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"

type PhaseScope = { catalogId: string; versionId: string }

// Every stage mutation invalidates the whole feature, not just the phase list: a task row carries
// its phase_id, so a rename or a removal changes what the task table renders too.
function useInvalidateFeature(): () => void {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({
      queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.all,
    })
  }
}

export function useAddCatalogPhase(
  scope: PhaseScope
): UseMutationResult<CataloguePhase, Error, CreatePhaseRequest> {
  const invalidate = useInvalidateFeature()
  return useMutation({
    mutationFn: (body: CreatePhaseRequest) =>
      addCatalogPhase(scope.catalogId, scope.versionId, body),
    onSuccess: invalidate,
  })
}

export function useUpdateCatalogPhase(
  scope: PhaseScope
): UseMutationResult<
  CataloguePhase,
  Error,
  { phaseId: string; body: UpdatePhaseRequest }
> {
  const invalidate = useInvalidateFeature()
  return useMutation({
    mutationFn: ({
      phaseId,
      body,
    }: {
      phaseId: string
      body: UpdatePhaseRequest
    }) => updateCatalogPhase(scope.catalogId, scope.versionId, phaseId, body),
    onSuccess: invalidate,
  })
}

export function useReorderCatalogPhases(
  scope: PhaseScope
): UseMutationResult<CataloguePhase[], Error, string[]> {
  const invalidate = useInvalidateFeature()
  return useMutation({
    mutationFn: (orderedPhaseIds: string[]) =>
      reorderCatalogPhases(scope.catalogId, scope.versionId, {
        ordered_phase_ids: orderedPhaseIds,
      }),
    onSuccess: invalidate,
  })
}

// `confirm` is the caller's second attempt: the first call reports how many tasks the stage holds
// and removes nothing, so the panel can name the count before the user commits.
export function useRemoveCatalogPhase(
  scope: PhaseScope
): UseMutationResult<
  RemovePhaseResponse,
  Error,
  { phaseId: string; confirm: boolean }
> {
  const invalidate = useInvalidateFeature()
  return useMutation({
    mutationFn: ({ phaseId, confirm }: { phaseId: string; confirm: boolean }) =>
      removeCatalogPhase(scope.catalogId, scope.versionId, phaseId, confirm),
    onSuccess: invalidate,
  })
}
