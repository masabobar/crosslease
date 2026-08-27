import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { RuntimeRequirementSurfaceResponse } from "@/features/documentRequirements/api/schema"
import { fetchCaseDocumentRequirements } from "@/features/documentRequirements/api/documentRequirementsApi"

export const CASE_DOCUMENT_REQUIREMENT_QUERY_KEYS = {
  all: ["case-document-requirements"] as const,
  forObject: (catalogId: string, businessObjectId: string) =>
    ["case-document-requirements", catalogId, businessObjectId] as const,
} as const

// A refinancing-request case resolves its requirement set under the "submission" process context
// (the standard mandatory set the bank authored). object_type names the business object kind.
const CASE_OBJECT_TYPE = "refinancing_request"
const CASE_PROCESS_CONTEXT = "submission"

// D-11 (PRD1042-1796 item 5). Disabled until both ids exist: the catalogue is resolved from the
// bank's single catalogue (CR-DRC A2), so an absent one means the tenant has none yet rather than
// that the caller forgot to pass it.
export function useCaseDocumentRequirements(
  catalogId: string | undefined,
  businessObjectId: string | undefined
): UseQueryResult<RuntimeRequirementSurfaceResponse, Error> {
  return useQuery({
    queryKey: CASE_DOCUMENT_REQUIREMENT_QUERY_KEYS.forObject(
      catalogId ?? "",
      businessObjectId ?? ""
    ),
    queryFn: () =>
      fetchCaseDocumentRequirements(
        catalogId as string,
        businessObjectId as string,
        CASE_OBJECT_TYPE,
        CASE_PROCESS_CONTEXT
      ),
    enabled: Boolean(catalogId) && Boolean(businessObjectId),
  })
}
