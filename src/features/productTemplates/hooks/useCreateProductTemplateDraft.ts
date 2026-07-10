import { useMutation } from "@tanstack/react-query"
import { createProductTemplateDraft } from "@/features/productTemplates/api/productTemplatesApi"
import type { CreateProductTemplateDraftRequest } from "@/features/productTemplates/api/schema"

type CreateDraftInput = {
  tenantId: string
  body: CreateProductTemplateDraftRequest
}

export function useCreateProductTemplateDraft() {
  return useMutation({
    mutationFn: ({ tenantId, body }: CreateDraftInput) =>
      createProductTemplateDraft(tenantId, body),
  })
}
