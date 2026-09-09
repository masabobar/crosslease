import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pencil, Plus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import { formatDecimalCurrency } from "@/lib/formatters"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { ApiError } from "@/lib/api"
import { ContractDeferredStateSchema } from "@/features/cases/api/schema"
import { useCaseContracts } from "@/features/cases/hooks/useCaseContracts"
import { useBulkRemoveContracts } from "@/features/cases/hooks/useCaseActivity"
import { ManualContractEntryDialog } from "@/features/cases/components/ManualContractEntryDialog"
import { BulkContractImportDialog } from "@/features/cases/components/BulkContractImportDialog"
import {
  canRemove,
  headerCheckState,
  pruneSelection,
  toggleAll,
  toggleOne,
} from "@/features/cases/contractSelection"
import { useFinancingOverview } from "@/features/financing/hooks/useFinancingOverview"
import { buildFinancingContractRows } from "@/features/financing/buildContractRows"

/**
 * The case workspace's **Contracts** tab — the design's financing Contracts tab
 * (.project-management/output/docs/financing-design-extract.md §8), US 1.34.
 *
 * ── IT IS THE CASE'S CONTRACT SET, AND IT IS EDITABLE ──────────────────────────────────────────
 * The dummy's Contracts tab is where a contract is entered, edited and removed: an entry button
 * above the table, a checkbox column with a bulk delete, and an `Edit` on every row.
 *
 * None of that was here, and worse, the table was driven from the financing — so on any case that
 * had not been approved yet the tab rendered "no financing yet" and showed the contract set as
 * empty even when it held rows. The case's contracts now drive the table (see
 * `buildContractRows.ts`) and the financing's share joins on where there is one.
 *
 * `Edit` opens the same four-tab modal the wizard's manual entry uses, on the existing contract —
 * every tab writes to contract-scoped endpoints, so there was no second surface to build. `Delete`
 * is `POST /cases/{id}/contracts/bulk-remove`, which requires a reason, so the reason is part of
 * the bar rather than a confirm-dialog afterthought: the case is evidence, and a contract that was
 * in the request and then was not has to say why.
 *
 * Neither is offered on a row the financing lists but the case endpoint did not return — the case
 * does not hold it, so there is nothing to edit or remove.
 *
 * ── WHERE THE DATA COMES FROM ──────────────────────────────────────────────────────────────────
 * Two list requests, joined in memory by `buildFinancingContractRows`:
 *
 *   - `GET /cases/{id}/financing/overview` → `contracts[]`, which carries each contract's share of
 *     the loan and its objects. Reused rather than re-fetched: the Data tab already loads this, so
 *     switching tabs hits the React Query cache.
 *   - `GET /cases/{id}/contracts` → the terms (start, term, instalment, residual, amortisation).
 *
 * `GET /financing/per-contract` is deliberately NOT used. Its `ContractContributionItem` is a
 * subset of the overview's `FinancingContractRef` bar `refinanced_instalments`, which this tab does
 * not show — so calling it would be a third request for nothing.
 *
 * ── TWO DESIGN COLUMNS ARE DELIBERATELY ABSENT ─────────────────────────────────────────────────
 * The Figma row shows `Lessee (+ city)` and `Object (+ plate)`. Neither is reachable without an
 * N+1: the contract carries `lessee_partner_id` as a bare UUID (no name, no city) and the plate
 * lives on `LeaseObjectRead` behind `/contracts/{id}/objects`. Per `api-first.md` §4 the answer is
 * to omit rather than ship a decorative version, so the object cell shows a count and the lessee
 * column is not rendered at all. Filed as an api-contract gap.
 *
 * ── THE STATUS COLUMN IS NARROWER THAN DRAWN ───────────────────────────────────────────────────
 * The design's Status reads `Active` / `Overdue` / `Ended`. The only enum-constrained status on the
 * wire is `ContractRead.deferred_state` (`active | deferred`), which answers a different question;
 * the `status` fields on `FinancingContractRef` and `ContractContributionItem` are unconstrained
 * strings with no declared domain. Rendering an undeclared domain as labelled UI would be inventing
 * a wire contract (`enums-and-constants.md` §2), so this shows `deferred_state` and leaves the
 * untyped one alone.
 */
