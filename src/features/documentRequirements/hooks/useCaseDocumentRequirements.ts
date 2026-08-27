import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { RuntimeRequirementSurfaceResponse } from "@/features/documentRequirements/api/schema"
import { fetchCaseDocumentRequirements } from "@/features/documentRequirements/api/documentRequirementsApi"

export const CASE_DOCUMENT_REQUIREMENT_QUERY_KEYS = {
  all: ["case-document-requirements"] as const,
  // caseType is a trailing segment so a mutation that knows only the catalogue + object (upload,
  // review) can invalidate by the [catalogId, businessObjectId] prefix and hit every case-type
  // variant, while the surface query keys the exact tuple it reads.
  forObject: (catalogId: string, businessObjectId: string, caseType?: string) =>
    [
      "case-document-requirements",
      catalogId,
      businessObjectId,
      ...(caseType !== undefined ? [caseType] : []),
    ] as const,
} as const

// The business object kind. A case is a `refinancing_request` object regardless of its case type —
// this is the object's fixed kind, distinct from `case_type`, which is the case's own type used to
// resolve the requirement set.
const CASE_OBJECT_TYPE = "refinancing_request"

// D-11 (PRD1042-1796 item 5). The set is keyed by the case's own `case_type` (PRD1042-1794 DRC
// usability): the runtime surface returns the requirements that apply to that type. Disabled until
// all three inputs exist — the catalogue is resolved from the bank's single catalogue (CR-DRC A2),
// so an absent one means the tenant has none yet, and an absent case type means the case has not
// loaded rather than that the caller forgot to pass it.
export function useCaseDocumentRequirements(
  catalogId: string | undefined,
  businessObjectId: string | undefined,
  caseType: string | undefined
): UseQueryResult<RuntimeRequirementSurfaceResponse, Error> {
  return useQuery({
    queryKey: CASE_DOCUMENT_REQUIREMENT_QUERY_KEYS.forObject(
      catalogId ?? "",
      businessObjectId ?? "",
      caseType ?? ""
    ),
    queryFn: () =>
      fetchCaseDocumentRequirements(
        catalogId as string,
        businessObjectId as string,
        CASE_OBJECT_TYPE,
        caseType as string
      ),
    enabled:
      Boolean(catalogId) && Boolean(businessObjectId) && Boolean(caseType),
  })
}
