import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import clLogo from "@/assets/crosslease-logo.png"
import { PATHS } from "@/router/paths"

export function AppLogo() {
  const { t } = useTranslation("auth")

  return (
    <Link to={PATHS.LOGIN} className="cursor-pointer">
      <img src={clLogo} alt={t("appLogoAlt")} className="h-10 w-auto" />
    </Link>
  )
}
