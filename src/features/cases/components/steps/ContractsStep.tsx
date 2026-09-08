import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { formatDate, formatDecimalCurrency } from "@/lib/formatters"
import { toast } from "sonner"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { useCaseContracts } from "@/features/cases/hooks/useCaseContracts"
import { BulkContractImportDialog } from "@/features/cases/components/BulkContractImportDialog"
import { ManualContractEntryDialog } from "@/features/cases/components/ManualContractEntryDialog"
import { ContractDeferredStateSchema } from "@/features/cases/api/schema"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useBulkRemoveContracts } from "@/features/cases/hooks/useCaseActivity"
import {
  canRemove,
  headerCheckState,
  pruneSelection,
  toggleAll,
  toggleOne,
} from "@/features/cases/contractSelection"

type Props = {
  caseId: string
}

/**
 * Wizard step 2 — **Contracts** (`Entry route & list`). US 1.4 + US 1.5.
 *
 * ── THE ENTRY ROUTE ────────────────────────────────────────────────────────────────────────────
 * The design offers two: `+ Manual contract entry` and `Upload MILK file` (a typo for BULK, see
 * BulkContractImportDialog). Only the bulk route is built here. Manual entry is its own
 * destination — a multi-section modal covering the lessee, the objects and the terms (US 1.6–1.9,
 * `MANUAL CONTRACT ENTRY - Step 2 modal.pdf`) — so its button is present but **disabled with a
 * reason**, the same convention `StartCaseDialog` uses for the six unbuilt case types: the route is
 * visible without letting anyone walk into a dead end.
 *
 * ── THE LIST ───────────────────────────────────────────────────────────────────────────────────
 * Committed contracts only. The bulk modal's preview shows *candidate* rows; this shows what is
 * actually in the case, read from `/cases/{id}/contracts`. The design's empty state is
 * "No entered contracts", which is the state every case starts in.
 */
export function ContractsStep({ caseId }: Props) {
  const { t } = useTranslation("cases")
  const contracts = useCaseContracts(caseId)
  const [isBulkOpen, setBulkOpen] = useState(false)
  const [isManualOpen, setManualOpen] = useState(false)
  // US 1.12 — removing contracts from the request. `reason` is required by the contract, so it is
  // part of the state rather than a confirm-dialog afterthought.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState("")
  const removeContracts = useBulkRemoveContracts()

  const items = contracts.data?.items ?? []
  const ids = items.map(contract => contract.id)
  // A selection must not outlive the rows it referred to — after a removal or a refetch the ids it
  // held may be gone, and a stale id would make the header read "all selected" over fewer rows.
  const chosen = pruneSelection(selected, ids)

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="case-wizard-step-contracts"
    >
      <section className="rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">
            {t("wizard.contracts.chooseEntry")}
          </h3>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              data-testid="case-wizard-manual-entry-button"
              onClick={() => setManualOpen(true)}
            >
              <Plus size={16} />
              {t("wizard.contracts.manualEntry")}
            </Button>

            <Button
              type="button"
              variant="outline"
              data-testid="case-wizard-bulk-upload-button"
              onClick={() => setBulkOpen(true)}
            >
              <Upload size={16} />
              {t("wizard.contracts.bulkUpload")}
            </Button>
          </div>
        </div>

        {/* The route is open now; which of its four tabs are built is stated inside the modal
            rather than here, so this line names only what is still missing from it. */}
        <p
          className="mt-2 text-xs text-muted-foreground"
          data-testid="case-wizard-manual-entry-reason"
        >
          {t("wizard.contracts.manualPartial")}
        </p>
      </section>

      {contracts.isLoading && <Skeleton className="h-32 w-full" />}

      {contracts.isError && (
        <p
          className="text-sm text-destructive"
          data-testid="case-wizard-contracts-error"
        >
          {resolveApiErrorMessage(contracts.error, t)}
        </p>
      )}

      {!contracts.isLoading && !contracts.isError && items.length === 0 && (
        <p
          className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
          data-testid="case-wizard-contracts-empty"
        >
          {t("wizard.contracts.empty")}
        </p>
      )}

      {chosen.size > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3"
          data-testid="case-wizard-removal-bar"
        >
          <span className="text-sm font-medium">
            {t("wizard.contracts.selectedCount", { count: chosen.size })}
          </span>
          {/* The reason is required by BulkRemoveRequest, and rightly: the case is evidence, so a
              contract that was in the request and then was not has to say why. */}
          <Input
            value={reason}
            className="max-w-xs"
            data-testid="case-wizard-removal-reason"
            placeholder={t("wizard.contracts.removalReasonPlaceholder")}
            onChange={event => setReason(event.target.value)}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            data-testid="case-wizard-remove-selected"
            disabled={removeContracts.isPending || !canRemove(chosen, reason)}
            onClick={() =>
              removeContracts.mutate(
                {
                  caseId,
                  contractIds: [...chosen],
                  reason: reason.trim(),
                },
                {
                  onSuccess: result => {
                    toast.success(
                      t("wizard.contracts.removed", { count: result.removed })
                    )
                    setSelected(new Set())
                    setReason("")
                  },
                  onError: err => showApiError(err, t),
                }
              )
            }
          >
            {t("wizard.contracts.removeSelected")}
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  {/* BaseUI takes `indeterminate` as its own prop rather than a "mixed"
                      checked value, so the three-state result is mapped here — the pure helper
                      keeps the honest model. */}
                  <Checkbox
                    checked={headerCheckState(chosen, ids) === true}
                    indeterminate={headerCheckState(chosen, ids) === "mixed"}
                    data-testid="case-wizard-select-all"
                    onCheckedChange={() => setSelected(toggleAll(chosen, ids))}
                  />
                </TableHead>
                <TableHead>{t("wizard.contracts.columns.contract")}</TableHead>
                <TableHead>{t("wizard.contracts.columns.start")}</TableHead>
                <TableHead>{t("wizard.contracts.columns.term")}</TableHead>
                <TableHead>
                  {t("wizard.contracts.columns.instalment")}
                </TableHead>
                <TableHead>{t("wizard.contracts.columns.state")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(contract => (
                <TableRow
                  key={contract.id}
                  data-testid={`case-wizard-contract-row-${contract.id}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={chosen.has(contract.id)}
                      data-testid={`case-wizard-select-${contract.id}`}
                      onCheckedChange={() =>
                        setSelected(toggleOne(chosen, contract.id))
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {contract.leasing_company_contract_number ??
                      contract.short_name ??
                      t("wizard.contracts.unnamedContract")}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDate(contract.contract_start)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {contract.term_months === null
                      ? "—"
                      : t("wizard.contracts.termMonths", {
                          count: contract.term_months,
                        })}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDecimalCurrency(
                      contract.net_instalment,
                      EUR_CURRENCY_CODE
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contract.deferred_state ===
                        ContractDeferredStateSchema.enum.deferred
                          ? "secondary"
                          : "default"
                      }
                    >
                      {t(
                        `wizard.contracts.deferredState.${contract.deferred_state}`
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isManualOpen && (
        <ManualContractEntryDialog
          caseId={caseId}
          onOpenChange={setManualOpen}
          onSaved={() => void contracts.refetch()}
        />
      )}

      {isBulkOpen && (
        <BulkContractImportDialog
          caseId={caseId}
          onOpenChange={setBulkOpen}
          onCommitted={() => void contracts.refetch()}
        />
      )}
    </div>
  )
}
