import { useMutation } from "@tanstack/react-query"
import { discardProductTemplateDraft } from "@/features/productTemplates/api/productTemplatesApi"

type DiscardDraftInput = {
  templateId: string
  versionNumber: string
}

export function useDiscardProductTemplateDraft() {
  return useMutation({
    mutationFn: ({ templateId, versionNumber }: DiscardDraftInput) =>
      discardProductTemplateDraft(templateId, versionNumber),
  })
}
