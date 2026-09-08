import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"
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
import { formatDate, formatDecimalCurrency } from "@/lib/formatters"
import { ApiError } from "@/lib/api"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { caseDisplayStatusSlug } from "@/features/cases/types"
import {
  useGeneratePaymentPlan,
  usePaymentPlan,
  useSetManualPaymentPlan,
} from "@/features/cases/hooks/usePaymentPlan"
import {
  EMPTY_PLAN_ROW,
  canSavePlan,
  invalidRowIndexes,
  sumPlanRows,
  toPlanRowDrafts,
} from "@/features/cases/paymentPlanRows"
import type { PlanRowDraft } from "@/features/cases/paymentPlanRows"

type Props = {
  caseId: string
  contractId: string | null
}

/**
 * Manual contract entry → **Cash flow** tab (US 1.11) — the contract's payment plan.
 *
 * ── TWO WAYS A PLAN EXISTS, AND THE DIFFERENCE MATTERS ─────────────────────────────────────────
 * `POST .../payment-plan/generate` derives it from the contract's terms; `PUT .../payment-plan`
 * replaces it with hand-entered rows. Each entry carries an `origin` saying which it was, and that
 * is surfaced rather than hidden: the calculation specification's premise is that *"the schedule is
 * what the lessor receives"*, so which lines a human typed is evidence, not a detail.
 *
 * ── THE TOTAL IS SUMMED IN CENTS, NOT IN FLOATS ────────────────────────────────────────────────
 * The spec states amounts *"are decimal strings on purpose — do not parse them into binary
 * floats"*, and its acceptance gate is 0.02 EUR on the present value. So `sumPlanRows` works in
 * integer cents. This is the screen where that rule earns its keep.
 *
 * ── WHAT THE ARITHMETIC HERE IS NOT ────────────────────────────────────────────────────────────
 * No discounting, no annuity, no broken-period factor. All of that is the engine's, server-side —
 * the spec's own reproduction page warns that its JavaScript "nudges values before rounding" and
 * says explicitly not to copy the trick. This tab records and totals a schedule; it never computes
 * one.
 */
