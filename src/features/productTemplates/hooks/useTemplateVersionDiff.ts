import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { VersionDiffResponse } from "@/features/productTemplates/api/schema"
import {
  fetchTemplateVersionDiff,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useTemplateVersionDiff(
  templateId: string,
  fromVersion: string | null,
  toVersion: string | null
): UseQueryResult<VersionDiffResponse, Error> {
  return useQuery({
    queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.diff(
      templateId,
      fromVersion ?? "",
      toVersion ?? ""
    ),
    queryFn: () =>
      fetchTemplateVersionDiff(templateId, fromVersion ?? "", toVersion ?? ""),
    staleTime: THIRTY_SECONDS_MS,
    enabled: fromVersion !== null && toVersion !== null,
  })
}
