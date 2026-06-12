import { useTranslation } from "react-i18next"
import {
  UserRound,
  CircleArrowUp,
  Calendar,
  CalendarClock,
  Building2,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { HOUR_MS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { ActionStatusBadge } from "@/features/governed-actions/components/ActionStatusBadge"
import { formatDateTime } from "@/lib/formatters"
import {
  GovernedActionStatusSchema,
  roleChangeSnapshot,
  platformInviteSnapshot,
  emailChangeSnapshot,
  initiatorSnapshot,
  approverSnapshot,
} from "@/features/governed-actions/api/schema"
import type { GovernedAction } from "@/features/governed-actions/api/schema"

const DOT_COLOR: Record<string, string> = {
  pending: "bg-amber-400",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-400",
  expired: "bg-gray-400",
}

const BORDER_COLOR: Record<string, string> = {
  pending: "border-l-2 border-l-amber-400",
  approved: "",
  rejected: "border-l-2 border-l-red-500",
  withdrawn: "",
  expired: "",
}

type RowTranslator = (
  key:
    | "row.submittedJustNow"
    | "row.submittedHoursAgo"
    | "row.submittedDaysAgo"
    | "row.expiryExpired"
    | "row.expiryHours"
    | "row.expiryDays",
  opts?: Record<string, unknown>
) => string

function formatRelativeExpiry(expiresAt: string, t: RowTranslator): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return t("row.expiryExpired")
  const hours = Math.ceil(diff / HOUR_MS)
  if (hours < 24) return t("row.expiryHours", { count: hours })
  const days = Math.floor(hours / 24)
  return t("row.expiryDays", { count: days })
}

function formatRelativeSubmitted(dateStr: string, t: RowTranslator): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diffMs / HOUR_MS)
  const days = Math.floor(hours / 24)
  const absolute = formatDateTime(dateStr)
  if (hours < 1) return t("row.submittedJustNow", { absolute })
  if (hours < 24) return t("row.submittedHoursAgo", { count: hours, absolute })
  return t("row.submittedDaysAgo", { count: days, absolute })
}

function getSubjectDisplay(action: GovernedAction): string {
  if (action.action_type === "user_platform_invite") {
    return platformInviteSnapshot(action).full_name ?? "—"
  }
  if (action.action_type === "user_role_change") {
    return roleChangeSnapshot(action).affected_user_email ?? "—"
  }
  if (action.action_type === "user_email_change") {
    return emailChangeSnapshot(action).new_email ?? "—"
  }
  return "—"
}

function getInitiatorName(action: GovernedAction): string {
  const snap = initiatorSnapshot(action)
  if (!snap?.first_name) return "—"
  return `${snap.first_name} ${snap.last_name}`
}

function getApproverName(action: GovernedAction): string {
  if (!action.approver_snapshot) return "—"
  const snap = approverSnapshot(action)
  if (!snap?.first_name) return "—"
  return `${snap.first_name} ${snap.last_name}`
}

type Props = {
  action: GovernedAction
  currentUserId: string
  canReview: boolean
  isHighlighted?: boolean
  ref?: React.Ref<HTMLButtonElement>
  onReview: (action: GovernedAction) => void
  onWithdraw: (action: GovernedAction) => void
  onReInitiate: (action: GovernedAction) => void
  onViewDetails: (action: GovernedAction) => void
}

