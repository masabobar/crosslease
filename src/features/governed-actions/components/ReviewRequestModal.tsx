import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  LockIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react"
import { DialogModal, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { useApproveAction } from "@/features/governed-actions/hooks/useApproveAction"
import { useRejectAction } from "@/features/governed-actions/hooks/useRejectAction"
import { ActionStatusBadge } from "@/features/governed-actions/components/ActionStatusBadge"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { USER_ROLES } from "@/features/users/types"
import { formatDateTime } from "@/features/users/utils"
import type { UserRole } from "@/features/users/types"
import {
  roleChangeSnapshot,
  platformInviteSnapshot,
  emailChangeSnapshot,
  initiatorSnapshot,
} from "@/features/governed-actions/api/schema"
import type {
  GovernedAction,
  GovernedActionStatus,
} from "@/features/governed-actions/api/schema"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: GovernedAction | null
  onApproveSuccess: (action: GovernedAction) => void
  onRejectSuccess: (action: GovernedAction) => void
}

function Divider() {
  return <div className="h-px w-full bg-border" />
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

function FieldRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function ChangeBox({
  variant,
  label,
  children,
}: {
  variant: "current" | "proposed"
  label: string
  children: React.ReactNode
}) {
  const styles =
    variant === "current"
      ? {
          wrapper:
            "bg-[rgba(224,52,52,0.1)] border border-[rgba(224,52,52,0.5)] rounded-[10px] flex-1 min-w-0 px-4 py-3",
          label: "text-xs font-semibold text-[#c10007] uppercase",
          value: "text-sm text-[#c10007] mt-1",
        }
      : {
          wrapper:
            "bg-[rgba(22,163,74,0.1)] border border-[rgba(22,163,74,0.5)] rounded-[10px] flex-1 min-w-0 px-4 py-3",
          label: "text-xs font-semibold text-[#008236] uppercase",
          value: "text-sm text-[#008236] mt-1",
        }

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{children}</p>
    </div>
  )
}

function ChainEntry({
  description,
  date,
  status,
}: {
  description: string
  date: string
  status: GovernedActionStatus
}) {
  const dotColor: Record<GovernedActionStatus, string> = {
    pending: "bg-[#d97706]",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    expired: "bg-slate-300",
    withdrawn: "bg-slate-300",
  }

  return (
    <div className="flex items-start gap-2 w-full">
      <div className="flex items-start self-stretch pr-2 pt-1.5 shrink-0">
        <div className={cn("size-2 rounded-full", dotColor[status])} />
      </div>
      <div className="flex flex-1 items-center min-w-0 gap-3">
        <div className="flex flex-col flex-1 min-w-0 opacity-80">
          <p className="text-sm text-foreground">{description}</p>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
        <ActionStatusBadge status={status} />
      </div>
    </div>
  )
}

const MIN_COMMENT_LENGTH = 10

function getAffectedUser(action: GovernedAction): string | null {
  if (action.action_type === "user_platform_invite") {
    return platformInviteSnapshot(action).full_name ?? null
  }
  if (action.action_type === "user_email_change") {
    return emailChangeSnapshot(action).old_email ?? null
  }
  return null
}

