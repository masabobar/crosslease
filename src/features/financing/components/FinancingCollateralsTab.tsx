import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { AlertTriangle, FileText } from "lucide-react"
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
import { TableEmptyState } from "@/components/ui/empty"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import { formatDate, formatDecimalCurrency } from "@/lib/formatters"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { partnerDetail } from "@/router/paths"
import {
  useFinancingCollateral,
  useFinancingSecurities,
} from "@/features/financing/hooks/useFinancingDetail"

const eur = (value: string | null) =>
  value === null ? null : formatDecimalCurrency(value, EUR_CURRENCY_CODE)

/**
 * Financing → **Collaterals**.
 *
 * Two things, in the order they are read: the collateral total of the whole financing, and the
 * securities held against its contracts.
 *
 * ── THE TOTAL IS ONE FIGURE, AND RE-DETERMINING IT TAKES TWO PEOPLE ────────────────────────────
 * One total for the financing, never one per object. Changing a recorded total is a **proposal**
 * until a second Back Office person confirms it, and the proposer can never be that person. The
 * backend decides who may confirm — `decision_block` says why the signed-in user may not — because
 * the rule depends on who resolved the collateral-capture step, which this screen cannot see.
 *
 * ── THE RECHECK FLAG CANNOT BE DISMISSED ───────────────────────────────────────────────────────
 * A partial redemption, or a package falling to a single contract, changes what the collateral is
 * worth. The record raises `needs_recheck` and only an approved re-determination clears it — so
 * the flag is rendered as a state, never as something with a close button.
 */
export function FinancingCollateralsTab({
  financingId,
}: {
  financingId: string
}) {
  const { t } = useTranslation("financing")
  const collateral = useFinancingCollateral(financingId)
  const securities = useFinancingSecurities(financingId)

  const record = collateral.data
  const items = securities.data?.items ?? []
  const inPlace = items.filter(
    item => item.evidence_document_id !== null
  ).length

  return (
    <div
      className="flex flex-col gap-6"
      data-testid="financing-collaterals-tab"
    >
      <section
        className="overflow-hidden rounded-lg border"
        data-testid="financing-collateral-total"
      >
        <h3 className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("collateral.heading")}
        </h3>

        {collateral.isLoading && <Skeleton className="m-4 h-24" />}

        {collateral.isError && (
          <p
            className="px-4 py-3 text-sm text-destructive"
            data-testid="financing-collateral-error"
          >
            {resolveApiErrorMessage(collateral.error, t)}
          </p>
        )}

        {record !== undefined && (
          <div className="p-4">
            <p className="text-2xl font-semibold tabular-nums">
              {record.current_total_eur === null ? (
                <span className="text-base font-normal italic text-muted-foreground">
                  {t("detail.notRecorded")}
                </span>
              ) : (
                eur(record.current_total_eur)
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("collateral.oneFigure")}
              {record.value_history.length > 0 &&
                ` · ${t("collateral.versions", {
                  count: record.value_history.length,
                })}`}
            </p>

            {/* Raised by what changed the collateral's worth, cleared only by an approved
                re-determination. There is deliberately no dismiss. */}
            {record.recheck_state === "needs_recheck" && (
              <div
                className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3"
                data-testid="financing-collateral-recheck"
              >
                <p className="flex items-center gap-2 font-medium text-amber-900">
                  <AlertTriangle size={15} />
                  {t("collateral.recheck.title")}
                </p>
                <p className="mt-1 text-sm text-amber-900">
                  {t("collateral.recheck.description")}
                </p>
              </div>
            )}

            {record.proposed_total_eur !== null && (
              <div
                className="mt-4 rounded-lg border border-primary/40 bg-primary/5 p-3"
                data-testid="financing-collateral-proposal"
              >
                <p className="font-medium">
                  {t("collateral.proposed", {
                    amount: eur(record.proposed_total_eur),
                  })}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("collateral.proposedBy", {
                    who: record.redetermined_by_name ?? "—",
                  })}
                </p>
                {/* Why this reader may not confirm. The backend decides it; the screen only says
                    which of the three reasons applies. */}
                {record.decision_block !== null && (
                  <p
                    className="mt-2 text-sm text-muted-foreground"
                    data-testid="financing-collateral-block"
                  >
                    {t(
                      `collateral.blocks.${record.decision_block}` as "collateral.blocks.proposer"
                    )}
                  </p>
                )}
              </div>
            )}

            {record.evidence.length > 0 && (
              <ul className="mt-4 flex flex-col gap-1 border-t pt-3">
                {record.evidence.map(file => (
                  <li
                    key={file.document_id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <FileText size={14} className="text-muted-foreground" />
                    {file.file_name ?? file.document_id}
                    <span className="text-muted-foreground">
                      · {formatDate(file.uploaded_at_local)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section
        className="overflow-hidden rounded-lg border"
        data-testid="financing-securities"
      >
        <h3 className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("collateral.securities")}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("collateral.inPlace", { done: inPlace, total: items.length })}
          </span>
        </h3>

        {securities.isLoading && <Skeleton className="m-4 h-24" />}

        {securities.isError && (
          <p
            className="px-4 py-3 text-sm text-destructive"
            data-testid="financing-securities-error"
          >
            {resolveApiErrorMessage(securities.error, t)}
          </p>
        )}

        {!securities.isLoading && !securities.isError && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("collateral.cols.security")}</TableHead>
                  <TableHead>{t("collateral.cols.contract")}</TableHead>
                  <TableHead className="text-right">
                    {t("collateral.cols.value")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow
                    key={item.collateral_id}
                    data-testid={`financing-security-${item.collateral_id}`}
                  >
                    <TableCell>
                      <span className="block font-medium">
                        {t(
                          `collateral.types.${item.collateral_type}` as "collateral.types.guarantee",
                          { defaultValue: item.collateral_type }
                        )}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {item.guarantor_partner_id !== null ? (
                          <Link
                            className="text-primary hover:underline"
                            to={partnerDetail(item.guarantor_partner_id)}
                          >
                            {item.guarantor_display_name ??
                              item.guarantor_partner_id}
                          </Link>
                        ) : (
                          t("collateral.noParty")
                        )}
                        {" · "}
                        {item.evidence_document_name === null ? (
                          <span className="text-amber-700">
                            {t("collateral.proofMissing")}
                          </span>
                        ) : (
                          <>
                            {item.evidence_document_name}
                            {item.evidence_document_date !== null &&
                              ` · ${formatDate(item.evidence_document_date)}`}
                          </>
                        )}
                      </span>
                    </TableCell>
                    {/* Not a link: this app has no contract detail route, so the number is
                        shown as what it is rather than as a promise that goes nowhere. */}
                    <TableCell className="whitespace-nowrap">
                      {item.contract_number ?? item.contract_id}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {/* An empty value means NOT RECORDED — never "unlimited". */}
                      {item.value === null ? (
                        <span className="italic text-muted-foreground">
                          {t("detail.notRecorded")}
                        </span>
                      ) : (
                        eur(item.value)
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {items.length === 0 && (
              <TableEmptyState
                title={t("collateral.empty.title")}
                description={t("collateral.empty.description")}
              />
            )}

            {items.length > 0 && (
              <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                {t("collateral.capturedWithContract")}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export function CollateralBadge({ state }: { state: string }) {
  const { t } = useTranslation("financing")
  return (
    <Badge variant="secondary" className="font-normal">
      {t(`collateral.states.${state}` as "collateral.states.clear", {
        defaultValue: state,
      })}
    </Badge>
  )
}
