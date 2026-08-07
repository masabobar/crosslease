import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { TaskResponseWithWarnings } from "@/features/workflowTaskCatalog/api/schema"
import {
  addCatalogTask,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import type { AddTaskRequest } from "@/features/workflowTaskCatalog/api/schema"

type AddCatalogTaskInput = {
  catalogId: string
  versionId: string
  body: AddTaskRequest
}

export function useAddCatalogTask(): UseMutationResult<
  TaskResponseWithWarnings,
  Error,
  AddCatalogTaskInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ catalogId, versionId, body }: AddCatalogTaskInput) =>
      addCatalogTask(catalogId, versionId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.all,
      })
    },
  })
}
