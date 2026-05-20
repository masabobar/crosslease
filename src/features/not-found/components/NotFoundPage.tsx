import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { PATHS } from "@/router/paths"

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <span className="text-8xl font-bold text-gray-200">404</span>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("notFound.heading")}
      </h1>
      <p className="text-gray-500">{t("notFound.message")}</p>
      <Link
        to={PATHS.DASHBOARD}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        {t("notFound.backHome")}
      </Link>
    </div>
  )
}
