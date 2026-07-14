import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  deprecateProductTemplateVersion,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import type { DeprecateTemplateVersionRequest } from "@/features/productTemplates/api/schema"

type DeprecateVersionInput = {
  templateId: string
  versionNumber: string
  body: DeprecateTemplateVersionRequest
}

export function useDeprecateProductTemplateVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId, versionNumber, body }: DeprecateVersionInput) =>
      deprecateProductTemplateVersion(templateId, versionNumber, body),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.versions(variables.templateId),
      })
    },
  })
}
