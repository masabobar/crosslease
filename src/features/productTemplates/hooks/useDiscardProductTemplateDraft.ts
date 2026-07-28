import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  discardProductTemplateDraft,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"

type DiscardDraftInput = {
  templateId: string
  versionNumber: string
}

export function useDiscardProductTemplateDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId, versionNumber }: DiscardDraftInput) =>
      discardProductTemplateDraft(templateId, versionNumber),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.all,
      })
    },
  })
}
