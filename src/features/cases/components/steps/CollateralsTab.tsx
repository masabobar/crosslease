import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, X } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
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
import { PartnerPicker } from "@/features/cases/components/steps/LesseeTab"
import {
  useAddCollateral,
  useContractCollaterals,
  useRemoveCollateral,
} from "@/features/cases/hooks/useContractCollaterals"
import {
  ContractCollateralTypeSchema,
  ObligationKindSchema,
} from "@/features/cases/api/schema"
import type {
  ContractCollateralType,
  ObligationKind,
} from "@/features/cases/api/schema"

const COLLATERAL_TYPES = ContractCollateralTypeSchema.options
const OBLIGATION_KINDS = ObligationKindSchema.options

// A party belongs to a guarantee alone — the service rejects one on the other two types and
// requires exactly one here. Naming the rule once keeps the form and the submit from drifting.
function needsParty(type: ContractCollateralType): boolean {
  return type === ContractCollateralTypeSchema.enum.GUARANTEE
}

type Props = {
  contractId: string | null
  onNeedContract: () => Promise<string | null>
}

/**
 * Manual contract entry → **Collaterals**.
 *
 * ── WHY THIS REPLACED THE GUARANTORS TAB ───────────────────────────────────────────────────────
 * The dummy's four tabs are Lessee · Objects · Collaterals · Contract details, and its Collaterals
 * table shows a `Guarantee · € 45.000 · Sofia Reinhardt` row — a security with a party on it. That
 * is `POST /contracts/{id}/collaterals`, whose own description settles the relationship: a party is
 * given **only** for a `GUARANTEE`, and `kind_of_obligation` on that collateral is what separates a
 * guarantor from a co-obligor.
 *
 * So a guarantee recorded here *is* the guarantor link (US 1.7), not a second record beside it. The
 * separate Guarantors tab was the same information reached through the narrower endpoint, and
 * keeping both would have been two places to add the same party and one of them unable to record
 * the deposit or the buy-back agreement at all.
 *
 * ── REMOVAL ASKS FOR A REASON ──────────────────────────────────────────────────────────────────
 * `CollateralRemoveRequest` requires one and the removal is soft — the history is kept. The dummy
 * draws a bare `×`, but a required field cannot be invented on the user's behalf, so the `×` opens
 * a confirm that asks for it.
 */