export function CashFlowTab({ caseId, contractId }: Props) {
  const { t } = useTranslation("cases")
  const plan = usePaymentPlan(caseId, contractId ?? undefined)
  const generate = useGeneratePaymentPlan()
  const save = useSetManualPaymentPlan()
  const [draft, setDraft] = useState<PlanRowDraft[] | null>(null)

  if (contractId === null) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="cash-flow-no-contract"
      >
        {t("wizard.manual.cashFlow.noContract")}
      </p>
    )
  }

  if (plan.isLoading) return <Skeleton className="h-56 w-full" />

  // A contract without a financing component has no plan yet. That is ordinary on a request still
  // being assembled, so it reads as a starting point rather than as breakage.
  const hasNoPlan =
    plan.isError &&
    plan.error instanceof ApiError &&
    plan.error.code === "NOT_FOUND"

  if (plan.isError && !hasNoPlan) {
    return (
      <p className="text-sm text-destructive" data-testid="cash-flow-error">
        {resolveApiErrorMessage(plan.error, t)}
      </p>
    )
  }

  const entries = plan.data?.entries ?? []
  const rows = draft ?? toPlanRowDrafts(entries)
  const invalid = new Set(invalidRowIndexes(rows))
  const isEditing = draft !== null

  function update(index: number, patch: Partial<PlanRowDraft>) {
    setDraft(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <div className="flex flex-col gap-4" data-testid="cash-flow-tab">
      {hasNoPlan && (
        <Alert data-testid="cash-flow-none">
          <AlertTitle>{t("wizard.manual.cashFlow.none.title")}</AlertTitle>
          <AlertDescription>
            {t("wizard.manual.cashFlow.none.description")}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <span className="text-muted-foreground">
            {t("wizard.manual.cashFlow.total")}
          </span>{" "}
          <span className="font-semibold tabular-nums">
            {formatDecimalCurrency(sumPlanRows(rows), EUR_CURRENCY_CODE)}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {t("wizard.manual.cashFlow.rowCount", { count: rows.length })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="cash-flow-generate"
            disabled={generate.isPending}
            onClick={() =>
              generate.mutate(
                { caseId, contractId },
                {
                  onSuccess: () => setDraft(null),
                  onError: err => showApiError(err, t),
                }
              )
            }
          >
            {t("wizard.manual.cashFlow.generate")}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="cash-flow-add-row"
            onClick={() => setDraft([...rows, { ...EMPTY_PLAN_ROW }])}
          >
            <Plus size={16} />
            {t("wizard.manual.cashFlow.addRow")}
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p
          className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
          data-testid="cash-flow-empty"
        >
          {t("wizard.manual.cashFlow.empty")}
        </p>
      ) : (
        <div className="max-h-[320px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("wizard.manual.cashFlow.columns.period")}
                </TableHead>
                <TableHead>
                  {t("wizard.manual.cashFlow.columns.dueDate")}
                </TableHead>
                <TableHead>
                  {t("wizard.manual.cashFlow.columns.type")}
                </TableHead>
                <TableHead>
                  {t("wizard.manual.cashFlow.columns.amount")}
                </TableHead>
                <TableHead>
                  {t("wizard.manual.cashFlow.columns.isFinal")}
                </TableHead>
                <TableHead>
                  {t("wizard.manual.cashFlow.columns.origin")}
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={`${index}-${row.due_date}`}
                  data-testid={`cash-flow-row-${index}`}
                >
                  <TableCell className="tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={row.due_date}
                        placeholder="YYYY-MM-DD"
                        data-testid={`cash-flow-date-${index}`}
                        onChange={e =>
                          update(index, { due_date: e.target.value })
                        }
                      />
                    ) : (
                      <span className="tabular-nums">
                        {formatDate(row.due_date)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* The design names three types — Down payment, Installment, Final payment.
                        The wire carries no type, only `is_final`, so the two that boolean actually
                        determines are shown and a down payment is not inferred: nothing on the
                        entry distinguishes one from an instalment. */}
                    <span className="text-xs text-muted-foreground">
                      {t(
                        row.is_final
                          ? "wizard.manual.cashFlow.types.finalPayment"
                          : "wizard.manual.cashFlow.types.instalment"
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={row.amount}
                        inputMode="decimal"
                        data-testid={`cash-flow-amount-${index}`}
                        onChange={e =>
                          update(index, { amount: e.target.value })
                        }
                      />
                    ) : (
                      <span className="tabular-nums">
                        {formatDecimalCurrency(row.amount, EUR_CURRENCY_CODE)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={row.is_final}
                      disabled={!isEditing}
                      data-testid={`cash-flow-final-${index}`}
                      onCheckedChange={v =>
                        update(index, { is_final: v === true })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {/* Where the line came from. Unconstrained on the wire, so the label falls
                        back to the raw value rather than pretending to know the set. */}
                    {entries[index] !== undefined && !isEditing ? (
                      <Badge variant="outline">
                        {t(
                          `wizard.manual.cashFlow.origin.${caseDisplayStatusSlug(entries[index].origin)}` as "wizard.manual.cashFlow.origin.generated",
                          { defaultValue: entries[index].origin }
                        )}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("wizard.manual.cashFlow.origin.manual")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        data-testid={`cash-flow-remove-${index}`}
                        onClick={() =>
                          setDraft(rows.filter((_r, i) => i !== index))
                        }
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isEditing && (
        <div className="flex flex-col gap-2">
          {invalid.size > 0 && (
            <p
              className="text-xs text-destructive"
              data-testid="cash-flow-invalid-rows"
            >
              {t("wizard.manual.cashFlow.invalidRows", {
                rows: [...invalid].map(i => i + 1).join(", "),
              })}
            </p>
          )}

          {/* A plan with no final line never closes, and two make maturity ambiguous. `is_final`
              is a required boolean on the wire for exactly that reason. */}
          {invalid.size === 0 && !canSavePlan(rows) && (
            <p
              className="text-xs text-destructive"
              data-testid="cash-flow-final-rule"
            >
              {t("wizard.manual.cashFlow.finalRule")}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              data-testid="cash-flow-cancel"
              onClick={() => setDraft(null)}
            >
              {t("wizard.actions.cancel")}
            </Button>
            <Button
              type="button"
              data-testid="cash-flow-save"
              disabled={save.isPending || !canSavePlan(rows)}
              onClick={() =>
                save.mutate(
                  { caseId, contractId, rows },
                  {
                    onSuccess: () => setDraft(null),
                    onError: err => showApiError(err, t),
                  }
                )
              }
            >
              {t("wizard.manual.cashFlow.save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
