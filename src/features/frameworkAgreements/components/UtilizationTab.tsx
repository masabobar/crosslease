import { useTranslation } from "react-i18next"
import { useFrameworkAgreementUtilization } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementUtilization"
import { formatCurrency } from "@/lib/formatters"

type Props = {
  frameworkAgreementId: string
  // The utilization response carries no currency of its own — it comes from the
  // agreement so the same envelope reads identically on both tabs.
  currency: string
}

function UtilizationTab({ frameworkAgreementId, currency }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { data, isLoading, isError } =
    useFrameworkAgreementUtilization(frameworkAgreementId)

  if (isLoading) {
    return null
  }

  if (isError || !data) {
    return (
      <p className="mt-4 text-sm text-destructive">{t("errors.generic")}</p>
    )
  }

  return (
    <div
      className="mt-4 border border-border rounded-xl bg-background overflow-hidden"
      data-testid="fa-utilization-tab"
    >
      <div className="bg-muted px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {t("detail.sections.creditEnvelope")}
        </p>
      </div>
      <div className="p-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            {t("fields.maxVolumeEur")}
          </p>
          <p className="text-sm text-foreground">
            {formatCurrency(data.max_volume_eur, currency)}
          </p>
        </div>
      </div>
    </div>
  )
}

export { UtilizationTab }
