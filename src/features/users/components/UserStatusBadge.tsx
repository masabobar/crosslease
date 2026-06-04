import { useTranslation } from "react-i18next"
import type { UserStatus } from "@/features/users/api/schema"

type UserStatusBadgeProps = {
  status: UserStatus
}

type StatusConfig = {
  container: string
  dot: string
  text: string
}

const STATUS_CONFIG: Record<UserStatus, StatusConfig> = {
  active: {
    container: "bg-[#d0fae5]",
    dot: "bg-[#22c55e]",
    text: "text-[#166534]",
  },
  invited: {
    container: "bg-[#dbeafe]",
    dot: "bg-[#3b82f6]",
    text: "text-[#1d4ed8]",
  },
  suspended: {
    container: "bg-[#ffedd4]",
    dot: "bg-[#f97316]",
    text: "text-[#9a3412]",
  },
  pending_approval: {
    container: "bg-[#fef3c6]",
    dot: "bg-[#f59e0b]",
    text: "text-[#92400e]",
  },
  rejected: {
    container: "bg-[#fee2e2]",
    dot: "bg-[#ef4444]",
    text: "text-[#991b1b]",
  },
  deactivated: {
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

function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const { t } = useTranslation("users")
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.container} ${config.text}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${config.dot}`} />
      {t(`statuses.${status}` as `statuses.${UserStatus}`)}
    </span>
  )
}

export { UserStatusBadge }