export function CollateralsTab({ contractId, onNeedContract }: Props) {
  const { t } = useTranslation("cases")
  const collaterals = useContractCollaterals(contractId ?? undefined)
  const add = useAddCollateral()
  const remove = useRemoveCollateral()

  const [isAdding, setAdding] = useState(false)
  const [type, setType] = useState<ContractCollateralType>(COLLATERAL_TYPES[0])
  const [kind, setKind] = useState<ObligationKind>(OBLIGATION_KINDS[0])
  const [value, setValue] = useState("")
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [reason, setReason] = useState("")

  const rows = collaterals.data?.collaterals ?? []

  function reset() {
    setAdding(false)
    setValue("")
    setType(COLLATERAL_TYPES[0])
    setKind(OBLIGATION_KINDS[0])
  }

  async function submit(partnerId?: string) {
    const id = contractId ?? (await onNeedContract())
    if (id === null) return
    add.mutate(
      {
        contractId: id,
        collateralType: type,
        value: value.trim() === "" ? null : value.trim(),
        ...(partnerId ? { existingPartnerId: partnerId } : {}),
        ...(needsParty(type) ? { kindOfObligation: kind } : {}),
      },
      { onSuccess: reset, onError: error => showApiError(error, t) }
    )
  }

  return (
    <section className="flex flex-col gap-3" data-testid="collaterals-tab">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {t("wizard.manual.collaterals.heading")}
        </h3>
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="collateral-add-button"
            onClick={() => setAdding(true)}
          >
            <Plus size={16} />
            {t("wizard.manual.collaterals.add")}
          </Button>
        )}
      </div>

      {collaterals.isLoading && <Skeleton className="h-24 w-full" />}

      {collaterals.isError && (
        <p className="text-sm text-destructive" data-testid="collateral-error">
          {resolveApiErrorMessage(collaterals.error, t)}
        </p>
      )}

      {!collaterals.isLoading && !collaterals.isError && rows.length === 0 && (
        <p
          className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground"
          data-testid="collateral-empty"
        >
          {t("wizard.manual.collaterals.empty")}
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("wizard.manual.collaterals.columns.type")}
                </TableHead>
                <TableHead>
                  {t("wizard.manual.collaterals.columns.value")}
                </TableHead>
                <TableHead>
                  {t("wizard.manual.collaterals.columns.partner")}
                </TableHead>
                <TableHead>
                  {t("wizard.manual.collaterals.columns.document")}
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow
                  key={row.collateral_id}
                  data-testid={`collateral-row-${row.collateral_id}`}
                >
                  <TableCell>
                    {t(
                      `wizard.manual.collaterals.types.${row.collateral_type}` as "wizard.manual.collaterals.types.GUARANTEE"
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDecimalCurrency(
                      row.value === null ? null : String(row.value),
                      EUR_CURRENCY_CODE
                    )}
                  </TableCell>
                  {/* The list carries the name, so unlike the contract table no per-row partner
                      fetch is needed. A deposit has no party at all — hence the dash. */}
                  <TableCell>{row.guarantor_display_name ?? "—"}</TableCell>
                  {/* The wire carries only the evidence document's id, not its name or date, so
                      this says whether one is attached rather than inventing a label for it. */}
                  <TableCell className="text-muted-foreground">
                    {row.evidence_document_id
                      ? t("wizard.manual.collaterals.evidenceAttached")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-testid={`collateral-remove-${row.collateral_id}`}
                      onClick={() => {
                        setRemovingId(row.collateral_id)
                        setReason("")
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isAdding && (
        <div
          className="flex flex-col gap-3 rounded-lg border p-4"
          data-testid="collateral-add-form"
        >
          <div>
            <Label htmlFor="collateral-type" className="mb-1.5">
              {t("wizard.manual.collaterals.columns.type")}
            </Label>
            <SelectField
              id="collateral-type"
              data-testid="collateral-type-select"
              value={type}
              onValueChange={next => setType(next as ContractCollateralType)}
              options={COLLATERAL_TYPES.map(option => ({
                value: option,
                label: t(
                  `wizard.manual.collaterals.types.${option}` as "wizard.manual.collaterals.types.GUARANTEE"
                ),
              }))}
            />
          </div>

          <div>
            <Label htmlFor="collateral-value" className="mb-1.5">
              {t("wizard.manual.collaterals.valueLabel")}
            </Label>
            <Input
              id="collateral-value"
              inputMode="decimal"
              value={value}
              data-testid="collateral-value-input"
              onChange={event => setValue(event.target.value)}
            />
          </div>

          {needsParty(type) ? (
            <>
              <div>
                <Label htmlFor="collateral-kind" className="mb-1.5">
                  {t("wizard.manual.parties.kindOfObligation")}
                </Label>
                <SelectField
                  id="collateral-kind"
                  data-testid="collateral-kind-select"
                  value={kind}
                  onValueChange={next => setKind(next as ObligationKind)}
                  options={OBLIGATION_KINDS.map(option => ({
                    value: option,
                    label: t(
                      `wizard.manual.collaterals.obligations.${option}` as "wizard.manual.collaterals.obligations.guarantee"
                    ),
                  }))}
                />
              </div>

              {/* A guarantee is saved by picking its party — that is the one required field, so
                  picking is also the submit rather than a separate button that can be forgotten. */}
              <PartnerPicker
                testIdPrefix="collateral"
                isLinking={add.isPending}
                onPick={partnerId => void submit(partnerId)}
              />
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              className="self-end"
              data-testid="collateral-save"
              disabled={add.isPending}
              onClick={() => void submit()}
            >
              {t("wizard.manual.collaterals.save")}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-end"
            data-testid="collateral-add-cancel"
            onClick={reset}
          >
            {t("wizard.actions.cancel")}
          </Button>
        </div>
      )}

      <AlertDialog
        open={removingId !== null}
        onOpenChange={open => {
          if (!open) setRemovingId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("wizard.manual.collaterals.removeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("wizard.manual.collaterals.removeDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            value={reason}
            data-testid="collateral-remove-reason"
            placeholder={t("wizard.manual.collaterals.reasonPlaceholder")}
            onChange={event => setReason(event.target.value)}
          />

          <AlertDialogFooter>
            <AlertDialogCancel>{t("wizard.actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="collateral-remove-confirm"
              disabled={
                remove.isPending ||
                reason.trim() === "" ||
                contractId === null ||
                removingId === null
              }
              onClick={() =>
                remove.mutate(
                  {
                    contractId: contractId as string,
                    collateralId: removingId as string,
                    reason: reason.trim(),
                  },
                  {
                    onSuccess: () => setRemovingId(null),
                    onError: error => showApiError(error, t),
                  }
                )
              }
            >
              {t("wizard.manual.collaterals.removeConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
