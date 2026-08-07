import { useTranslation } from "react-i18next"
import { useFrameworkAgreementFinancings } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementFinancings"

type Props = {
  frameworkAgreementId: string
}

function FinancingsTab({ frameworkAgreementId }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")
  const { isLoading, isError } =
    useFrameworkAgreementFinancings(frameworkAgreementId)

  if (isLoading) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">{tCommon("loading")}</p>
    )
  }

  if (isError) {
    return (
      <p className="mt-4 text-sm text-destructive">{t("errors.generic")}</p>
    )
  }

  return (
    <div
      className="mt-4 border border-border rounded-xl bg-background p-8 text-center"
      data-testid="fa-financings-tab"
    >
      <p className="text-sm text-muted-foreground">
        {t("detail.financingsEmptyState")}
      </p>
    </div>
  )
}

export { FinancingsTab }
