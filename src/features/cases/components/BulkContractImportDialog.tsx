import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DialogModal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { getContractImportCorrectionFileUrl } from "@/features/cases/api/casesApi"
import {
  useCommitContractImport,
  useContractImportBatch,
  useUploadContractImport,
} from "@/features/cases/hooks/useContractImport"
import {
  ALL_ROWS_FILTER,
  canCommitImport,
  committableRowCount,
  filterImportRows,
  importRowFilters,
  importRowReason,
  importTotals,
} from "@/features/cases/importPreview"
import { caseDisplayStatusSlug } from "@/features/cases/types"
import type { ImportBatchPreviewResponse } from "@/features/cases/api/schema"

type Props = {
  caseId: string
  onOpenChange: (open: boolean) => void
  onCommitted: () => void
}

/**
 * Bulk contract import — the design's **"MiLK file validation"** modal (`BULK.pdf`), US 1.5.
 *
 * ── "MiLK" IS A TYPO FOR BULK ──────────────────────────────────────────────────────────────────
 * The frame spells it "MiLK file validation" and its trigger "Upload MILK file", consistently. It
 * is a copy defect in the design, not a product name, so the UI here says "bulk".
 *
 * ── NOTHING IS CREATED UNTIL THE COMMIT ────────────────────────────────────────────────────────
 * Upload assesses rows; commit turns them into contracts. So abandoning the modal after an upload
 * costs nothing, and the preview is a real gate rather than a summary of work already done.
 *
 * ── TWO DESIGN ELEMENTS ARE ABSENT, ONE IS ADDED ───────────────────────────────────────────────
 * Absent: the **"Contract no." column**, because `ImportRowItem.raw_data` is an untyped object
 * whose keys are the uploaded spreadsheet's own headers — there is no stable field to read a
 * contract number from. The typed `row_number` identifies the row in the source file instead,
 * which is what makes it fixable. Absent too: **pagination**, because the wire returns every row
 * in one array with no paging parameters.
 *
 * Added: a **precondition-error state**. `precondition_error` is a whole-file refusal — no product
 * template bound, an unreadable file — and when it is set no row was assessed at all. The design
 * has no state for it, and showing an empty row table would misrepresent a rejected upload as a
 * clean one.
 */
