import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  updateProductTemplateOrchestration,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import type { UpdateOrchestrationRequest } from "@/features/productTemplates/api/schema"

type UpdateOrchestrationInput = {
  templateId: string
  versionNumber: string
  body: UpdateOrchestrationRequest
}

export function useUpdateProductTemplateOrchestration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      versionNumber,
      body,
    }: UpdateOrchestrationInput) =>
      updateProductTemplateOrchestration(templateId, versionNumber, body),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.versions(variables.templateId),
      })
    },
  })
}
