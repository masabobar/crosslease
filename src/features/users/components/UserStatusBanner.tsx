import { AlertTriangle, XCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { UserStatusSchema } from "@/features/users/api/schema"
import type { UserStatus } from "@/features/users/api/schema"

const AMBER_CLASSES =
  "bg-amber-50 border border-amber-200 text-amber-800 rounded-[10px] px-3 py-2 text-sm"

const RED_CLASSES =
  "bg-red-50 border border-red-200 text-red-800 rounded-[10px] px-3 py-2 text-sm"

export function UserStatusBanner({ status }: { status: UserStatus }) {
  const { t } = useTranslation("users")

  if (status === UserStatusSchema.enum.suspended) {
    return (
      <div className={`flex items-center gap-2 ${AMBER_CLASSES}`}>
        <AlertTriangle size={16} className="shrink-0" />
        <span>{t("detail.page.banners.suspended")}</span>
      </div>
    )
  }

  if (status === UserStatusSchema.enum.expired) {
    return (
      <div className={`flex items-center gap-2 ${RED_CLASSES}`}>
        <XCircle size={16} className="shrink-0" />
        <span>{t("detail.page.banners.expired")}</span>
      </div>
    )
  }

  if (status === UserStatusSchema.enum.deactivated) {
    return (
      <div className={`flex items-center gap-2 ${RED_CLASSES}`}>
        <XCircle size={16} className="shrink-0" />
        <span>{t("detail.page.banners.deactivated")}</span>
      </div>
    )
  }

  return null
}
