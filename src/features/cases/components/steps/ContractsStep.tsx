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
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { useCaseContracts } from "@/features/cases/hooks/useCaseContracts"
import { BulkContractImportDialog } from "@/features/cases/components/BulkContractImportDialog"
import { ManualContractEntryDialog } from "@/features/cases/components/ManualContractEntryDialog"
import { ContractDeferredStateSchema } from "@/features/cases/api/schema"

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

  const items = contracts.data?.items ?? []

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

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
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
