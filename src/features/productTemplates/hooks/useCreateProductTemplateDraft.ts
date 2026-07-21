import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createProductTemplateDraft,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import type { CreateProductTemplateDraftRequest } from "@/features/productTemplates/api/schema"

type CreateDraftInput = {
  tenantId: string
  body: CreateProductTemplateDraftRequest
}

export function useCreateProductTemplateDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, body }: CreateDraftInput) =>
      createProductTemplateDraft(tenantId, body),
    onSuccess: data => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.versions(data.id),
      })
    },
  })
}
