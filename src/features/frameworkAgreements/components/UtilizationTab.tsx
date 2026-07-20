import { useTranslation } from "react-i18next"
import { useFrameworkAgreementUtilization } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementUtilization"

type Props = {
  frameworkAgreementId: string
}

function UtilizationTab({ frameworkAgreementId }: Props) {
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
          <p className="text-sm text-foreground">{data.max_volume_eur}</p>
        </div>
      </div>
    </div>
  )
}

export { UtilizationTab }
