import { useTranslation } from "react-i18next"
import type { TenantStatus } from "@/features/tenants/api/schema"

type TenantStatusBadgeProps = {
  status: TenantStatus
}

type StatusConfig = {
  container: string
  dot: string
  text: string
}

const STATUS_CONFIG: Record<TenantStatus, StatusConfig> = {
  active: {
    container: "bg-[#d0fae5]",
    dot: "bg-[#22c55e]",
    text: "text-[#166534]",
  },
  draft: {
    container: "bg-[#dbeafe]",
    dot: "bg-[#3b82f6]",
    text: "text-[#1d4ed8]",
  },
  suspended: {
    container: "bg-[#ffedd4]",
    dot: "bg-[#f97316]",
    text: "text-[#9a3412]",
  },
  rejected: {
    container: "bg-[#fee2e2]",
    dot: "bg-[#ef4444]",
    text: "text-[#991b1b]",
  },
  archived: {
    container: "bg-[#f1f5f9]",
    dot: "bg-[#94a3b8]",
    text: "text-[#374151]",
  },
  expired: {
    container: "bg-[#f3e8ff]",
    dot: "bg-[#a855f7]",
    text: "text-[#6b21a8]",
  },
}

function TenantStatusBadge({ status }: TenantStatusBadgeProps) {
  const { t } = useTranslation("tenants")
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.container} ${config.text}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${config.dot}`} />
      {t(`statuses.${status}` as `statuses.${TenantStatus}`)}
    </span>
  )
}

export { TenantStatusBadge }
