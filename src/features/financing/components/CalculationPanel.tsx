import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import {
  DEFAULT_RATE_LOCK_DAYS,
  RATE_LOCK_DAY_OPTIONS,
  TREASURY_THRESHOLD_EUR,
  canEditRate,
  formatRate,
  isCommittedRateFrozen,
  isPlanFrozen,
  isRateEditable,
  isTreasuryThresholdCrossed,
  isValidRateInput,
  packageFigures,
  quotaFractionToPercent,
  quotaPercentToFraction,
} from "@/features/financing/calculationFigures"
import {
  useCommitRate,
  useContractContributions,
  useFinancing,
  useFinancingComponents,
  useOverrideQuota,
  useRecalculateFinancing,
  useSetRefinancingRate,
  useSetValueDate,
} from "@/features/financing/hooks/useFinancingCalculation"

type Props = { caseId: string }

/**
 * The case's **Calculation area** — US 1.15. Where the deal stops being the leasing company's
 * contract and becomes the bank's loan.
 *
 * ── THE QUOTA IS NOT BESIDE THE RATE, AND THAT IS DELIBERATE ───────────────────────────────────
 * The story is explicit: *"shown side by side as two percentage fields, the screen reads as a
 * choice between two methods."* They are not alternatives. The **quota decides scope** — how much
 * of the lease cash flow becomes the loan at all — and the **rate decides price**. So the rate sits
 * in the input group and the quota sits in the derivation below, where it can be seen shaping the
 * cash flow. Moving it up beside the rate would be a regression, not a tidy-up.
 *
 * ── THE RATE HAS NO DEFAULT AND NO PREFILL ─────────────────────────────────────────────────────
 * Typed per deal from the bank's own pricing tool. *"A filled field looks like a checked field and
 * a wrong rate that arrives prefilled will not be questioned."* Three decimals everywhere, because
 * the bank's system carries three and a difference in the third produces a different schedule.
 *
 * ── THE FINANCING AMOUNT IS NEVER A FIELD ──────────────────────────────────────────────────────
 * It is the present value of the quota'd cash flow, and the platform works it out. It is what the
 * whole case is about and what the Treasury threshold is measured against, which is exactly why it
 * is derived rather than typed.
 *
 * ── TWO FINAL FIGURES, NOT ONE (R4) ───────────────────────────────────────────────────────────
 * The **schedule final instalment** is the remaining balance plus the last period's interest; it
 * carries the rounding difference and closes the balance at zero. The **quota'd residual value** is
 * the residual times the quota. They differ by cents, neither is computed from the other, and they
 * are shown as two rows with two names. A single row called "final instalment" would re-create the
 * conflation the story exists to remove.
 *
 * ── WHAT IS NOT BUILT HERE, ON INSTRUCTION ─────────────────────────────────────────────────────
 * **No amortisation schedule.** 1931-OQ-03 has two contradictory client statements about the same
 * eighteen-contract case — per-contract summing versus interest on the aggregated balance — raised
 * back on 24 August 2026 and still unanswered. The story says it *"must not be built yet"*. No
 * formula is shown or edited anywhere either: the figures and the derivation path are shown, the
 * formulas are not.
 */
