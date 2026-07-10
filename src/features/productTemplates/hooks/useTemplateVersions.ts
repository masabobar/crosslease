import { useQuery } from "@tanstack/react-query"
import {
  fetchTemplateVersions,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useTemplateVersions(templateId: string) {
  return useQuery({
    queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.versions(templateId),
    queryFn: () => fetchTemplateVersions(templateId),
    staleTime: THIRTY_SECONDS_MS,
  })
}
