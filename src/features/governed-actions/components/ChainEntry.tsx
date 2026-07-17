import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { ActionStatusBadge } from "@/features/governed-actions/components/ActionStatusBadge"
import { GOVERNED_ACTION_STATUS_DOT_COLOR } from "@/features/governed-actions/constants"
import type { GovernedActionStatus } from "@/features/governed-actions/api/schema"

export function ChainEntry({
  description,
  date,
  status,
  correlationId,
}: {
  description: string
  date: string
  status: GovernedActionStatus
  correlationId?: string | null
}) {
  const { t } = useTranslation("pendingApprovals")

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-start gap-2 w-full">
        <div className="flex items-start self-stretch pr-2 pt-1.5 shrink-0">
          <div
            className={cn(
              "size-2 rounded-full shrink-0",
              GOVERNED_ACTION_STATUS_DOT_COLOR[status]
            )}
          />
        </div>
        <div className="flex flex-1 items-center min-w-0 gap-3">
          <div className="flex flex-col flex-1 min-w-0 opacity-80">
            <p className="text-sm text-foreground">{description}</p>
            <p className="text-sm text-muted-foreground">{date}</p>
          </div>
          <ActionStatusBadge status={status} />
        </div>
      </div>
      {correlationId && (
        <div className="flex flex-col gap-0.5 pl-4">
          <p className="text-xs text-muted-foreground">
            {t("drawer.correlationId")}
          </p>
          <p className="text-xs font-mono text-foreground/70 break-all">
            {correlationId}
          </p>
        </div>
      )}
    </div>
  )
}
