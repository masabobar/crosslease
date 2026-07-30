import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  removeCatalogTask,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"

type RemoveCatalogTaskInput = {
  catalogId: string
  versionId: string
  taskId: string
}

export function useRemoveCatalogTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ catalogId, versionId, taskId }: RemoveCatalogTaskInput) =>
      removeCatalogTask(catalogId, versionId, taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.all,
      })
    },
  })
}
