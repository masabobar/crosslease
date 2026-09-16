import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  SquarePen,
  Trash2,
  Upload,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationEllipsis } from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { buildPageNumbers } from "@/lib/pagination"
import { useCaseContracts } from "@/features/cases/hooks/useCaseContracts"
import { useContractObjectCounts } from "@/features/cases/hooks/useContractObjectCounts"
import { usePartnersByIds } from "@/features/partners/hooks/usePartnersByIds"
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

// The dummy shows a short page under a `Previous 1 2 3 … Next` pager, which is also what keeps the
// per-row lessee and object lookups from firing in a burst — they are bounded by this number.
const CONTRACT_PAGE_SIZE = 5

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
  const [page, setPage] = useState(1)
  const contracts = useCaseContracts(caseId, {
    limit: CONTRACT_PAGE_SIZE,
    offset: (page - 1) * CONTRACT_PAGE_SIZE,
  })
  const [isBulkOpen, setBulkOpen] = useState(false)
  const [isManualOpen, setManualOpen] = useState(false)
  // The dummy's per-row `Edit` opens the same modal the entry button does, pointed at an existing
  // contract — `ManualContractEntryDialog` already takes a `contractId` for exactly this.
  const [editingContractId, setEditingContractId] = useState<string | null>(
    null
  )
  // US 1.12 — removing contracts from the request. `reason` is required by the contract, so it is
  // part of the state rather than a confirm-dialog afterthought.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState("")
  const [isConfirmingRemoval, setConfirmingRemoval] = useState(false)
  const removeContracts = useBulkRemoveContracts()

  const items = contracts.data?.items ?? []
  const ids = items.map(contract => contract.id)

  // The two columns the dummy shows that `ContractRead` does not carry. Both are resolved for the
  // rows on this page only — see the hooks' own notes on why that bound matters.
  const { partnersById } = usePartnersByIds(
    items
      .map(contract => contract.lessee_partner_id)
      .filter((id): id is string => id !== null)
  )
  const { countsById } = useContractObjectCounts(ids)

  // The party a new contract starts on. `/cases/{id}/contracts` answers in insertion order and
  // carries no created_at, so "the last one that has a lessee" is the closest thing to "the one
  // entered most recently" the wire supports — and on a request that is one leasing company's book
  // it is almost always the right guess anyway.
  const inheritedLesseePartnerId = items.findLast(
    contract => contract.lessee_partner_id !== null
  )?.lessee_partner_id

  const total = contracts.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / CONTRACT_PAGE_SIZE))
  const pageNumbers = contracts.data ? buildPageNumbers(page, totalPages) : []
  // A selection must not outlive the rows it referred to — after a removal or a refetch the ids it
  // held may be gone, and a stale id would make the header read "all selected" over fewer rows.
  const chosen = pruneSelection(selected, ids)

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="case-wizard-step-contracts"
    >
      {/* One card, as the dummy has it: the entry route and the list it produces are the same
          decision, and two stacked boxes read as two unrelated ones. */}
      <section className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
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

        {contracts.isLoading && <Skeleton className="mx-4 mb-4 h-32" />}

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

        {/* The dummy asks before removing and names what goes — "N contracts will be removed from
          this request." A reason field beside a button is a form, not a confirmation: it says what
          to record, never that anything is about to be destroyed. */}
        <AlertDialog
          open={isConfirmingRemoval}
          onOpenChange={open => !open && setConfirmingRemoval(false)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("wizard.contracts.confirmRemoval.title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("wizard.contracts.confirmRemoval.description", {
                  count: chosen.size,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Required by `BulkRemoveRequest`, and rightly: the case is evidence, so a contract
                that was in the request and then was not has to say why. */}
            <Input
              value={reason}
              data-testid="case-wizard-removal-reason"
              placeholder={t("wizard.contracts.removalReasonPlaceholder")}
              onChange={event => setReason(event.target.value)}
            />

            <AlertDialogFooter>
              <AlertDialogCancel data-testid="case-wizard-removal-keep">
                {t("wizard.actions.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                data-testid="case-wizard-removal-confirm"
                disabled={
                  removeContracts.isPending || !canRemove(chosen, reason)
                }
                onClick={() =>
                  removeContracts.mutate(
                    { caseId, contractIds: [...chosen], reason: reason.trim() },
                    {
                      onSuccess: result => {
                        toast.success(
                          t("wizard.contracts.removed", {
                            count: result.removed,
                          })
                        )
                        setSelected(new Set())
                        setReason("")
                        setConfirmingRemoval(false)
                      },
                      onError: err => {
                        showApiError(err, t)
                        setConfirmingRemoval(false)
                      },
                    }
                  )
                }
              >
                {t("wizard.contracts.removeSelected")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {items.length > 0 && (
          <div className="overflow-x-auto border-t">
            {/* The dummy puts the selection bar INSIDE the card, directly above the header row, so
                it reads as a state of this table rather than as a second box floating above it. It
                carries no reason field: `BulkRemoveRequest` requires one, but a text input beside a
                delete button is a form, and the place to say why something is being destroyed is
                the confirmation that says it is about to be. */}
            {chosen.size > 0 && (
              <div
                className="flex flex-wrap items-center justify-between gap-2 border-b bg-primary/5 px-4 py-2.5"
                data-testid="case-wizard-removal-bar"
              >
                <span className="text-sm font-medium text-primary">
                  {t("wizard.contracts.selectedCount", { count: chosen.size })}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    data-testid="case-wizard-remove-selected"
                    disabled={removeContracts.isPending}
                    onClick={() => {
                      setReason("")
                      setConfirmingRemoval(true)
                    }}
                  >
                    <Trash2 size={14} />
                    {t("wizard.contracts.removeSelected")}
                  </Button>
                  {/* Clears the selection, so getting out of the bar does not mean unticking rows
                      one at a time. */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="case-wizard-clear-selection"
                    onClick={() => setSelected(new Set())}
                  >
                    {t("wizard.actions.cancel")}
                  </Button>
                </div>
              </div>
            )}

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
                      onCheckedChange={() =>
                        setSelected(toggleAll(chosen, ids))
                      }
                    />
                  </TableHead>
                  <TableHead>
                    {t("wizard.contracts.columns.contractLessee")}
                  </TableHead>
                  <TableHead>{t("wizard.contracts.columns.term")}</TableHead>
                  <TableHead>{t("wizard.contracts.columns.objects")}</TableHead>
                  <TableHead className="w-24" />
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
                    {/* Two lines, as the dummy has it: who the contract is with, and what kind of
                      contract it is. The lessee's legal name is the useful identifier here — the
                      LC's own contract number means nothing to a bank reader — so it leads, and
                      falls back to the number only when no lessee has been captured yet. */}
                    <TableCell>
                      <span className="block font-medium">
                        {(contract.lessee_partner_id
                          ? partnersById.get(contract.lessee_partner_id)
                              ?.display_name
                          : null) ??
                          contract.leasing_company_contract_number ??
                          contract.short_name ??
                          t("wizard.contracts.unnamedContract")}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        {contract.contract_type
                          ? t(
                              `wizard.contracts.contractType.${contract.contract_type}` as "wizard.contracts.contractType.lease"
                            )
                          : "—"}
                        {/* The dummy has no State column, but a deferred contract is excluded from
                          the financing — dropping the column must not drop that fact, so it rides
                          on the row it describes and stays silent on the default state. */}
                        {contract.deferred_state ===
                          ContractDeferredStateSchema.enum.deferred && (
                          <Badge variant="secondary">
                            {t("wizard.contracts.deferredState.deferred")}
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {contract.term_months === null
                        ? "—"
                        : t("wizard.contracts.termMonths", {
                            count: contract.term_months,
                          })}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {countsById.get(contract.id) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid={`case-wizard-edit-contract-${contract.id}`}
                        onClick={() => setEditingContractId(contract.id)}
                      >
                        <SquarePen size={14} />
                        {t("wizard.contracts.edit")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div
                className="flex items-center justify-center gap-1 border-t px-3 py-2"
                data-testid="case-wizard-contracts-pager"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page === 1}
                  data-testid="case-wizard-contracts-prev"
                  onClick={() => setPage(current => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={16} />
                  {t("wizard.contracts.previous")}
                </Button>

                {pageNumbers.map((item, index) =>
                  item === "..." ? (
                    <PaginationEllipsis key={`gap-${index}`} />
                  ) : (
                    <Button
                      key={item}
                      type="button"
                      size="sm"
                      variant={item === page ? "outline" : "ghost"}
                      data-testid={`case-wizard-contracts-page-${item}`}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </Button>
                  )
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page === totalPages}
                  data-testid="case-wizard-contracts-next"
                  onClick={() =>
                    setPage(current => Math.min(totalPages, current + 1))
                  }
                >
                  {t("wizard.contracts.next")}
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {isManualOpen && (
        <ManualContractEntryDialog
          caseId={caseId}
          inheritedLesseePartnerId={inheritedLesseePartnerId ?? undefined}
          onOpenChange={setManualOpen}
          onSaved={() => void contracts.refetch()}
        />
      )}

      {editingContractId !== null && (
        <ManualContractEntryDialog
          caseId={caseId}
          contractId={editingContractId}
          onOpenChange={open => {
            if (!open) setEditingContractId(null)
          }}
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