export function ReviewRequestModal({
  open,
  onOpenChange,
  action,
  onApproveSuccess,
  onRejectSuccess,
}: Props) {
  const { t } = useTranslation("pendingApprovals")
  const [comment, setComment] = useState("")
  const [commentValidationError, setCommentValidationError] = useState<
    string | null
  >(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [chainExpanded, setChainExpanded] = useState(true)

  const approveAction = useApproveAction()
  const rejectAction = useRejectAction()
  const isPending = approveAction.isPending || rejectAction.isPending

  function handleClose() {
    if (isPending) return
    setComment("")
    setCommentValidationError(null)
    setErrorCode(null)
    onOpenChange(false)
  }

  function handleApprove() {
    if (!action) return
    const trimmed = comment.trim()
    if (trimmed && trimmed.length < MIN_COMMENT_LENGTH) {
      setCommentValidationError(
        t("modal.justificationTooShort", { min: MIN_COMMENT_LENGTH })
      )
      return
    }
    setCommentValidationError(null)
    setErrorCode(null)
    approveAction.mutate(
      { id: action.id, comment: trimmed || undefined },
      {
        onSuccess: () => {
          handleClose()
          onApproveSuccess(action)
        },
        onError: (err: unknown) => {
          setErrorCode(err instanceof ApiError ? err.code : "default")
        },
      }
    )
  }

  function handleReject() {
    if (!action) return
    const trimmed = comment.trim()
    if (!trimmed) {
      setCommentValidationError(t("modal.justificationRequired"))
      return
    }
    if (trimmed.length < MIN_COMMENT_LENGTH) {
      setCommentValidationError(
        t("modal.justificationTooShort", { min: MIN_COMMENT_LENGTH })
      )
      return
    }
    setCommentValidationError(null)
    setErrorCode(null)
    rejectAction.mutate(
      { id: action.id, comment: trimmed },
      {
        onSuccess: () => {
          handleClose()
          onRejectSuccess(action)
        },
        onError: (err: unknown) => {
          setErrorCode(err instanceof ApiError ? err.code : "default")
        },
      }
    )
  }

  if (!action) return null

  const initiator = initiatorSnapshot(action)
  const initiatorName = initiator?.first_name
    ? `${initiator.first_name} ${initiator.last_name}`
    : "—"
  const affectedUser = getAffectedUser(action)

  return (
    <DialogModal open={open} onOpenChange={handleClose}>
      {/* Header */}
      <div className="flex flex-col gap-1 p-4">
        <DialogTitle className="text-base font-medium">
          {t(`actionTypes.${action.action_type}`)}
        </DialogTitle>
        <div className="flex items-center gap-1">
          <LockIcon className="size-4 text-slate-400" />
          <span className="text-xs text-slate-400">
            {t("modal.mfaRequired")}
          </span>
        </div>
      </div>

      <Divider />

      {/* Content */}
      <div className="flex flex-col gap-6 p-4">
        {/* ACTION */}
        <div className="flex flex-col gap-4">
          <SectionLabel>{t("modal.action")}</SectionLabel>
          <div className="flex flex-col gap-3">
            <FieldRow label={t("modal.actionType")}>
              <span>{t(`actionTypes.${action.action_type}`)}</span>
            </FieldRow>
            <FieldRow label={t("modal.affectedUser")}>
              <span className="font-semibold">{affectedUser ?? "—"}</span>
            </FieldRow>
            {action.tenant_id && (
              <FieldRow label={t("modal.tenant")}>
                <span>{action.tenant_id}</span>
              </FieldRow>
            )}
          </div>
        </div>

        <Divider />

        {/* CHANGE */}
        <ChangeSection action={action} />

        <Divider />

        {/* SUBMISSION */}
        <div className="flex flex-col gap-4">
          <SectionLabel>{t("modal.submission")}</SectionLabel>
          <div className="flex flex-col gap-3">
            <FieldRow label={t("modal.submittedByLabel")}>
              <span className="font-semibold">{initiatorName}</span>
            </FieldRow>
            <FieldRow label={t("modal.roleAtTime")}>
              {initiator?.role &&
              USER_ROLES.includes(initiator.role as UserRole) ? (
                <RoleBadge role={initiator.role as UserRole} />
              ) : initiator?.role ? (
                <span>{initiator.role}</span>
              ) : (
                <span>—</span>
              )}
            </FieldRow>
            <FieldRow label={t("modal.tenantAtTime")}>
              <span>{initiator?.tenant_id ?? "—"}</span>
            </FieldRow>
            <FieldRow label={t("modal.submittedAt")}>
              <span>
                {action.created_at ? formatDateTime(action.created_at) : "—"}
              </span>
            </FieldRow>
          </div>
        </div>

        {/* REASON FROM SUBMITTER */}
        {action.reason && (
          <>
            <Divider />
            <div className="flex flex-col gap-4">
              <SectionLabel>{t("modal.reasonFromSubmitter")}</SectionLabel>
              <div className="border-l-[3px] border-primary bg-slate-100 rounded-xl px-4 py-4">
                <p className="text-sm text-foreground/80">
                  &ldquo;{action.reason}&rdquo;
                </p>
              </div>
            </div>
          </>
        )}

        {/* REQUEST CHAIN */}
        <Divider />
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionLabel>{t("modal.requestChain")}</SectionLabel>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setChainExpanded(v => !v)}
              className="h-auto p-0 gap-1 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              <span>1 {t("modal.request")}</span>
              {chainExpanded ? (
                <ChevronUpIcon className="size-4" />
              ) : (
                <ChevronDownIcon className="size-4" />
              )}
            </Button>
          </div>
          {chainExpanded && (
            <ChainEntry
              description={t("modal.chainCurrentRequest")}
              date={action.created_at ? formatDateTime(action.created_at) : "—"}
              status={action.status}
            />
          )}
        </div>

        <Divider />

        {/* YOUR JUSTIFICATION */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">
            {t("modal.justificationLabel")}
          </Label>
          <div className="border border-border rounded-xl bg-white px-2.5 py-1">
            <Textarea
              className="h-16 border-0 p-0 rounded-none resize-none text-sm focus-visible:ring-0 focus-visible:border-0"
              value={comment}
              onChange={e => {
                setComment(e.target.value)
                setCommentValidationError(null)
                setErrorCode(null)
              }}
              data-testid="review-comment-input"
            />
          </div>
          {commentValidationError ? (
            <p className="text-xs text-destructive">{commentValidationError}</p>
          ) : errorCode ? (
            <p className="text-xs text-destructive" data-testid="modal-error">
              {t(`modal.errors.${errorCode}`, {
                defaultValue: t("modal.errors.default"),
              })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/80">
              {t("modal.justificationHint")}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t bg-gradient-to-b from-white/50 to-slate-100/80 px-4 py-4">
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isPending}
          data-testid="review-cancel-btn"
        >
          {t("modal.cancel")}
        </Button>
        <Button
          variant="destructive"
          onClick={handleReject}
          disabled={isPending}
          data-testid="review-reject-btn"
        >
          {t("modal.reject")}
        </Button>
        <Button
          onClick={handleApprove}
          disabled={isPending}
          data-testid="review-approve-btn"
        >
          {t("modal.approve")}
        </Button>
      </div>
    </DialogModal>
  )
}

function ChangeSection({ action }: { action: GovernedAction }) {
  const { t } = useTranslation("pendingApprovals")

  if (action.action_type === "user_role_change") {
    const s = roleChangeSnapshot(action)
    return (
      <div className="flex flex-col gap-4">
        <SectionLabel>{t("modal.change")}</SectionLabel>
        <div className="flex items-center gap-2">
          <ChangeBox variant="current" label={t("modal.current")}>
            {s.old_role
              ? t(`roles.${s.old_role}`, { defaultValue: s.old_role })
              : "—"}
          </ChangeBox>
          <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
          <ChangeBox variant="proposed" label={t("modal.proposed")}>
            {s.new_role
              ? t(`roles.${s.new_role}`, { defaultValue: s.new_role })
              : "—"}
          </ChangeBox>
        </div>
      </div>
    )
  }

  if (action.action_type === "user_email_change") {
    const s = emailChangeSnapshot(action)
    return (
      <div className="flex flex-col gap-4">
        <SectionLabel>{t("modal.change")}</SectionLabel>
        <div className="flex items-center gap-2">
          <ChangeBox variant="current" label={t("modal.current")}>
            {s.old_email ?? "—"}
          </ChangeBox>
          <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
          <ChangeBox variant="proposed" label={t("modal.proposed")}>
            {s.new_email ?? "—"}
          </ChangeBox>
        </div>
      </div>
    )
  }

  if (action.action_type === "user_platform_invite") {
    const s = platformInviteSnapshot(action)
    return (
      <div className="flex flex-col gap-4">
        <SectionLabel>{t("modal.change")}</SectionLabel>
        <div className="flex flex-col gap-3">
          <FieldRow label={t("modal.email")}>
            <span>{s.email ?? "—"}</span>
          </FieldRow>
          <FieldRow label={t("modal.actionType")}>
            <span>
              {s.role_label
                ? t(`roles.${s.role_label}`, { defaultValue: s.role_label })
                : "—"}
            </span>
          </FieldRow>
        </div>
      </div>
    )
  }

  return null
}
