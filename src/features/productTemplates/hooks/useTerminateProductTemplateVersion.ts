import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  terminateProductTemplateVersion,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import type { TerminateTemplateVersionRequest } from "@/features/productTemplates/api/schema"

type TerminateVersionInput = {
  templateId: string
  versionNumber: string
  body: TerminateTemplateVersionRequest
}

export function useTerminateProductTemplateVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId, versionNumber, body }: TerminateVersionInput) =>
      terminateProductTemplateVersion(templateId, versionNumber, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.all,
      })
    },
  })
}
