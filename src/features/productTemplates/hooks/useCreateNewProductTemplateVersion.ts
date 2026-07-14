import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createNewProductTemplateVersion,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import type { CreateNewVersionRequest } from "@/features/productTemplates/api/schema"

type CreateNewVersionInput = {
  templateId: string
  body: CreateNewVersionRequest
}

export function useCreateNewProductTemplateVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId, body }: CreateNewVersionInput) =>
      createNewProductTemplateVersion(templateId, body),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.versions(variables.templateId),
      })
    },
  })
}