export function FinancingContractsPanel({ caseId }: { caseId: string }) {
  const { t } = useTranslation("financing")
  const { t: tCases } = useTranslation("cases")
  const financing = useFinancingOverview(caseId)
  const contracts = useCaseContracts(caseId)
  const removeContracts = useBulkRemoveContracts()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState("")
  const [isEntryOpen, setEntryOpen] = useState(false)
  const [isImportOpen, setImportOpen] = useState(false)
  const [editingContractId, setEditingContractId] = useState<string | null>(
    null
  )

  // Only the contract list gates the table now. The financing is an enrichment: waiting for it
  // would hide the contract set behind a request that 404s on most cases.
  if (contracts.isLoading) {
    return (
      <div
        className="flex flex-col gap-3"
        data-testid="financing-contracts-loading"
      >
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (contracts.isError) {
    return (
      <p
        className="text-sm text-destructive"
        data-testid="financing-contracts-error"
      >
        {resolveApiErrorMessage(contracts.error, t)}
      </p>
    )
  }

  // A case without an approved decision has no financing — the ordinary state, not a fault. The
  // contract set is still the case's own, so the table renders and only the share column is blank.
  const isFinancingMissing =
    financing.isError &&
    financing.error instanceof ApiError &&
    financing.error.code === "NOT_FOUND"

  const caseContracts = contracts.data?.items ?? []
  const rows = buildFinancingContractRows(
    financing.data?.contracts ?? [],
    caseContracts
  )
  const editableIds = rows
    .filter(row => !row.termsMissing)
    .map(row => row.contractId)
  // A selection must not outlive the rows it referred to — after a removal or a refetch the ids it
  // held may be gone, and a stale id would make the header read "all selected" over fewer rows.
  const chosen = pruneSelection(selected, editableIds)

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="financing-contracts-panel"
    >
      {/* Both entry routes, as the dummy draws them above the table. The MiLK upload had been
          reachable only from wizard step 2, so a case whose contract set needed a second batch
          after submission had no way to load one from the workspace. */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          data-testid="financing-contracts-manual-entry"
          onClick={() => setEntryOpen(true)}
        >
          <Plus size={16} />
          {tCases("wizard.contracts.manualEntry")}
        </Button>
        <Button
          type="button"
          variant="outline"
          data-testid="financing-contracts-bulk-upload"
          onClick={() => setImportOpen(true)}
        >
          <Upload size={16} />
          {tCases("wizard.contracts.bulkUpload")}
        </Button>
      </div>

      {/* The financing's share column is blank until a financing exists. Said once, above the
          table, rather than repeated as a dash the reader has to interpret per row. */}
      {isFinancingMissing && rows.length > 0 && (
        <p
          className="text-sm text-muted-foreground"
          data-testid="financing-contracts-no-financing"
        >
          {t("contracts.shareUndecided")}
        </p>
      )}

      {financing.isError && !isFinancingMissing && (
        <Alert data-testid="financing-contracts-financing-error">
          <AlertTitle>{t("contracts.shareUnavailable.title")}</AlertTitle>
          <AlertDescription>
            {resolveApiErrorMessage(financing.error, t)}
          </AlertDescription>
        </Alert>
      )}

      {chosen.size > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3"
          data-testid="financing-contracts-removal-bar"
        >
          <span className="text-sm font-medium">
            {tCases("wizard.contracts.selectedCount", { count: chosen.size })}
          </span>
          <Input
            value={reason}
            className="max-w-xs"
            data-testid="financing-contracts-removal-reason"
            placeholder={tCases("wizard.contracts.removalReasonPlaceholder")}
            onChange={event => setReason(event.target.value)}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            data-testid="financing-contracts-remove-selected"
            disabled={removeContracts.isPending || !canRemove(chosen, reason)}
            onClick={() =>
              removeContracts.mutate(
                { caseId, contractIds: [...chosen], reason: reason.trim() },
                {
                  onSuccess: result => {
                    toast.success(
                      tCases("wizard.contracts.removed", {
                        count: result.removed,
                      })
                    )
                    setSelected(new Set())
                    setReason("")
                  },
                  onError: err => showApiError(err, tCases),
                }
              )
            }
          >
            <Trash2 size={14} />
            {tCases("wizard.contracts.removeSelected")}
          </Button>
          {/* The dummy pairs the delete with a Cancel that clears the selection rather than
              leaving the bar as the only way out of it. */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="financing-contracts-clear-selection"
            onClick={() => {
              setSelected(new Set())
              setReason("")
            }}
          >
            {tCases("wizard.actions.cancel")}
          </Button>
        </div>
      )}

      {/* `total` is the server's count for the whole set; if it exceeds the page this tab asked
          for, the rows below are incomplete and saying so beats a silently short table. */}
      {contracts.data !== undefined &&
        contracts.data.total > contracts.data.items.length && (
          <Alert data-testid="financing-contracts-truncated">
            <AlertTitle>{t("contracts.truncated.title")}</AlertTitle>
            <AlertDescription>
              {t("contracts.truncated.description", {
                shown: contracts.data.items.length,
                total: contracts.data.total,
              })}
            </AlertDescription>
          </Alert>
        )}

      {rows.length === 0 ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="financing-contracts-empty"
        >
          {t("contracts.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  {/* BaseUI takes `indeterminate` as its own prop rather than a "mixed" checked
                      value, so the three-state result is mapped here. */}
                  <Checkbox
                    checked={headerCheckState(chosen, editableIds) === true}
                    indeterminate={
                      headerCheckState(chosen, editableIds) === "mixed"
                    }
                    disabled={editableIds.length === 0}
                    data-testid="financing-contracts-select-all"
                    onCheckedChange={() =>
                      setSelected(toggleAll(chosen, editableIds))
                    }
                  />
                </TableHead>
                {/* The dummy's four: contract, term, objects — then the two figures no other
                    surface in this app shows. Start date, instalment and residual value are gone
                    from here; they are on the contract's own Contract details tab, which the row's
                    Edit opens, so the table no longer repeats them. */}
                <TableHead>{t("contracts.columns.contract")}</TableHead>
                <TableHead>{t("contracts.columns.term")}</TableHead>
                <TableHead>{t("contracts.columns.objects")}</TableHead>
                <TableHead>{t("contracts.columns.share")}</TableHead>
                <TableHead>{t("contracts.columns.state")}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow
                  key={row.contractId}
                  data-testid={`financing-contract-row-${row.contractId}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={chosen.has(row.contractId)}
                      /* A row the financing lists but the case does not hold cannot be removed —
                         the bulk-remove endpoint is case-scoped. */
                      disabled={row.termsMissing}
                      data-testid={`financing-contracts-select-${row.contractId}`}
                      onCheckedChange={() =>
                        setSelected(toggleOne(chosen, row.contractId))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {row.contractNumber ?? t("contracts.unnamedContract")}
                    </span>
                    {/* The design puts type · amortisation beneath the number. Both are
                        unconstrained strings on the wire, so they render as sent. */}
                    {(row.contractType !== null ||
                      row.amortisationType !== null) && (
                      <span className="block text-xs text-muted-foreground">
                        {[row.contractType, row.amortisationType]
                          .filter(value => value !== null)
                          .join(" · ")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.termMonths === null
                      ? "—"
                      : t("contracts.termMonths", { count: row.termMonths })}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.objectCount === null
                      ? "—"
                      : t("contracts.objectCount", { count: row.objectCount })}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDecimalCurrency(
                      row.financingAmountShare,
                      EUR_CURRENCY_CODE
                    )}
                  </TableCell>
                  <TableCell>
                    {row.termsMissing ? (
                      <Badge variant="outline">
                        {t("contracts.termsMissing")}
                      </Badge>
                    ) : row.deferredState === null ? (
                      "—"
                    ) : (
                      <Badge
                        variant={
                          row.deferredState ===
                          ContractDeferredStateSchema.enum.deferred
                            ? "secondary"
                            : "default"
                        }
                      >
                        {t(`contracts.deferredState.${row.deferredState}`)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!row.termsMissing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        data-testid={`financing-contracts-edit-${row.contractId}`}
                        onClick={() => setEditingContractId(row.contractId)}
                      >
                        <Pencil size={14} />
                        {tCases("wizard.contracts.edit")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isImportOpen && (
        <BulkContractImportDialog
          caseId={caseId}
          onOpenChange={setImportOpen}
          onCommitted={() => setImportOpen(false)}
        />
      )}

      {isEntryOpen && (
        <ManualContractEntryDialog
          caseId={caseId}
          onOpenChange={setEntryOpen}
          onSaved={() => setEntryOpen(false)}
        />
      )}

      {editingContractId !== null && (
        <ManualContractEntryDialog
          caseId={caseId}
          contractId={editingContractId}
          onOpenChange={open => !open && setEditingContractId(null)}
          onSaved={() => setEditingContractId(null)}
        />
      )}
    </div>
  )
}
