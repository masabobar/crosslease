import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { TemplateDraftUpdatedResponse } from "@/features/productTemplates/api/schema"
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

export function useUpdateProductTemplateDraft(): UseMutationResult<
  TemplateDraftUpdatedResponse,
  Error,
  UpdateDraftInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId, versionNumber, body }: UpdateDraftInput) =>
      updateProductTemplateDraft(templateId, versionNumber, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.all,
      })
    },
  })
}
