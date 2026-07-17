import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { LockIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react"
import { DialogModal, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { useApproveAction } from "@/features/governed-actions/hooks/useApproveAction"
import { useRejectAction } from "@/features/governed-actions/hooks/useRejectAction"
import { ChangeSection } from "@/features/governed-actions/components/ChangeSection"
import { FieldRow } from "@/features/governed-actions/components/FieldRow"
import { ChainEntry } from "@/features/governed-actions/components/ChainEntry"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { USER_ROLES } from "@/features/users/types"
import { formatDateTime } from "@/lib/formatters"
import type { UserRole } from "@/features/users/types"
import {
  getGovernedActionSubject,
  HAS_CHANGE_SECTION,
  type GovernedActionSubjectKind,
} from "@/features/governed-actions/utils"
import {
  initiatorSnapshot,
  REVIEW_COMMENT_MIN_LENGTH,
  ReviewCommentFormSchema,
} from "@/features/governed-actions/api/schema"
import type {
  GovernedAction,
  ReviewCommentForm,
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

type AffectedEntityLabelKey =
  | "modal.affectedUser"
  | "modal.affectedPartner"
  | "modal.affectedTemplate"
  | "modal.affectedTenant"
  | "modal.affectedModule"

const AFFECTED_ENTITY_LABEL_KEY: Record<
  GovernedActionSubjectKind,
  AffectedEntityLabelKey
> = {
  user: "modal.affectedUser",
  partner: "modal.affectedPartner",
  template: "modal.affectedTemplate",
  tenant: "modal.affectedTenant",
  module: "modal.affectedModule",
}

export function ReviewRequestModal({
  open,
  onOpenChange,
  action,
  onApproveSuccess,
  onRejectSuccess,
}: Props) {
  const { t } = useTranslation("pendingApprovals")
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [chainExpanded, setChainExpanded] = useState(true)
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ReviewCommentForm>({
    resolver: zodResolver(ReviewCommentFormSchema),
    defaultValues: { comment: "" },
  })
  const commentField = register("comment")

  const approveAction = useApproveAction()
  const rejectAction = useRejectAction()
  const isPending = approveAction.isPending || rejectAction.isPending

  function handleClose() {
    if (isPending) return
    reset()
    setErrorCode(null)
    setConflictAcknowledged(false)
    onOpenChange(false)
  }

  const handleApprove = handleSubmit(values => {
    if (!action) return
    const trimmed = values.comment.trim()
    setErrorCode(null)
    const isMergeConflictGate = action.action_type === "partner_merge"
    approveAction.mutate(
      {
        id: action.id,
        comment: trimmed || undefined,
        extraParams: isMergeConflictGate
          ? { conflict_acknowledged: true }
          : undefined,
      },
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
  })

  const handleReject = handleSubmit(values => {
    if (!action) return
    const trimmed = values.comment.trim()
    if (!trimmed) {
      setError("comment", {
        type: "required",
        message: "justificationRequired",
      })
      return
    }
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
  })

  if (!action) return null

  const initiator = initiatorSnapshot(action)
  const initiatorName = initiator?.first_name
    ? `${initiator.first_name} ${initiator.last_name}`
    : "—"
  const subject = getGovernedActionSubject(action)
  const isMergeConflictGate = action.action_type === "partner_merge"
  const canApprove = !isMergeConflictGate || conflictAcknowledged

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
            <FieldRow label={t(AFFECTED_ENTITY_LABEL_KEY[subject.kind])}>
              <span className="font-semibold">{subject.value ?? "—"}</span>
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
        {HAS_CHANGE_SECTION.has(action.action_type) && (
          <div className="flex flex-col gap-4">
            <SectionLabel>{t("modal.change")}</SectionLabel>
            <ChangeSection action={action} keyPrefix="modal" />
          </div>
        )}

        {isMergeConflictGate && (
          <>
            <Divider />
            <div className="flex flex-col gap-3">
              <SectionLabel>{t("modal.mergeConflictTitle")}</SectionLabel>
              <Label className="flex items-start gap-2 cursor-pointer font-normal">
                <Checkbox
                  checked={conflictAcknowledged}
                  onCheckedChange={c => setConflictAcknowledged(!!c)}
                  data-testid="review-merge-conflict-checkbox"
                />
                <span className="text-sm text-foreground">
                  {t("modal.mergeConflictAcknowledge")}
                </span>
              </Label>
            </div>
          </>
        )}

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
          <div
            className={cn(
              "border rounded-xl bg-white px-2.5 py-1",
              errors.comment ? "border-destructive" : "border-border"
            )}
          >
            <Textarea
              className="h-16 border-0 p-0 rounded-none resize-none text-sm focus-visible:ring-0 focus-visible:border-0"
              {...commentField}
              onChange={e => {
                void commentField.onChange(e)
                setErrorCode(null)
              }}
              data-testid="review-comment-input"
            />
          </div>
          {errors.comment ? (
            <p className="text-xs text-destructive">
              {t(
                `modal.${errors.comment.message}` as
                  | "modal.justificationRequired"
                  | "modal.justificationTooShort",
                { min: REVIEW_COMMENT_MIN_LENGTH }
              )}
            </p>
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
          disabled={isPending || !canApprove}
          data-testid="review-approve-btn"
        >
          {t("modal.approve")}
        </Button>
      </div>
    </DialogModal>
  )
}
