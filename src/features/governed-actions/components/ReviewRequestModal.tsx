import { useState } from "react"
import { useTranslation } from "react-i18next"
import { DialogModal, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useApproveAction } from "@/features/governed-actions/hooks/useApproveAction"
import { useRejectAction } from "@/features/governed-actions/hooks/useRejectAction"
import type {
  GovernedAction,
  ActorSnapshot,
  PlatformInviteSnapshot,
  RoleChangeSnapshot,
  EmailChangeSnapshot,
} from "@/features/governed-actions/api/schema"

type Verdict = "approved" | "rejected"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: GovernedAction | null
  onSuccess: (verdict: Verdict, action: GovernedAction) => void
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
}

function LabeledField({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value ?? "—"}</span>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  )
}

export function ReviewRequestModal({
  open,
  onOpenChange,
  action,
  onSuccess,
}: Props) {
  const { t } = useTranslation("pendingApprovals")
  const [comment, setComment] = useState("")
  const [rejectWithoutComment, setRejectWithoutComment] = useState(false)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const approveAction = useApproveAction()
  const rejectAction = useRejectAction()

  const isPending = approveAction.isPending || rejectAction.isPending

  function handleClose() {
    if (isPending) return
    setComment("")
    setRejectWithoutComment(false)
    setErrorCode(null)
    onOpenChange(false)
  }

  function handleApprove() {
    if (!action) return
    setErrorCode(null)
    approveAction.mutate(
      { id: action.id, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          handleClose()
          onSuccess("approved", action)
        },
        onError: (err: unknown) => {
          const code =
            err instanceof Error && "code" in err
              ? (err as { code: string }).code
              : "default"
          setErrorCode(code)
        },
      }
    )
  }

  function handleReject() {
    if (!action) return
    if (!comment.trim()) {
      setRejectWithoutComment(true)
      return
    }
    setErrorCode(null)
    rejectAction.mutate(
      { id: action.id, comment: comment.trim() },
      {
        onSuccess: () => {
          handleClose()
          onSuccess("rejected", action)
        },
        onError: (err: unknown) => {
          const code =
            err instanceof Error && "code" in err
              ? (err as { code: string }).code
              : "default"
          setErrorCode(code)
        },
      }
    )
  }

  if (!action) return null

  const initiator = action.initiator_snapshot as unknown as ActorSnapshot
  const initiatorName = initiator?.first_name
    ? `${initiator.first_name} ${initiator.last_name}`
    : "—"

  return (
    <DialogModal open={open} onOpenChange={handleClose}>
      <div className="flex flex-col p-6 gap-5">
        {/* Header */}
        <DialogTitle className="text-base font-semibold">
          {t(`actionTypes.${action.action_type}`)}
        </DialogTitle>

        {/* ACTION section */}
        <div className="flex flex-col gap-3">
          <SectionHeading>{t("modal.action")}</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <LabeledField
              label={t("modal.actionType")}
              value={t(`actionTypes.${action.action_type}`)}
            />
            {action.tenant_id && (
              <LabeledField
                label={t("modal.tenant")}
                value={action.tenant_id}
              />
            )}
          </div>
        </div>

        {/* CHANGE section */}
        <ChangeSection action={action} />

        {/* SUBMITTED BY section */}
        <div className="flex flex-col gap-3">
          <SectionHeading>{t("modal.submittedBy")}</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <LabeledField
              label={t("modal.submittedByLabel")}
              value={initiatorName}
            />
            <LabeledField
              label={t("modal.roleAtTime")}
              value={
                initiator?.role
                  ? t(`roles.${initiator.role}`, {
                      defaultValue: initiator.role,
                    })
                  : "—"
              }
            />
            <LabeledField
              label={t("modal.submittedAt")}
              value={
                action.created_at ? formatDateTime(action.created_at) : "—"
              }
            />
          </div>
          {action.reason && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
              {action.reason}
            </div>
          )}
        </div>

        {/* JUSTIFICATION textarea */}
        <div className="flex flex-col gap-2">
          <SectionHeading>{t("modal.justification")}</SectionHeading>
          <textarea
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={3}
            placeholder={t("modal.justificationPlaceholder")}
            value={comment}
            onChange={e => {
              setComment(e.target.value)
              if (e.target.value.trim()) setRejectWithoutComment(false)
              setErrorCode(null)
            }}
            data-testid="review-comment-input"
          />
          {rejectWithoutComment && (
            <p className="text-xs text-destructive">
              {t("modal.justificationRequired")}
            </p>
          )}
          {errorCode && (
            <p className="text-xs text-destructive" data-testid="modal-error">
              {t(`modal.errors.${errorCode}`, {
                defaultValue: t("modal.errors.default"),
              })}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="-mx-0 flex items-center justify-end gap-2 border-t px-6 py-4">
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
  const snap = action.display_snapshot

  if (action.action_type === "user_role_change") {
    const s = snap as unknown as RoleChangeSnapshot
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading>{t("modal.change")}</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/40 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("modal.current")}
            </span>
            <span className="text-sm text-foreground">
              {s.old_role
                ? t(`roles.${s.old_role}`, { defaultValue: s.old_role })
                : "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("modal.proposed")}
            </span>
            <span className="text-sm font-medium text-foreground">
              {s.new_role
                ? t(`roles.${s.new_role}`, { defaultValue: s.new_role })
                : "—"}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (action.action_type === "user_email_change") {
    const s = snap as unknown as EmailChangeSnapshot
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading>{t("modal.change")}</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/40 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("modal.current")}
            </span>
            <span className="text-sm text-foreground break-all">
              {s.old_email ?? "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("modal.proposed")}
            </span>
            <span className="text-sm font-medium text-foreground break-all">
              {s.new_email ?? "—"}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (action.action_type === "user_platform_invite") {
    const s = snap as unknown as PlatformInviteSnapshot
    return (
      <div className="flex flex-col gap-3">
        <SectionHeading>{t("modal.change")}</SectionHeading>
        <div className="grid grid-cols-2 gap-3">
          <LabeledField label={t("modal.affectedUser")} value={s.full_name} />
          <LabeledField label={t("modal.email")} value={s.email} />
          <LabeledField
            label={t("modal.actionType")}
            value={
              s.role_label
                ? t(`roles.${s.role_label}`, { defaultValue: s.role_label })
                : "—"
            }
          />
        </div>
      </div>
    )
  }

  return null
}
