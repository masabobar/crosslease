import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { TemplateVersionDetail } from "@/features/productTemplates/api/schema"
import {
  fetchTemplateVersionDetail,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useTemplateVersionDetail(
  templateId: string,
  versionNumber: string | null
): UseQueryResult<TemplateVersionDetail, Error> {
  return useQuery({
    queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.versionDetail(
      templateId,
      versionNumber ?? ""
    ),
    queryFn: () => fetchTemplateVersionDetail(templateId, versionNumber ?? ""),
    staleTime: THIRTY_SECONDS_MS,
    enabled: versionNumber !== null,
  })
}
