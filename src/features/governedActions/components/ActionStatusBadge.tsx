import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { GovernedActionStatus } from "@/features/governedActions/api/schema"

const STATUS_STYLES: Record<GovernedActionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-100 text-gray-600 border-gray-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
}

type Props = {
  status: GovernedActionStatus
  className?: string
}

export function ActionStatusBadge({ status, className }: Props) {
  const { t } = useTranslation("pendingApprovals")

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {t(`status.${status}`)}
    </span>
  )
}
