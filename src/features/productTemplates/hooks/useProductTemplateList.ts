import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { TemplateListResponse } from "@/features/productTemplates/api/schema"
import {
  fetchProductTemplates,
  PRODUCT_TEMPLATES_QUERY_KEYS,
} from "@/features/productTemplates/api/productTemplatesApi"
import type { ProductTemplateListParams } from "@/features/productTemplates/api/productTemplatesApi"
import { isModuleNotActiveError } from "@/features/productTemplates/utils"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useProductTemplateList(
  tenantId: string | null,
  params: ProductTemplateListParams
): UseQueryResult<TemplateListResponse, Error> {
  const normalizedParams: ProductTemplateListParams = {
    ...params,
    search:
      params.search && params.search.length >= 3 ? params.search : undefined,
  }

  return useQuery({
    queryKey: PRODUCT_TEMPLATES_QUERY_KEYS.list(tenantId, normalizedParams),
    queryFn: () => fetchProductTemplates(tenantId as string, normalizedParams),
    enabled: !!tenantId,
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
    retry: (failureCount, error) =>
      !isModuleNotActiveError(error) && failureCount < 3,
  })
}
