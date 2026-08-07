import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { TaskResponseWithWarnings } from "@/features/workflowTaskCatalog/api/schema"
import {
  updateCatalogTask,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import type { UpdateTaskRequest } from "@/features/workflowTaskCatalog/api/schema"

type UpdateCatalogTaskInput = {
  catalogId: string
  versionId: string
  taskId: string
  body: UpdateTaskRequest
}

export function useUpdateCatalogTask(): UseMutationResult<
  TaskResponseWithWarnings,
  Error,
  UpdateCatalogTaskInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      catalogId,
      versionId,
      taskId,
      body,
    }: UpdateCatalogTaskInput) =>
      updateCatalogTask(catalogId, versionId, taskId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.all,
      })
    },
  })
}
