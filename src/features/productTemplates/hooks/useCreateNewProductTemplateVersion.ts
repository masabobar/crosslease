import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { NewVersionCreatedResponse } from "@/features/productTemplates/api/schema"
import {
  createNewProductTemplateVersion,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"

type CreateNewVersionInput = {
  templateId: string
}

export function useCreateNewProductTemplateVersion(): UseMutationResult<
  NewVersionCreatedResponse,
  Error,
  CreateNewVersionInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ templateId }: CreateNewVersionInput) =>
      createNewProductTemplateVersion(templateId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.all,
      })
    },
  })
}
