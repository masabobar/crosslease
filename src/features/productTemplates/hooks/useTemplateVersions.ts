import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { VersionHistoryResponse } from "@/features/productTemplates/api/schema"
import {
  fetchTemplateVersions,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useTemplateVersions(
  templateId: string
): UseQueryResult<VersionHistoryResponse, Error> {
  return useQuery({
    queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.versions(templateId),
    queryFn: () => fetchTemplateVersions(templateId),
    staleTime: THIRTY_SECONDS_MS,
    // The caller passes `templateId ?? ""` for a route param that failed its UUID guard and
    // renders not-found afterwards — without this the query would still fire a request at
    // `/product-templates//versions` first.
    enabled: !!templateId,
  })
}
