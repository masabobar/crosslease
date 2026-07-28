import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  publishProductTemplate,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import type { PublishTemplateDraftRequest } from "@/features/productTemplates/api/schema"

type PublishDraftInput = {
  templateId: string
  versionNumber: string
  body: PublishTemplateDraftRequest
}

export function usePublishProductTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId, versionNumber, body }: PublishDraftInput) =>
      publishProductTemplate(templateId, versionNumber, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.all,
      })
    },
  })
}
