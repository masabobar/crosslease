import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { CatalogResponse } from "@/features/workflowTaskCatalog/api/schema"
import {
  createWorkflowTaskCatalog,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import type { CreateCatalogRequest } from "@/features/workflowTaskCatalog/api/schema"

export function useCreateWorkflowTaskCatalog(): UseMutationResult<
  CatalogResponse,
  Error,
  CreateCatalogRequest
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateCatalogRequest) => createWorkflowTaskCatalog(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.all,
      })
    },
  })
}
