import { useTranslation } from "react-i18next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { ApiError } from "@/lib/api"
import { ContractDeferredStateSchema } from "@/features/cases/api/schema"
import { useCaseContracts } from "@/features/cases/hooks/useCaseContracts"
import { useFinancingOverview } from "@/features/financing/hooks/useFinancingOverview"
import { buildFinancingContractRows } from "@/features/financing/buildContractRows"

/**
 * The case workspace's **Contracts** tab — the design's financing Contracts tab
 * (.project-management/output/docs/financing-design-extract.md §8), US 1.34.
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
  const financing = useFinancingOverview(caseId)
  const contracts = useCaseContracts(caseId)

  if (financing.isLoading || contracts.isLoading) {
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

  // Same ordinary-state handling as the Data tab: a case without an approved decision has no
  // financing, which is the common case rather than a fault.
  if (
    financing.isError &&
    financing.error instanceof ApiError &&
    financing.error.code === "NOT_FOUND"
  ) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="financing-contracts-none"
      >
        {t("data.noFinancing")}
      </p>
    )
  }

  if (financing.isError || !financing.data) {
    return (
      <p
        className="text-sm text-destructive"
        data-testid="financing-contracts-error"
      >
        {resolveApiErrorMessage(financing.error, t)}
      </p>
    )
  }

  // The terms request failing is not the same as the financing failing — the shares are still
  // known, so the tab degrades to those rather than showing nothing.
  const caseContracts = contracts.data?.items ?? []
  const rows = buildFinancingContractRows(
    financing.data.contracts,
    caseContracts
  )

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="financing-contracts-panel"
    >
      {contracts.isError && (
        <Alert
          variant="destructive"
          data-testid="financing-contracts-terms-error"
        >
          <AlertTitle>{t("contracts.termsUnavailable.title")}</AlertTitle>
          <AlertDescription>
            {resolveApiErrorMessage(contracts.error, t)}
          </AlertDescription>
        </Alert>
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
                <TableHead>{t("contracts.columns.contract")}</TableHead>
                <TableHead>{t("contracts.columns.objects")}</TableHead>
                <TableHead>{t("contracts.columns.start")}</TableHead>
                <TableHead>{t("contracts.columns.term")}</TableHead>
                <TableHead>{t("contracts.columns.instalment")}</TableHead>
                <TableHead>{t("contracts.columns.residualValue")}</TableHead>
                <TableHead>{t("contracts.columns.share")}</TableHead>
                <TableHead>{t("contracts.columns.state")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow
                  key={row.contractId}
                  data-testid={`financing-contract-row-${row.contractId}`}
                >
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
                    {t("contracts.objectCount", { count: row.objectCount })}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDate(row.contractStart)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.termMonths === null
                      ? "—"
                      : t("contracts.termMonths", { count: row.termMonths })}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDecimalCurrency(
                      row.netInstalment,
                      EUR_CURRENCY_CODE
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDecimalCurrency(
                      row.residualValue,
                      EUR_CURRENCY_CODE
                    )}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