export function CalculationPanel({ caseId }: Props) {
  const { t } = useTranslation("financing")
  const { data: currentUser } = useCurrentUser()
  const financing = useFinancing(caseId)
  const components = useFinancingComponents(caseId)
  const contributions = useContractContributions(caseId)

  const saveRate = useSetRefinancingRate()
  const saveQuota = useOverrideQuota()
  const saveValueDate = useSetValueDate()
  const recalculate = useRecalculateFinancing()
  const commit = useCommitRate()

  const [rateDraft, setRateDraft] = useState<string | null>(null)
  const [quotaDraft, setQuotaDraft] = useState<string | null>(null)
  const [lockDays, setLockDays] = useState<number>(DEFAULT_RATE_LOCK_DAYS)

  if (financing.isLoading || components.isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  // A case whose request has not been approved has no financing at all, which is ordinary rather
  // than broken — only an approved request produces one.
  const hasNoFinancing =
    financing.isError &&
    financing.error instanceof ApiError &&
    financing.error.code === "NOT_FOUND"

  if (hasNoFinancing) {
    return (
      <Alert data-testid="calculation-no-financing">
        <AlertTitle>{t("calculation.noFinancing.title")}</AlertTitle>
        <AlertDescription>
          {t("calculation.noFinancing.description")}
        </AlertDescription>
      </Alert>
    )
  }

  if (financing.isError) {
    return (
      <p className="text-sm text-destructive" data-testid="calculation-error">
        {resolveApiErrorMessage(financing.error, t)}
      </p>
    )
  }

  if (financing.data === undefined) return null

  const record = financing.data
  const componentRows = components.data?.components ?? []
  const figures = packageFigures(componentRows)

  const mayEdit = canEditRate(currentUser?.role)
  const rateOpen = isRateEditable(record, componentRows)
  const committedFrozen = isCommittedRateFrozen(record)
  const planFrozen = isPlanFrozen(componentRows)

  // Read from the backend, never inferred from whether the rate field looks filled in (R7).
  const figuresPending = contributions.data?.figures_pending ?? true
  const thresholdCrossed = isTreasuryThresholdCrossed(figures.financingAmount)

  const currentRate = formatRate(record.refinancing_rate)
  const rateValue = rateDraft ?? currentRate ?? ""
  const quotaPercent = quotaFractionToPercent(record.effective_quota)
  const quotaValue = quotaDraft ?? quotaPercent ?? ""

  function submitRate() {
    if (!isValidRateInput(rateValue)) {
      toast.error(t("calculation.rate.invalid"))
      return
    }
    saveRate.mutate(
      { caseId, rate: rateValue.trim() },
      {
        onSuccess: () => {
          setRateDraft(null)
          toast.success(t("calculation.rate.saved"))
        },
        onError: err => showApiError(err, t),
      }
    )
  }

  function submitQuota() {
    const fraction = quotaPercentToFraction(quotaValue)
    if (fraction === null) {
      toast.error(t("calculation.quota.invalid"))
      return
    }
    saveQuota.mutate(
      { caseId, quota: fraction },
      {
        onSuccess: () => {
          setQuotaDraft(null)
          toast.success(t("calculation.quota.saved"))
        },
        onError: err => showApiError(err, t),
      }
    )
  }

  return (
    <div className="flex flex-col gap-6" data-testid="calculation-panel">
      {/* ── The inputs: the rate, and the value date. Not the quota. ── */}
      <section className="rounded-lg border p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {t("calculation.inputs.title")}
          </h3>
          <div className="flex items-center gap-2">
            {committedFrozen && (
              <Badge
                variant="secondary"
                data-testid="calculation-rate-committed"
              >
                {t("calculation.rate.committedBadge", {
                  rate: formatRate(record.committed_rate),
                  expiry: record.committed_rate_expiry
                    ? formatDate(record.committed_rate_expiry)
                    : "—",
                })}
              </Badge>
            )}
            {planFrozen && (
              <Badge variant="outline" data-testid="calculation-plan-frozen">
                {t("calculation.planFrozen")}
              </Badge>
            )}
          </div>
        </div>

        {!mayEdit && (
          /* Reading the figures is allowed for Back Office / Risk; entering the rate is the
             preparing role's alone, so the field is not rendered at all rather than rendered
             disabled — a disabled input still reads as "yours, later". */
          <p
            className="mb-3 text-xs text-muted-foreground"
            data-testid="calculation-read-only-notice"
          >
            {t("calculation.readOnlyNotice")}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="refinancing-rate" className="mb-1.5">
              {t("calculation.rate.label")}
            </Label>
            {mayEdit && rateOpen ? (
              <div className="flex items-center gap-2">
                <Input
                  id="refinancing-rate"
                  inputMode="decimal"
                  // No placeholder that looks like a value, and no default — see the note above.
                  placeholder={t("calculation.rate.placeholder")}
                  value={rateValue}
                  data-testid="calculation-rate-input"
                  onChange={e => setRateDraft(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  data-testid="calculation-rate-save"
                  disabled={saveRate.isPending || rateValue.trim() === ""}
                  onClick={submitRate}
                >
                  {t("calculation.save")}
                </Button>
              </div>
            ) : (
              <p
                className="text-sm tabular-nums"
                data-testid="calculation-rate-readonly"
              >
                {currentRate ?? t("calculation.rate.notSet")}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {t("calculation.rate.help")}
            </p>
          </div>

          <div>
            <Label className="mb-1.5">{t("calculation.valueDate.label")}</Label>
            {mayEdit && rateOpen ? (
              <DatePicker
                data-testid="calculation-value-date"
                value={record.value_date ?? undefined}
                onChange={v =>
                  v &&
                  saveValueDate.mutate(
                    { caseId, valueDate: v },
                    { onError: err => showApiError(err, t) }
                  )
                }
              />
            ) : (
              <p
                className="text-sm tabular-nums"
                data-testid="calculation-value-date-readonly"
              >
                {record.value_date ? formatDate(record.value_date) : "—"}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {t("calculation.valueDate.help")}
            </p>
          </div>
        </div>

        {mayEdit && rateOpen && (
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t pt-3">
            <div>
              <Label className="mb-1.5">{t("calculation.lock.label")}</Label>
              <div className="flex items-center gap-2">
                {/* Seven or fourteen per tenant, never longer — so these are the only two
                    choices rather than a free integer field. */}
                {RATE_LOCK_DAY_OPTIONS.map(days => (
                  <Button
                    key={days}
                    type="button"
                    size="sm"
                    variant={lockDays === days ? "default" : "outline"}
                    data-testid={`calculation-lock-${days}`}
                    onClick={() => setLockDays(days)}
                  >
                    {t("calculation.lock.days", { count: days })}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="calculation-recalculate"
                disabled={recalculate.isPending}
                onClick={() =>
                  recalculate.mutate(
                    { caseId },
                    {
                      onSuccess: () =>
                        toast.success(t("calculation.recalculated")),
                      onError: err => showApiError(err, t),
                    }
                  )
                }
              >
                {t("calculation.recalculate")}
              </Button>
              <Button
                type="button"
                size="sm"
                data-testid="calculation-commit-rate"
                disabled={commit.isPending || record.refinancing_rate === null}
                onClick={() =>
                  commit.mutate(
                    { caseId, lockDays },
                    {
                      onSuccess: () =>
                        toast.success(t("calculation.rate.committed")),
                      onError: err => showApiError(err, t),
                    }
                  )
                }
              >
                {t("calculation.commit")}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ── The derived figures ── */}
      <section
        className="rounded-lg border p-4"
        data-testid="calculation-figures"
      >
        <h3 className="mb-1 text-sm font-semibold">
          {t("calculation.figures.title")}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("calculation.figures.subtitle")}
        </p>

        {figuresPending ? (
          /* Pending rather than computed against an empty or assumed rate. Showing a zero here
             would be a figure the bank could act on. */
          <Alert data-testid="calculation-figures-pending">
            <AlertTitle>{t("calculation.figures.pending.title")}</AlertTitle>
            <AlertDescription>
              {t("calculation.figures.pending.description")}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {thresholdCrossed && (
              /* A warning, not a block: the case is flagged, the notice step becomes applicable,
                 and nothing already done is undone. */
              <Alert
                className="mb-3"
                data-testid="calculation-treasury-warning"
              >
                <AlertTitle>{t("calculation.treasury.title")}</AlertTitle>
                <AlertDescription>
                  {t("calculation.treasury.description", {
                    threshold: formatDecimalCurrency(
                      String(TREASURY_THRESHOLD_EUR),
                      EUR_CURRENCY_CODE
                    ),
                  })}
                </AlertDescription>
              </Alert>
            )}

            <dl className="flex flex-col divide-y text-sm">
              <Figure
                label={t("calculation.figures.financingAmount")}
                hint={t("calculation.figures.financingAmountHint")}
                value={figures.financingAmount}
                testId="calculation-figure-amount"
                emphasis
              />
              <Figure
                label={t("calculation.figures.runningInstalment")}
                value={figures.runningInstalment}
                testId="calculation-figure-running"
              />
              {/* Two rows, two names. Never one row called "final instalment" (R4). */}
              <Figure
                label={t("calculation.figures.scheduleFinalInstalment")}
                hint={t("calculation.figures.scheduleFinalInstalmentHint")}
                value={figures.scheduleFinalInstalment}
                testId="calculation-figure-schedule-final"
              />
              <Figure
                label={t("calculation.figures.quotadResidual")}
                hint={t("calculation.figures.quotadResidualHint")}
                value={figures.financedResidual}
                testId="calculation-figure-quotad-residual"
              />
            </dl>
          </>
        )}

        {/* The quota lives here — in the derivation, where it can be seen shaping the cash
            flow — and not beside the rate. */}
        <div className="mt-4 border-t pt-3">
          <Label htmlFor="refinancing-quota" className="mb-1.5">
            {t("calculation.quota.label")}
          </Label>
          {mayEdit && rateOpen ? (
            <div className="flex items-center gap-2">
              <Input
                id="refinancing-quota"
                inputMode="decimal"
                className="max-w-[160px]"
                value={quotaValue}
                data-testid="calculation-quota-input"
                onChange={e => setQuotaDraft(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-testid="calculation-quota-save"
                disabled={saveQuota.isPending || quotaValue.trim() === ""}
                onClick={submitQuota}
              >
                {t("calculation.quota.override")}
              </Button>
            </div>
          ) : (
            <p
              className="text-sm tabular-nums"
              data-testid="calculation-quota-readonly"
            >
              {quotaPercent !== null ? `${quotaPercent} %` : "—"}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {record.refinancing_quota_override !== null
              ? t("calculation.quota.overridden")
              : t("calculation.quota.inherited")}
          </p>
        </div>
      </section>

      {/* ── Per contract: the evidence of what was computed ── */}
      <section data-testid="calculation-per-contract">
        <h3 className="mb-1 text-sm font-semibold">
          {t("calculation.perContract.title")}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("calculation.perContract.subtitle")}
        </p>

        {componentRows.length === 0 ? (
          <p
            className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground"
            data-testid="calculation-per-contract-empty"
          >
            {t("calculation.perContract.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("calculation.perContract.columns.contract")}
                  </TableHead>
                  <TableHead>
                    {t("calculation.perContract.columns.refinanced")}
                  </TableHead>
                  <TableHead>
                    {t("calculation.perContract.columns.share")}
                  </TableHead>
                  <TableHead>
                    {t("calculation.perContract.columns.residual")}
                  </TableHead>
                  <TableHead>
                    {t("calculation.perContract.columns.calculatedAsOf")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {componentRows.map(component => {
                  const contribution = contributions.data?.contributions.find(
                    c => c.contract_id === component.contract_id
                  )
                  return (
                    <TableRow
                      key={component.id}
                      data-testid={`calculation-component-${component.contract_id}`}
                    >
                      <TableCell className="font-mono text-xs">
                        {component.contract_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {/* Only the refinanced count is on the wire. The total is not, so it is
                            not shown — see the gap noted for this story rather than inferring one. */}
                        {contribution?.refinanced_instalments ?? "—"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {component.financing_amount_share === null
                          ? "—"
                          : formatDecimalCurrency(
                              component.financing_amount_share,
                              EUR_CURRENCY_CODE
                            )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {component.financed_residual === null
                          ? "—"
                          : formatDecimalCurrency(
                              component.financed_residual,
                              EUR_CURRENCY_CODE
                            )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {component.calculated_as_of === null
                          ? "—"
                          : formatDate(component.calculated_as_of)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}

type FigureProps = {
  label: string
  hint?: string
  value: string | null
  testId: string
  emphasis?: boolean
}

function Figure({ label, hint, value, testId, emphasis }: FigureProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <dt className={emphasis ? "font-medium" : undefined}>{label}</dt>
        {hint !== undefined && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      <dd
        className={`tabular-nums ${emphasis ? "text-base font-semibold" : ""}`}
        data-testid={testId}
      >
        {value === null ? "—" : formatDecimalCurrency(value, EUR_CURRENCY_CODE)}
      </dd>
    </div>
  )
}
