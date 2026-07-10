import { useMutation } from "@tanstack/react-query"
import { updateProductTemplateDraft } from "@/features/productTemplates/api/productTemplatesApi"
import type { UpdateProductTemplateDraftRequest } from "@/features/productTemplates/api/schema"

type UpdateDraftInput = {
  templateId: string
  versionNumber: string
  body: UpdateProductTemplateDraftRequest
}

export function useUpdateProductTemplateDraft() {
  return useMutation({
    mutationFn: ({ templateId, versionNumber, body }: UpdateDraftInput) =>
      updateProductTemplateDraft(templateId, versionNumber, body),
  })
}
