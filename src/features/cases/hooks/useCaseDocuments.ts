import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CASE_DOCUMENT_KEYS,
  buildCombinedDocument,
  fetchCombinedDocumentHistory,
  fetchGeneratedDocuments,
  generateCaseDocument,
} from "@/features/cases/api/casesApi"
import type { GeneratedDocumentKind } from "@/features/cases/generatedDocuments"

export function useGeneratedDocuments(caseId: string) {
  return useQuery({
    queryKey: CASE_DOCUMENT_KEYS.generated(caseId),
    queryFn: () => fetchGeneratedDocuments(caseId),
  })
}

export function useCombinedDocumentHistory(caseId: string) {
  return useQuery({
    queryKey: CASE_DOCUMENT_KEYS.combined(caseId),
    queryFn: () => fetchCombinedDocumentHistory(caseId),
  })
}

export function useGenerateCaseDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { caseId: string; kind: GeneratedDocumentKind }) =>
      generateCaseDocument(args.caseId, args.kind),
    onSuccess: (_data, { caseId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_DOCUMENT_KEYS.generated(caseId),
      })
      // A new source document makes any existing combined build stale — it was merged from the set
      // as it was. Invalidating here is what stops the panel offering a build that predates the
      // document just produced.
      void queryClient.invalidateQueries({
        queryKey: CASE_DOCUMENT_KEYS.combined(caseId),
      })
    },
  })
}

export function useBuildCombinedDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { caseId: string }) =>
      buildCombinedDocument(args.caseId),
    onSuccess: (_data, { caseId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_DOCUMENT_KEYS.combined(caseId),
      })
    },
  })
}
