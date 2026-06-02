import { useTranslation } from "react-i18next"
import { Shield } from "lucide-react"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"

export function SupportContextBanner() {
  const { t } = useTranslation("common")
  const { data: currentUser } = useCurrentUser()

  if (!currentUser || currentUser.role !== "support_user") {
    return null
  }

  const tenantLabel = currentUser.tenant_id
    ? t("support.viewingTenant", { tenant: currentUser.tenant_id })
    : t("support.viewingTenant", { tenant: t("support.allTenants") })

  return (
    <div
      role="status"
      aria-label={t("support.readOnlyDescription")}
      className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm"
      data-testid="support-context-banner"
    >
      <Shield
        size={14}
        className="shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <span className="font-medium">{t("support.contextBanner")}</span>
      <span className="text-amber-700">—</span>
      <span>{tenantLabel}</span>
      <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-amber-700">
        <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5">
          {t("support.readOnly")}
        </span>
      </span>
    </div>
  )
}
