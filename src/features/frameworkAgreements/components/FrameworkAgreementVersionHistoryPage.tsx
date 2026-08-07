import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { SelectField } from "@/components/ui/select"
import { ReviewRow } from "@/features/frameworkAgreements/components/ReviewRow"
import { CompareFrameworkAgreementVersionsModal } from "@/features/frameworkAgreements/components/CompareFrameworkAgreementVersionsModal"
import { useFrameworkAgreementVersions } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementVersions"
import { useFrameworkAgreementVersionDetail } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementVersionDetail"
import { isFrameworkAgreementNotFoundError } from "@/features/frameworkAgreements/utils"
import { FA_VERSION_STATUS_BADGE_VARIANT } from "@/features/frameworkAgreements/constants"
import { FAVersionStatusSchema } from "@/features/frameworkAgreements/api/schema"
import type { FAVersionSummaryResponse } from "@/features/frameworkAgreements/api/schema"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import { formatDateTime, formatCurrency } from "@/lib/formatters"
import { isUuidRouteParam } from "@/lib/routeParams"
import { frameworkAgreementDetail } from "@/router/paths"
import NotFoundPage from "@/features/errors/components/NotFoundPage"

// View-only: no author-new-version or activate-version actions. The backend has no way
// to edit a new draft version's fields before activating it (no version-scoped PATCH,
// unlike the Bank Product Template equivalent this screen otherwise mirrors), so an
// authoring flow here would only ever reproduce the current version verbatim — see
// open-questions Q-064. List, per-version detail (expand a row), and compare only.
function VersionDetailExpansion({
  frameworkAgreementId,
  versionNumber,
}: {
  frameworkAgreementId: string
  versionNumber: string
}) {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")
  const { data, isLoading, isError } = useFrameworkAgreementVersionDetail(
    frameworkAgreementId,
    versionNumber
  )

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
  }
  if (isError || !data) {
    return <p className="text-sm text-destructive">{t("errors.generic")}</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <ReviewRow
        label={t("fields.bankEntity")}
        value={t(
          `bankEntities.${data.bank_entity}` as "bankEntities.sparkasse"
        )}
      />
      <ReviewRow label={t("fields.currency")} value={data.currency} />
      {data.vfe_amount_eur !== null && (
        <ReviewRow
          label={t("fields.vfeAmountEur")}
          value={formatCurrency(data.vfe_amount_eur, data.currency)}
        />
      )}
      {data.special_conditions && (
        <div className="col-span-2 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            {t("detail.sections.specialConditions")}
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {data.special_conditions}
          </p>
        </div>
      )}
    </div>
  )
}

function VersionRow({
  frameworkAgreementId,
  version,
}: {
  frameworkAgreementId: string
  version: FAVersionSummaryResponse
}) {
  const { t } = useTranslation("frameworkAgreements")

  return (
    <AccordionItem
      value={version.version_number}
      data-testid={`fa-version-row-${version.version_number}`}
    >
      <AccordionTrigger
        className="px-4"
        data-testid={`fa-version-row-trigger-${version.version_number}`}
      >
        <div className="flex flex-1 items-center justify-between gap-4 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              v{version.version_number}
            </span>
            <Badge
              variant={FA_VERSION_STATUS_BADGE_VARIANT[version.version_status]}
            >
              {t(`versionHistory.statuses.${version.version_status}`)}
            </Badge>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
            <span>
              {formatCurrency(version.max_volume_eur, EUR_CURRENCY_CODE)} ·{" "}
              {version.valid_from} –{" "}
              {version.valid_until ?? t("fields.openEnded")}
            </span>
            {version.activated_at && (
              <span>
                {t("versionHistory.activatedAt", {
                  date: formatDateTime(version.activated_at),
                })}
              </span>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4">
        <VersionDetailExpansion
          frameworkAgreementId={frameworkAgreementId}
          versionNumber={version.version_number}
        />
      </AccordionContent>
    </AccordionItem>
  )
}

export default function FrameworkAgreementVersionHistoryPage() {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")
  const { id: idParam } = useParams<{ id: string }>()
  const id = isUuidRouteParam(idParam) ? idParam : undefined

  const [compareFrom, setCompareFrom] = useState("")
  const [compareTo, setCompareTo] = useState("")
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)

  const {
    data: history,
    isLoading,
    isError,
    error,
  } = useFrameworkAgreementVersions(id ?? "")

  if (id === undefined || isFrameworkAgreementNotFoundError(error)) {
    return <NotFoundPage />
  }

  // Discarded versions must never be visible on the frontend (client decision on
  // PRD1042-1798/1799) — the BE returns them regardless, so the filter happens here.
  const visibleVersions = (history?.items ?? []).filter(
    version => version.version_status !== FAVersionStatusSchema.enum.discarded
  )
  const agreementName = visibleVersions[0]?.agreement_name

  const versionOptions = visibleVersions.map(version => ({
    value: version.version_number,
    label: t("versionHistory.compare.versionOptionLabel", {
      version: version.version_number,
      status: t(`versionHistory.statuses.${version.version_status}`),
    }),
  }))

  return (
    <div className="flex flex-col h-full" data-testid="fa-version-history-page">
      <div className="px-8 py-6 flex flex-col gap-2">
        {id && (
          <Link
            to={frameworkAgreementDetail(id)}
            data-testid="fa-version-history-back"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline w-fit"
          >
            <ArrowLeft size={14} />
            {t("versionHistory.backToAgreement")}
          </Link>
        )}
        <h2 className="text-2xl font-semibold text-foreground">
          {t("versionHistory.title")}
        </h2>
        {agreementName && (
          <p className="text-sm text-muted-foreground">{agreementName}</p>
        )}
      </div>

      {history && !isLoading && (
        <div className="px-8 pb-6">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-4">
            <span className="text-sm font-medium text-foreground">
              {t("versionHistory.compare.compareLabel")}
            </span>
            <SelectField
              value={compareFrom}
              onValueChange={setCompareFrom}
              options={versionOptions}
              placeholder={t("fields.selectPlaceholder")}
              data-testid="fa-compare-from-select"
            />
            <span className="text-sm font-medium text-foreground">
              {t("versionHistory.compare.withLabel")}
            </span>
            <SelectField
              value={compareTo}
              onValueChange={setCompareTo}
              options={versionOptions}
              placeholder={t("fields.selectPlaceholder")}
              data-testid="fa-compare-to-select"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!compareFrom || !compareTo || compareFrom === compareTo}
              onClick={() => setIsCompareModalOpen(true)}
              data-testid="fa-compare-versions-button"
            >
              {t("versionHistory.compare.compareButton")}
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="px-8 pb-8">
          <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
        </div>
      )}

      {isError && !isLoading && (
        <div
          data-testid="fa-version-history-error"
          className="flex items-center justify-center flex-1"
        >
          <p className="text-sm text-muted-foreground">{t("errors.generic")}</p>
        </div>
      )}

      {history && !isLoading && (
        <div className="px-8 pb-8">
          <div className="border border-border rounded-xl bg-background overflow-hidden">
            <Accordion>
              {visibleVersions.map(version => (
                <VersionRow
                  key={version.version_number}
                  frameworkAgreementId={id ?? ""}
                  version={version}
                />
              ))}
            </Accordion>
          </div>
        </div>
      )}

      <CompareFrameworkAgreementVersionsModal
        frameworkAgreementId={id ?? ""}
        fromVersion={compareFrom}
        toVersion={compareTo}
        open={isCompareModalOpen}
        onOpenChange={setIsCompareModalOpen}
      />
    </div>
  )
}
