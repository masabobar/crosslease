import { useQuery } from "@tanstack/react-query"
import {
  fetchTemplateVersionHeader,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useTemplateVersionHeader(
  templateId: string,
  versionNumber: string | null
) {
  return useQuery({
    queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.versionDetail(
      templateId,
      versionNumber ?? ""
    ),
    queryFn: () => fetchTemplateVersionHeader(templateId, versionNumber ?? ""),
    staleTime: THIRTY_SECONDS_MS,
    enabled: versionNumber !== null,
  })
}
