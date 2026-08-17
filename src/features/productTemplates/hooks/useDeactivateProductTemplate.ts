import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type {
  DeactivateProductTemplateRequest,
  ProductStatusResponse,
} from "@/features/productTemplates/api/schema"
import {
  deactivateProductTemplate,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"

type DeactivateProductTemplateInput = {
  templateId: string
  body: DeactivateProductTemplateRequest
}

export function useDeactivateProductTemplate(): UseMutationResult<
  ProductStatusResponse,
  Error,
  DeactivateProductTemplateInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId, body }: DeactivateProductTemplateInput) =>
      deactivateProductTemplate(templateId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.all,
      })
    },
  })
}
