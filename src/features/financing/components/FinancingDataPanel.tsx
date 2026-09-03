import { useTranslation } from "react-i18next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  formatDate,
  formatDateTime,
  formatDecimalCurrency,
  formatDecimalPercent,
} from "@/lib/formatters"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { ApiError } from "@/lib/api"
import { useFinancingOverview } from "@/features/financing/hooks/useFinancingOverview"
import { useFinancingRemainingBalance } from "@/features/financing/hooks/useFinancingRemainingBalance"
import {
  covenantStateBadgeVariant,
  financingStatusBadgeVariant,
} from "@/features/financing/types"

// Rates are priced to a basis point, so the refinancing rate renders to three decimals — matching
// both the design's "4,650 %" and the spec's rate precision. Quotas and ratios keep two.
const RATE_FRACTION_DIGITS = 3

/**
 * The case workspace's **Data** tab — the design's financing Data tab
 * (.project-management/output/docs/financing-design-extract.md §8).
 *
 * ── WHAT IS HERE, AND WHAT THE DESIGN SHOWS THAT IS NOT ────────────────────────────────────────
 * Built from `GET /cases/{id}/financing/overview` + `/remaining-balance`, which between them back
 * the hero band, the pricing figures, the covenant list and the traceability row.
 *
 * Four things the Figma frame shows are **deliberately absent**, because no endpoint carries them
 * and `api-first.md` §4 forbids shipping a decorative version ("fake UI misleads reviewers into
 * thinking the feature works"):
 *
 *   1. The **REPAYMENT card** — installment amount, "installment 11 of 12", repayment start, final
 *      installment, final maturity. None of these exist in the contract.
 *   2. The **Repayment Schedule** table — the API's only cash-flow shape is
 *      `RefinancedCashFlowLine {due_date, amount}` per contract, with no principal / interest /
 *      closing-balance split, so the design's five columns cannot be populated from three.
 *   3. The **Sollbelastung / Habenbelastung** table — neither field exists anywhere in the API.
 *   4. `Lock period`, `rate quoted on`, `payout to net acquisition cost`, `interest over the term`.
 *
 * Conversely, two contract fields the design never shows are surfaced here because ignoring them
 * would present a provisional or unauthorised figure as final: `figures_pending` and
 * `bank_figures_visible`. See the gate below.
 *
 * ── COVENANTS (Q-008 RESOLVED) ─────────────────────────────────────────────────────────────────
 * Covenants were held back from the workspace while their placement was open — the design put them
 * on the case, the spec on the financing. The contract settles it: `covenants` and
 * `open_covenant_count` hang off the **financing overview**, which is what the spec said (§5.13,
 * D-37). They render here, not on the case.
 */