export function ActionRow({
  action,
  currentUserId,
  canReview,
  isHighlighted = false,
  ref,
  onReview,
  onWithdraw,
  onReInitiate,
  onViewDetails,
}: Props) {
  const { t } = useTranslation("pendingApprovals")
  const isOwnSubmission = action.initiator_id === currentUserId
  const isPending = action.status === GovernedActionStatusSchema.enum.pending
  const isExpired = action.status === GovernedActionStatusSchema.enum.expired
  const isRejected = action.status === GovernedActionStatusSchema.enum.rejected
  const isApproved = action.status === GovernedActionStatusSchema.enum.approved

  const metaItems: React.ReactNode[] = [
    <span key="user" className="flex items-center gap-1">
      <UserRound size={12} />
      <span className="font-medium text-foreground/80">
        {t("row.user")}:
      </span>{" "}
      {getSubjectDisplay(action)}
    </span>,
    <span key="by" className="flex items-center gap-1">
      <CircleArrowUp size={12} />
      <span className="font-medium text-foreground/80">
        {t("row.by")}:
      </span>{" "}
      {getInitiatorName(action)}
    </span>,
    ...(isPending && action.created_at
      ? [
          <span key="submitted" className="flex items-center gap-1">
            <Calendar size={12} />
            <span className="font-medium text-foreground/80">
              {t("row.submitted")}:
            </span>{" "}
            {formatRelativeSubmitted(action.created_at, t)}
          </span>,
        ]
      : []),
    ...(!isPending && action.resolved_at
      ? [
          <span key="resolved" className="flex items-center gap-1">
            <CalendarClock size={12} />
            <span className="font-medium text-foreground/80">
              {t("row.resolved")}:
            </span>{" "}
            {formatDateTime(action.resolved_at)}
          </span>,
        ]
      : []),
    ...(isApproved && action.approver_snapshot
      ? [
          <span key="approvedBy" className="flex items-center gap-1">
            <UserRound size={12} />
            <span className="font-medium text-foreground/80">
              {t("row.approvedBy")}:
            </span>{" "}
            {getApproverName(action)}
          </span>,
        ]
      : []),
    ...(isRejected && action.approver_snapshot
      ? [
          <span key="rejectedBy" className="flex items-center gap-1">
            <UserRound size={12} />
            <span className="font-medium text-foreground/80">
              {t("row.rejectedBy")}:
            </span>{" "}
            {getApproverName(action)}
          </span>,
        ]
      : []),
    ...(isPending && action.expires_at
      ? [
          <span
            key="expires"
            className="flex items-center gap-1 text-amber-600 font-medium"
          >
            <Clock size={12} />
            {t("row.expires")} {formatRelativeExpiry(action.expires_at, t)}
          </span>,
        ]
      : []),
    ...(action.tenant_id
      ? [
          <span key="tenant" className="flex items-center gap-1">
            <Building2 size={12} />
            {action.tenant_id}
          </span>,
        ]
      : []),
  ]

  return (
    // NOTE: raw <button> — needs ref for scroll-to-highlight; full-width row layout requires full style control that Button's reset classes would conflict with
    <button
      ref={ref}
      type="button"
      className={cn(
        "w-full text-left flex items-center justify-between px-4 py-4 bg-white rounded-lg border border-border cursor-pointer hover:bg-slate-50 transition-colors",
        BORDER_COLOR[action.status]
      )}
      style={
        isHighlighted
          ? { animation: "row-highlight-fade 2s ease-out forwards" }
          : undefined
      }
      data-testid={`approval-row-${action.id}`}
      onClick={() => onViewDetails(action)}
    >
      {/* Left: info */}
      <div className="flex flex-col gap-2 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full shrink-0 mt-0.5",
              DOT_COLOR[action.status]
            )}
          />
          <span className="text-sm font-medium text-foreground">
            {t(`actionTypes.${action.action_type}`)}
          </span>
          <ActionStatusBadge status={action.status} />
        </div>

        {/* Meta row with dot separators */}
        <div className="flex flex-wrap items-center gap-y-1 pl-4 text-xs text-muted-foreground">
          {metaItems.flatMap((item, i) =>
            i === 0
              ? [item]
              : [
                  <span
                    key={`sep-${i}`}
                    className="mx-1.5 text-muted-foreground/40 select-none"
                  >
                    ·
                  </span>,
                  item,
                ]
          )}
        </div>
      </div>

      {/* Right: CTA */}
      <div className="shrink-0 ml-6 flex flex-col items-end gap-1">
        {isPending && canReview && !isOwnSubmission && (
          <Button
            size="sm"
            data-testid={`review-btn-${action.id}`}
            onClick={e => {
              e.stopPropagation()
              onReview(action)
            }}
          >
            {t("row.reviewRequest")}
          </Button>
        )}
        {isPending && isOwnSubmission && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground italic">
              {t("row.youSubmitted")}
            </span>
            <Button
              size="sm"
              variant="outline"
              data-testid={`withdraw-btn-${action.id}`}
              onClick={e => {
                e.stopPropagation()
                onWithdraw(action)
              }}
            >
              {t("row.withdraw")}
            </Button>
          </div>
        )}
        {isExpired && isOwnSubmission && (
          <Button
            size="sm"
            variant="outline"
            data-testid={`re-initiate-btn-${action.id}`}
            onClick={e => {
              e.stopPropagation()
              onReInitiate(action)
            }}
          >
            {t("row.reInitiate")}
          </Button>
        )}
      </div>
    </button>
  )
}
