import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PATHS } from "@/router/paths"

export default function ForbiddenPage() {
  const { t } = useTranslation("common")

  return (
    <div
      data-testid="forbidden-page"
      className="flex min-h-screen flex-col items-center justify-center gap-3"
    >
      <span className="text-8xl font-bold text-gray-200">403</span>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("forbidden.title")}
      </h1>
      <p className="text-gray-500">{t("forbidden.subtitle")}</p>
      <Link
        to={PATHS.DASHBOARD}
        data-testid="forbidden-back-dashboard"
        className="mt-2 text-sm text-primary hover:underline"
      >
        {t("forbidden.backToDashboard")}
      </Link>
    </div>
  )
}
