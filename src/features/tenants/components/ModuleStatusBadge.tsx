import { useTranslation } from "react-i18next"
import type { TenantModuleStatus } from "@/features/tenants/api/schema"

type StatusConfig = { container: string; dot: string; text: string }

const MODULE_STATUS_CONFIG: Record<TenantModuleStatus, StatusConfig> = {
  active: {
    container: "bg-[#d0fae5]",
    dot: "bg-[#22c55e]",
    text: "text-[#166534]",
  },
  inactive: {
    container: "bg-[#f1f5f9]",
    dot: "bg-[#94a3b8]",
    text: "text-[#374151]",
  },
  pending_activation: {
    container: "bg-[#dbeafe]",
    dot: "bg-[#3b82f6]",
    text: "text-[#1d4ed8]",
  },
  pending_enforcement: {
    container: "bg-[#ffedd4]",
    dot: "bg-[#f97316]",
    text: "text-[#9a3412]",
  },
  pending_deactivation: {
    container: "bg-[#ffedd4]",
    dot: "bg-[#f97316]",
    text: "text-[#9a3412]",
  },
}

type Props = {
  status: TenantModuleStatus
}

export function ModuleStatusBadge({ status }: Props) {
  const { t } = useTranslation("tenants")
  const config = MODULE_STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${config.container} ${config.text}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${config.dot}`} />
      {t(`detail.modules.status.${status}` as "detail.modules.status.active", {
        defaultValue: status,
      })}
    </span>
  )
}
