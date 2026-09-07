import { useTranslation } from "react-i18next"
import { Pencil } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import {
  formatCurrency,
  formatDate,
  formatDecimalCurrency,
} from "@/lib/formatters"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { useFrameworkAgreementUtilization } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementUtilization"
import { useCaseAllowedProductTemplates } from "@/features/cases/hooks/useCaseAllowedProductTemplates"
import { useCaseContracts } from "@/features/cases/hooks/useCaseContracts"
import { useCaseContractTotals } from "@/features/cases/hooks/useSubmitCase"
import {
  canShowRemainingAvailable,
  deriveContractFigures,
} from "@/features/cases/summaryFigures"
import type {
  CaseLeasingCompanyResponse,
  CaseProductTemplateResponse,
} from "@/features/cases/api/schema"
import type { CaseWizardStep } from "@/features/cases/wizard"

type Props = {
  caseId: string
  lcPartnerId: string | null
  leasingCompany: CaseLeasingCompanyResponse | null
  productTemplate: CaseProductTemplateResponse | null
  onEditStep: (step: CaseWizardStep) => void
}

/**
 * Wizard step 3 — **Summary** (`Review & submit`). US 1.17.
 *
 * ── FIVE OF THE DESIGN'S SIX CONTRACT FIGURES ARE HERE, ONE CANNOT BE ──────────────────────────
 * `PackageTotalsRead` carries only the contract count and three money sums. The lessee count, the
 * earliest and latest start date and the average term are **derived** from the contract list (see
 * summaryFigures.ts), and are omitted rather than guessed when the list is shorter than the server's
 * total — a wrong aggregate presented as fact is worse than a missing one.
 *
 * **"Number of objects" is genuinely unavailable.** `ContractRead` carries no object count, and the
 * only `object_count` on the wire hangs off the financing overview — which does not exist until the
 * request is approved, long after this screen. So it is not shown at all.
 *
 * ── "REMAINING AVAILABLE" USUALLY DISAPPEARS, AND THAT IS CORRECT ──────────────────────────────
 * The spec requires the line to vanish rather than read zero when no framework volume is
 * maintained, and records that none is known for any of the seven leasing companies. So the design's
 * populated figure is the exception, not the rule; `limit_available_flag` decides.
 */