export function BulkContractImportDialog({
  caseId,
  onOpenChange,
  onCommitted,
}: Props) {
  const { t } = useTranslation("cases")
  const [batchId, setBatchId] = useState<string | null>(null)

  const upload = useUploadContractImport()
  const batch = useContractImportBatch(caseId, batchId ?? undefined)
  const commit = useCommitContractImport()

  function handleFile(file: File) {
    upload.mutate(
      { caseId, file },
      {
        onSuccess: created => setBatchId(created.batch_id),
        onError: err => showApiError(err, t),
      }
    )
  }

  return (
    <DialogModal open onOpenChange={open => !open && onOpenChange(false)}>
      <div className="px-4 py-4">
        <DialogHeader>
          <DialogTitle>{t("wizard.bulk.title")}</DialogTitle>
          <DialogDescription>{t("wizard.bulk.subtitle")}</DialogDescription>
        </DialogHeader>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4">
        {batchId === null && (
          <div data-testid="case-wizard-bulk-upload">
            {/* The shadcn Input in file mode — there is no dedicated file-picker primitive, and
                DocumentDropzone is typed to the framework-agreement draft shape. */}
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              data-testid="case-wizard-bulk-file-input"
              disabled={upload.isPending}
              onChange={event => {
                const file = event.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {t("wizard.bulk.uploadHint")}
            </p>
          </div>
        )}

        {(upload.isPending || (batchId !== null && batch.isLoading)) && (
          <div
            className="flex flex-col gap-2"
            data-testid="case-wizard-bulk-loading"
          >
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {batch.isError && (
          <p
            className="text-sm text-destructive"
            data-testid="case-wizard-bulk-error"
          >
            {resolveApiErrorMessage(batch.error, t)}
          </p>
        )}

        {batch.data !== undefined && (
          <ImportPreview
            caseId={caseId}
            batch={batch.data}
            isCommitting={commit.isPending}
            onCommit={() =>
              commit.mutate(
                { caseId, batchId: batch.data.batch_id },
                {
                  onSuccess: result => {
                    toast.success(
                      t("wizard.bulk.committed", { count: result.committed })
                    )
                    onCommitted()
                    onOpenChange(false)
                  },
                  onError: err => showApiError(err, t),
                }
              )
            }
          />
        )}
      </div>
    </DialogModal>
  )
}

function ImportPreview({
  caseId,
  batch,
  isCommitting,
  onCommit,
}: {
  caseId: string
  batch: ImportBatchPreviewResponse
  isCommitting: boolean
  onCommit: () => void
}) {
  const { t } = useTranslation("cases")
  const [filter, setFilter] = useState<string>(ALL_ROWS_FILTER)

  /**
   * Labels a row status.
   *
   * `status` is an unconstrained string on the wire, so this is an i18n lookup with the **raw value
   * as the fallback** rather than an exhaustive map — a status the backend adds renders as itself
   * rather than disappearing. Same slug helper and same cast-plus-defaultValue shape as
   * `CaseStatusBadge`, which faces the identical problem with `display_status`.
   */
  function rowStatusLabel(status: string): string {
    if (status === ALL_ROWS_FILTER) return t("wizard.bulk.filters.all")
    return t(
      `wizard.bulk.rowStatus.${caseDisplayStatusSlug(status)}` as "wizard.bulk.rowStatus.valid",
      { defaultValue: status }
    )
  }

  // A whole-file refusal: no row was assessed, so there is no table to show and nothing to commit.
  if (batch.precondition_error !== null) {
    return (
      <Alert variant="destructive" data-testid="case-wizard-bulk-precondition">
        <AlertTitle>{t("wizard.bulk.precondition.title")}</AlertTitle>
        <AlertDescription>{batch.precondition_error}</AlertDescription>
      </Alert>
    )
  }

  const totals = importTotals(batch)
  const filters = importRowFilters(batch.rows)
  const rows = filterImportRows(batch.rows, filter)
  const committable = committableRowCount(batch)

  return (
    <div className="flex flex-col gap-4" data-testid="case-wizard-bulk-preview">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
        <Tile label={t("wizard.bulk.totals.total")} value={totals.total} />
        <Tile
          label={t("wizard.bulk.totals.valid")}
          value={totals.valid}
          tone="text-emerald-600"
        />
        <Tile
          label={t("wizard.bulk.totals.failed")}
          value={totals.failed}
          tone="text-destructive"
        />
        <Tile
          label={t("wizard.bulk.totals.held")}
          value={totals.held}
          tone="text-amber-600"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {t("wizard.bulk.view")}
        </span>
        {filters.map(entry => (
          <Button
            key={entry.key}
            type="button"
            size="sm"
            variant={filter === entry.key ? "default" : "outline"}
            data-testid={`case-wizard-bulk-filter-${entry.key}`}
            onClick={() => setFilter(entry.key)}
          >
            {`${rowStatusLabel(entry.key)} ${entry.count}`}
          </Button>
        ))}
      </div>

      <div className="max-h-[340px] overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("wizard.bulk.columns.row")}</TableHead>
              <TableHead>{t("wizard.bulk.columns.status")}</TableHead>
              <TableHead>{t("wizard.bulk.columns.reason")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow
                key={row.row_number}
                data-testid={`case-wizard-bulk-row-${row.row_number}`}
              >
                <TableCell className="tabular-nums">{row.row_number}</TableCell>
                <TableCell>
                  <Badge variant={rowStatusVariant(row.status)}>
                    {rowStatusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {importRowReason(row) ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* A plain link, not a fetch: this endpoint's body is undeclared in the contract, so the
            browser is handed the URL and deals with whatever comes back. Cookie auth makes a
            top-level navigation authenticated — the same pattern as the LC portal download. */}
        {totals.failed > 0 && (
          <a
            className={cn(buttonVariants({ variant: "outline" }))}
            href={getContractImportCorrectionFileUrl(caseId, batch.batch_id)}
            target="_blank"
            rel="noreferrer"
            data-testid="case-wizard-bulk-correction-file"
          >
            {t("wizard.bulk.downloadErrors")}
          </a>
        )}

        <Button
          type="button"
          data-testid="case-wizard-bulk-commit-button"
          disabled={isCommitting || !canCommitImport(batch)}
          onClick={onCommit}
        >
          {t("wizard.bulk.commit", { count: committable })}
        </Button>
      </div>

      {batch.rows_committed > 0 && (
        <p
          className="text-sm text-muted-foreground"
          data-testid="case-wizard-bulk-already-committed"
        >
          {t("wizard.bulk.alreadyCommitted", { count: batch.rows_committed })}
        </p>
      )}
    </div>
  )
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: string
}) {
  return (
    <div className="bg-background px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${tone ?? ""}`}>
        {value}
      </p>
    </div>
  )
}

// Green for a row that will be created, red for one that will not, amber for a duplicate that
// still will be. Unknown statuses stay neutral rather than borrowing a meaning.
function rowStatusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  const slug = caseDisplayStatusSlug(status)
  if (
    slug.includes("fail") ||
    slug.includes("error") ||
    slug.includes("reject")
  )
    return "destructive"
  if (slug.includes("duplicate") || slug.includes("held")) return "secondary"
  if (slug.includes("pass") || slug.includes("valid")) return "default"
  return "outline"
}
