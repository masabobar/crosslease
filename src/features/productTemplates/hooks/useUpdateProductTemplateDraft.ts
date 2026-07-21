import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  updateProductTemplateDraft,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import type { UpdateProductTemplateDraftRequest } from "@/features/productTemplates/api/schema"

type UpdateDraftInput = {
  templateId: string
  versionNumber: string
  body: UpdateProductTemplateDraftRequest
}

export function useUpdateProductTemplateDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId, versionNumber, body }: UpdateDraftInput) =>
      updateProductTemplateDraft(templateId, versionNumber, body),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.versions(variables.templateId),
      })
    },
  })
}
