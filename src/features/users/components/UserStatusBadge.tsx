import type { UserStatus } from "@/features/users/api/schema"

type UserStatusBadgeProps = {
  status: UserStatus
}

type StatusConfig = {
  container: string
  dot: string
  text: string
  label: string
}

const STATUS_CONFIG: Record<UserStatus, StatusConfig> = {
  active: {
    container: "bg-emerald-100",
    dot: "bg-emerald-500",
    text: "text-emerald-800",
    label: "Active",
  },
  invited: {
    container: "bg-blue-100",
    dot: "bg-blue-500",
    text: "text-blue-700",
    label: "Invited",
  },
  suspended: {
    container: "bg-orange-100",
    dot: "bg-orange-500",
    text: "text-orange-800",
    label: "Suspended",
  },
  pending_activation: {
    container: "bg-yellow-100",
    dot: "bg-yellow-500",
    text: "text-amber-800",
    label: "Pending",
  },
  deactivated: {
    container: "bg-slate-100",
    dot: "bg-slate-400",
    text: "text-gray-700",
    label: "Deactivated",
  },
  expired: {
    container: "bg-slate-100",
    dot: "bg-slate-400",
    text: "text-gray-700",
    label: "Expired",
  },
}

function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.container} ${config.text}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  )
}

export { UserStatusBadge }
