import { useMutation } from "@tanstack/react-query"
import { updateProductTemplateOrchestration } from "@/features/productTemplates/api/productTemplatesApi"
import type { UpdateOrchestrationRequest } from "@/features/productTemplates/api/schema"

type UpdateOrchestrationInput = {
  templateId: string
  versionNumber: string
  body: UpdateOrchestrationRequest
}

export function useUpdateProductTemplateOrchestration() {
  return useMutation({
    mutationFn: ({
      templateId,
      versionNumber,
      body,
    }: UpdateOrchestrationInput) =>
      updateProductTemplateOrchestration(templateId, versionNumber, body),
  })
}