export function SummaryStep({
  caseId,
  lcPartnerId,
  leasingCompany,
  productTemplate,
  onEditStep,
}: Props) {
  const { t } = useTranslation("cases")

  const totals = useCaseContractTotals(caseId)
  const contracts = useCaseContracts(caseId)
  // Reuses step 1's agreement lookup rather than repeating it — same query keys, so the cache is
  // shared and nothing is re-fetched.
  const agreement = useCaseAllowedProductTemplates(lcPartnerId ?? undefined)
  const utilization = useFrameworkAgreementUtilization(
    agreement.agreementId ?? ""
  )

  const figures =
    contracts.data === undefined
      ? null
      : deriveContractFigures(contracts.data.items, contracts.data.total)

  // Narrowed to a number here rather than asserted at the call site: `canShowRemainingAvailable`
  // already requires a non-null figure, so pulling it out keeps the JSX free of a cast.
  const remainingAvailable =
    utilization.data !== undefined &&
    canShowRemainingAvailable(utilization.data) &&
    utilization.data.available_volume_eur !== null
      ? utilization.data.available_volume_eur
      : null

  return (
    <div className="flex flex-col gap-4" data-testid="case-wizard-step-summary">
      <Card
        title={t("wizard.summaryCards.leasingCompany")}
        onEdit={() => onEditStep("leasingCompany")}
        editTestId="case-wizard-edit-company"
        editLabel={t("wizard.summaryCards.edit")}
      >
        <Row
          label={t("wizard.summaryCards.name")}
          value={leasingCompany?.name ?? "—"}
        />
        <Row
          label={t("wizard.summaryCards.frameworkAgreement")}
          value={leasingCompany?.agreement_reference ?? "—"}
          badge={
            leasingCompany?.agreement_active === true
              ? t("wizard.company.agreementActive")
              : undefined
          }
        />
        <Row
          label={t("wizard.summaryCards.productTemplate")}
          value={
            productTemplate === null
              ? "—"
              : `${productTemplate.template_name ?? productTemplate.template_code}, v${productTemplate.version_number ?? "?"}`
          }
        />
        <Row
          label={t("wizard.summaryCards.frameworkVolume")}
          value={formatDecimalCurrency(
            leasingCompany?.framework_volume_eur ?? null,
            EUR_CURRENCY_CODE
          )}
        />
        {/* Present only when the backend says the figure means something — see the note above. */}
        {/* A number here, not a decimal string — this resource coerces its money, so it takes
            formatCurrency rather than the decimal formatter. */}
        {remainingAvailable !== null && (
          <Row
            label={t("wizard.summaryCards.remainingAvailable")}
            value={formatCurrency(remainingAvailable, EUR_CURRENCY_CODE)}
          />
        )}
      </Card>

      <Card
        title={t("wizard.summaryCards.contracts")}
        onEdit={() => onEditStep("contracts")}
        editTestId="case-wizard-edit-contracts"
        editLabel={t("wizard.summaryCards.edit")}
      >
        {totals.isLoading && <Skeleton className="h-24 w-full" />}

        {totals.isError && (
          <p
            className="text-sm text-destructive"
            data-testid="case-wizard-summary-totals-error"
          >
            {resolveApiErrorMessage(totals.error, t)}
          </p>
        )}

        {totals.data !== undefined && (
          <>
            <Row
              label={t("wizard.summaryCards.contractCount")}
              value={String(totals.data.contract_count)}
            />
            <Row
              label={t("wizard.summaryCards.residualSum")}
              value={formatDecimalCurrency(
                totals.data.residual_sum,
                EUR_CURRENCY_CODE
              )}
            />
            <Row
              label={t("wizard.summaryCards.acquisitionCostSum")}
              value={formatDecimalCurrency(
                totals.data.acquisition_cost_sum,
                EUR_CURRENCY_CODE
              )}
            />
          </>
        )}

        {figures !== null && (
          <>
            <Row
              label={t("wizard.summaryCards.lesseeCount")}
              value={String(figures.lesseeCount)}
            />
            <Row
              label={t("wizard.summaryCards.earliestStart")}
              value={formatDate(figures.earliestStart)}
            />
            <Row
              label={t("wizard.summaryCards.latestStart")}
              value={formatDate(figures.latestStart)}
            />
            <Row
              label={t("wizard.summaryCards.averageTerm")}
              value={
                figures.averageTermMonths === null
                  ? "—"
                  : t("wizard.contracts.termMonths", {
                      count: figures.averageTermMonths,
                    })
              }
            />
          </>
        )}

        {/* Says why four figures are missing rather than leaving unexplained gaps in the card. */}
        {figures === null && contracts.data !== undefined && (
          <p
            className="text-xs text-muted-foreground"
            data-testid="case-wizard-summary-figures-partial"
          >
            {t("wizard.summaryCards.figuresPartial", {
              shown: contracts.data.items.length,
              total: contracts.data.total,
            })}
          </p>
        )}
      </Card>

      {/* The design shows no such notice, but the request is about to leave the user's hands, so
          what cannot be shown on it is worth stating before they submit rather than after. */}
      <Alert data-testid="case-wizard-summary-object-count-absent">
        <AlertTitle>{t("wizard.summaryCards.objectsAbsent.title")}</AlertTitle>
        <AlertDescription>
          {t("wizard.summaryCards.objectsAbsent.description")}
        </AlertDescription>
      </Alert>
    </div>
  )
}

function Card({
  title,
  onEdit,
  editTestId,
  editLabel,
  children,
}: {
  title: string
  onEdit: () => void
  editTestId: string
  editLabel: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">
          {title}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid={editTestId}
          onClick={onEdit}
        >
          <Pencil size={14} />
          {editLabel}
        </Button>
      </div>
      <dl className="flex flex-col gap-2 px-4 py-3 text-sm">{children}</dl>
    </section>
  )
}

function Row({
  label,
  value,
  badge,
}: {
  label: string
  value: string
  badge?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2 font-medium tabular-nums">
        {value}
        {badge !== undefined && <Badge variant="default">{badge}</Badge>}
      </dd>
    </div>
  )
}
