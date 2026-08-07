import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { TemplateDraftCreatedResponse } from "@/features/productTemplates/api/schema"
import {
  createProductTemplateDraft,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import type { CreateProductTemplateDraftRequest } from "@/features/productTemplates/api/schema"

type CreateDraftInput = {
  tenantId: string
  body: CreateProductTemplateDraftRequest
}

export function useCreateProductTemplateDraft(): UseMutationResult<
  TemplateDraftCreatedResponse,
  Error,
  CreateDraftInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, body }: CreateDraftInput) =>
      createProductTemplateDraft(tenantId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.all,
      })
    },
  })
}
