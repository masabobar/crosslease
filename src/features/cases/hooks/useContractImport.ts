import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  commitContractImport,
  fetchContractImportBatch,
  uploadContractImport,
} from "@/features/cases/api/casesApi"
import type {
  ImportBatchPreviewResponse,
  ImportBatchResponse,
  ImportCommitResponse,
} from "@/features/cases/api/schema"

/**
 * Uploads a bulk contract file and returns the batch it created (US 1.5).
 *
 * Nothing is invalidated on success: the upload creates a *batch*, not contracts, so no existing
 * query's answer changed. The case's contract list is invalidated by the commit below instead.
 */
export function useUploadContractImport(): UseMutationResult<
  ImportBatchResponse,
  Error,
  { caseId: string; file: File }
> {
  return useMutation({
    mutationFn: ({ caseId, file }) => uploadContractImport(caseId, file),
  })
}

/**
 * The batch's per-row verdicts.
 *
 * `staleTime: Infinity` — a batch's assessment is fixed once made, so there is nothing to refetch;
 * re-reading it on a window focus would only re-render the same rows. A new upload creates a new
 * batch id and therefore a new cache entry.
 */
export function useContractImportBatch(
  caseId: string | undefined,
  batchId: string | undefined
) {
  return useQuery<ImportBatchPreviewResponse>({
    queryKey: CASE_QUERY_KEYS.importBatch(caseId ?? "", batchId ?? ""),
    queryFn: () =>
      fetchContractImportBatch(caseId as string, batchId as string),
    enabled: Boolean(caseId) && Boolean(batchId),
    staleTime: Infinity,
  })
}

/**
 * Commits a batch — the point at which rows become contracts.
 *
 * Invalidates the case's contract list and its totals, both of which the wizard's later steps read,
 * plus the batch itself so `rows_committed` reflects that this batch is spent.
 */
export function useCommitContractImport(): UseMutationResult<
  ImportCommitResponse,
  Error,
  { caseId: string; batchId: string }
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ caseId, batchId }) => commitContractImport(caseId, batchId),
    onSuccess: (_data, { caseId, batchId }) => {
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contracts(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.dataMeta(caseId),
      })
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.importBatch(caseId, batchId),
      })
    },
  })
}
