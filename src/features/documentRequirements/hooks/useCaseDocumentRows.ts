import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import {
  DOCUMENT_REQUIREMENT_QUERY_KEYS,
  fetchCaseDocuments,
} from "@/features/documentRequirements/api/documentRequirementsApi"
import type { CaseDocumentListResponse } from "@/features/documentRequirements/api/schema"

/**
 * The case's documents grouped by the requirement they are filed against.
 *
 * Paired with `useCaseDocumentRequirements`, never a replacement for it: the requirement surface
 * says what is required and what blocks, this says who each document belongs to and which files
 * have actually been filed. The design's Party and Files columns need both.
 */
export function useCaseDocumentRows(
  caseId: string | undefined
): UseQueryResult<CaseDocumentListResponse, Error> {
  return useQuery({
    queryKey: DOCUMENT_REQUIREMENT_QUERY_KEYS.caseDocuments(caseId ?? ""),
    queryFn: () => fetchCaseDocuments(caseId as string),
    enabled: Boolean(caseId),
  })
}