export function FinancingDataPanel({ caseId }: { caseId: string }) {
  const { t } = useTranslation("financing")
  const { data, isLoading, isError, error } = useFinancingOverview(caseId)

  // Gated on the same flag that decides whether figures may be shown at all — asking for a balance
  // the caller cannot see would 403 on every render.
  const balance = useFinancingRemainingBalance(
    caseId,
    data?.bank_figures_visible === true
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" data-testid="financing-data-loading">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  // A case only has a financing once its request is approved, so NOT_FOUND is an ordinary state —
  // the great majority of cases will sit here — and must not read as breakage. Matched on `code`
  // rather than a status: `ApiError` carries no status, and CLAUDE.md requires code-based handling.
  if (isError && error instanceof ApiError && error.code === "NOT_FOUND") {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="financing-data-none"
      >
        {t("data.noFinancing")}
      </p>
    )
  }

  if (isError || !data) {
    return (
      <p
        className="text-sm text-destructive"
        data-testid="financing-data-error"
      >
        {resolveApiErrorMessage(error, t)}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6" data-testid="financing-data-panel">
      {/* Two independent reasons a figure on this screen may not be trustworthy, so two separate
          notices rather than one combined "data may be stale". */}
      {data.figures_pending && (
        <Alert data-testid="financing-figures-pending">
          <AlertTitle>{t("data.figuresPending.title")}</AlertTitle>
          <AlertDescription>
            {t("data.figuresPending.description")}
          </AlertDescription>
        </Alert>
      )}

      <section
        className="rounded-lg border bg-sky-50 p-6 dark:bg-sky-950/40"
        data-testid="financing-hero"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              {t("data.hero.outstandingBalance")}
            </p>
            <p
              className="text-2xl font-semibold tabular-nums"
              data-testid="financing-outstanding-balance"
            >
              {data.bank_figures_visible
                ? formatDecimalCurrency(
                    balance.data?.remaining_balance ?? null,
                    EUR_CURRENCY_CODE
                  )
                : t("data.hero.figuresHidden")}
            </p>
            {/* A computed balance without its as-of date cannot be reconciled against anything,
                so the date travels with the figure rather than sitting in a caption. */}
            {balance.data && (
              <p className="text-xs text-muted-foreground">
                {t("data.hero.asOf", { date: formatDate(balance.data.as_of) })}
              </p>
            )}
            {data.loan_number !== null && (
              <p className="text-xs text-muted-foreground">
                {t("data.hero.loanNumber", { number: data.loan_number })}
              </p>
            )}
            {data.loan_account !== null && (
              <p className="text-xs text-muted-foreground">
                {t("data.hero.loanAccount", { account: data.loan_account })}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1 sm:items-end">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              {t("data.hero.financingAmount")}
            </p>
            <p
              className="text-2xl font-semibold tabular-nums"
              data-testid="financing-amount"
            >
              {formatDecimalCurrency(data.financing_amount, EUR_CURRENCY_CODE)}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={financingStatusBadgeVariant(data.status)}>
                {t(`status.${data.status}`)}
              </Badge>
              <Badge variant="outline">{t(`kind.${data.kind}`)}</Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="financing-claim-card">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              {t("data.claim.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-sm">
              <FieldRow
                label={t("data.claim.nominalClaim")}
                value={formatDecimalCurrency(
                  data.nominal_claim,
                  EUR_CURRENCY_CODE
                )}
              />
              <FieldRow
                label={t("data.claim.presentValue")}
                value={formatDecimalCurrency(
                  data.present_value,
                  EUR_CURRENCY_CODE
                )}
              />
              <FieldRow
                label={t("data.claim.collateralTotal")}
                value={formatDecimalCurrency(
                  data.collateral_total,
                  EUR_CURRENCY_CODE
                )}
              />
              <FieldRow
                label={t("data.claim.contractCount")}
                value={String(data.contract_count)}
              />
              <FieldRow
                label={t("data.claim.objectCount")}
                value={String(data.object_count)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card data-testid="financing-pricing-card">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              {t("data.pricing.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-sm">
              <FieldRow
                label={t("data.pricing.refinancingRate")}
                value={formatDecimalPercent(
                  data.refinancing_rate,
                  RATE_FRACTION_DIGITS
                )}
              />
              <FieldRow
                label={t("data.pricing.effectiveQuota")}
                value={formatDecimalPercent(data.effective_quota)}
              />
              <FieldRow
                label={t("data.pricing.financingQuote")}
                value={formatDecimalPercent(data.financing_quote_pct)}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* AC-01 traceability. The design's financing header carries no case reference at all, so
          without this the epic's "every financing resolves to its originating request" is not
          reachable from the screen the user is on. */}
      {data.originating_decision !== null && (
        <Card data-testid="financing-decision-card">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              {t("data.decision.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-sm">
              <FieldRow
                label={t("data.decision.requestStatus")}
                value={data.originating_decision.request_status ?? "—"}
              />
              <FieldRow
                label={t("data.decision.decidedAt")}
                value={formatDateTime(data.originating_decision.decided_at)}
              />
              <FieldRow
                label={t("data.decision.reason")}
                value={data.originating_decision.decision_reason ?? "—"}
              />
            </dl>
          </CardContent>
        </Card>
      )}

      <section data-testid="financing-covenants">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold">{t("data.covenants.title")}</h3>
          {data.open_covenant_count > 0 && (
            <Badge variant="secondary">
              {t("data.covenants.openCount", {
                count: data.open_covenant_count,
              })}
            </Badge>
          )}
        </div>

        {data.covenants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("data.covenants.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("data.covenants.condition")}</TableHead>
                  <TableHead>{t("data.covenants.step")}</TableHead>
                  <TableHead>{t("data.covenants.dueDate")}</TableHead>
                  <TableHead>{t("data.covenants.state")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.covenants.map(covenant => (
                  <TableRow
                    key={covenant.id}
                    data-testid={`financing-covenant-row-${covenant.id}`}
                  >
                    <TableCell>{covenant.condition_text}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {covenant.step_reference ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDate(covenant.due_date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={covenantStateBadgeVariant(covenant.state)}
                      >
                        {t(`covenantState.${covenant.state}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
