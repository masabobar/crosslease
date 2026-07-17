import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { DialogModal } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SelectField } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import type { SelectOption } from "@/components/ui/select"
import {
  SUSPENSION_REASONS,
  REACTIVATION_REASONS,
  DEACTIVATION_REASONS,
  DEACTIVATION_REASON_OTHER,
  RESEND_REASONS,
  SuspendUserInputSchema,
  ReactivateUserInputSchema,
  DeactivateUserInputSchema,
  ResendInvitationInputSchema,
} from "@/features/users/api/schema"
import {
  useSuspendUser,
  useReactivateUser,
  useDeactivateUser,
  useResendInvitation,
} from "@/features/users/hooks/useUserActions"
import { ApiError } from "@/lib/api"
import type { UserModalActionType } from "@/features/users/types"

type ActionUser = {
  id: string
  first_name: string
  last_name: string
}

type UserActionModalProps = {
  action: UserModalActionType
  user: ActionUser
  onClose: () => void
  onSuccess: () => void
}

const ACTION_CONFIG = {
  suspend: {
    needsComment: true,
    needsEffectiveFrom: true,
    needsEffectiveUntil: true,
  },
  reactivate: {
    needsComment: true,
    needsEffectiveFrom: false,
    needsEffectiveUntil: false,
  },
  deactivate: {
    needsComment: true,
    needsEffectiveFrom: true,
    needsEffectiveUntil: false,
  },
  "resend-invitation": {
    needsComment: false,
    needsEffectiveFrom: false,
    needsEffectiveUntil: false,
  },
} as const

// Form schemas compose from the canonical API schemas. effective_from is overridden to optional
// so the field can be empty mid-edit; superRefine adds the required-field UX error on submit.
// REACTIVATE and RESEND include the date fields solely to keep the FormValues union type uniform.
const SUSPEND_SCHEMA = SuspendUserInputSchema.extend({
  reason: z.enum(SUSPENSION_REASONS, { error: "required" }),
  effective_from: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.effective_from)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "required",
      path: ["effective_from"],
    })
})

const REACTIVATE_SCHEMA = ReactivateUserInputSchema.extend({
  reason: z.enum(REACTIVATION_REASONS, { error: "required" }),
  effective_from: z.string().optional(),
  effective_until: z.string().optional(),
})

const DEACTIVATE_SCHEMA = DeactivateUserInputSchema.extend({
  reason: z.enum(DEACTIVATION_REASONS, { error: "required" }),
  effective_from: z.string().optional(),
  effective_until: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.effective_from)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "required",
      path: ["effective_from"],
    })
  if (data.reason === DEACTIVATION_REASON_OTHER && !data.comment?.trim())
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "required",
      path: ["comment"],
    })
})

const RESEND_SCHEMA = ResendInvitationInputSchema.extend({
  reason: z.enum(RESEND_REASONS, { error: "required" }),
  comment: z.string().optional(),
  effective_from: z.string().optional(),
  effective_until: z.string().optional(),
})

type SuspendFormValues = z.infer<typeof SUSPEND_SCHEMA>
type ReactivateFormValues = z.infer<typeof REACTIVATE_SCHEMA>
type DeactivateFormValues = z.infer<typeof DEACTIVATE_SCHEMA>
type ResendFormValues = z.infer<typeof RESEND_SCHEMA>
type FormValues =
  | SuspendFormValues
  | ReactivateFormValues
  | DeactivateFormValues
  | ResendFormValues

function getActionSchema(action: UserModalActionType) {
  switch (action) {
    case "suspend":
      return SUSPEND_SCHEMA
    case "reactivate":
      return REACTIVATE_SCHEMA
    case "deactivate":
      return DEACTIVATE_SCHEMA
    case "resend-invitation":
      return RESEND_SCHEMA
  }
}

function UserActionModal({
  action,
  user,
  onClose,
  onSuccess,
}: UserActionModalProps) {
  const { t } = useTranslation("users")
  const { t: tCommon } = useTranslation("common")

  const { mutateAsync: suspend } = useSuspendUser()
  const { mutateAsync: reactivate } = useReactivateUser()
  const { mutateAsync: deactivate } = useDeactivateUser()
  const { mutateAsync: resend } = useResendInvitation()

  const config = ACTION_CONFIG[action]
  const today = new Date().toISOString().split("T")[0]

  const resolveMsg = (msg: string | undefined) =>
    msg === "required" ? tCommon("validation.required") : msg

  const form = useForm<FormValues>({
    resolver: zodResolver(getActionSchema(action)),
    defaultValues: {
      reason: undefined,
      comment: "",
      effective_from: config.needsEffectiveFrom ? today : "",
      effective_until: "",
    },
  })

  const { errors, isSubmitting } = form.formState
  const watchedReason = useWatch({ control: form.control, name: "reason" })
  const name = `${user.first_name} ${user.last_name}`

  function getReasonOptions(): SelectOption[] {
    switch (action) {
      case "suspend":
        return SUSPENSION_REASONS.map(r => ({
          value: r,
          label: t(
            `actions.suspend.reasons.${r}` as "actions.suspend.reasons.other"
          ),
        }))
      case "reactivate":
        return REACTIVATION_REASONS.map(r => ({
          value: r,
          label: t(
            `actions.reactivate.reasons.${r}` as "actions.reactivate.reasons.other"
          ),
        }))
      case "deactivate":
        return DEACTIVATION_REASONS.map(r => ({
          value: r,
          label: t(
            `actions.deactivate.reasons.${r}` as "actions.deactivate.reasons.other"
          ),
        }))
      case "resend-invitation":
        return RESEND_REASONS.map(r => ({
          value: r,
          label: t(
            `actions.resend-invitation.reasons.${r}` as "actions.resend-invitation.reasons.user_request"
          ),
        }))
    }
  }

  const onSubmit = form.handleSubmit(async data => {
    const userId = user.id
    try {
      switch (action) {
        case "suspend": {
          await suspend({
            userId,
            input: {
              reason: data.reason as SuspendFormValues["reason"],
              comment: data.comment?.trim() || undefined,
              effective_from: new Date(data.effective_from!).toISOString(),
              effective_until: data.effective_until
                ? new Date(data.effective_until).toISOString()
                : undefined,
            },
          })
          break
        }
        case "reactivate": {
          await reactivate({
            userId,
            input: {
              reason: data.reason as ReactivateFormValues["reason"],
              comment: data.comment?.trim() || undefined,
            },
          })
          break
        }
        case "deactivate": {
          await deactivate({
            userId,
            input: {
              reason: data.reason as DeactivateFormValues["reason"],
              comment: data.comment?.trim() || undefined,
              effective_from: new Date(data.effective_from!).toISOString(),
            },
          })
          break
        }
        case "resend-invitation": {
          await resend({
            userId,
            input: { reason: data.reason as ResendFormValues["reason"] },
          })
          break
        }
      }
      form.reset()
      onSuccess()
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
          : t("errors.generic")
      )
    }
  })

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  const title =
    action === "suspend"
      ? t("actions.suspend.title")
      : action === "reactivate"
        ? t("actions.reactivate.title")
        : action === "deactivate"
          ? t("actions.deactivate.title")
          : t("actions.resend-invitation.title")

  const subtitle =
    action === "suspend"
      ? t("actions.suspend.subtitle", { name })
      : action === "reactivate"
        ? t("actions.reactivate.subtitle", { name })
        : action === "deactivate"
          ? t("actions.deactivate.subtitle", { name })
          : t("actions.resend-invitation.subtitle", { name })

  const submitLabel =
    action === "suspend"
      ? t("actions.suspend.submit")
      : action === "reactivate"
        ? t("actions.reactivate.submit")
        : action === "deactivate"
          ? t("actions.deactivate.submit")
          : t("actions.resend-invitation.submit")

  return (
    <DialogModal open onOpenChange={handleOpenChange}>
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <form
        onSubmit={onSubmit}
        data-testid="user-action-form"
        className="px-6 py-4 space-y-5"
      >
        {/* Reason */}
        <div>
          <Label htmlFor="reason" error={!!errors.reason} className="mb-1.5">
            {t("actions.fields.reason")}
          </Label>
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <SelectField
                id="reason"
                data-testid="action-reason-select"
                value={field.value}
                onValueChange={field.onChange}
                options={getReasonOptions()}
                placeholder={t("actions.fields.reasonPlaceholder")}
                error={!!errors.reason}
              />
            )}
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.reason.message)}
            </p>
          )}
        </div>

        {/* Effective from + until */}
        {config.needsEffectiveFrom && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="effective_from"
                error={!!errors.effective_from}
                className="mb-1.5"
              >
                {t("actions.fields.effective_from")}
              </Label>
              <Controller
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <DatePicker
                    id="effective_from"
                    data-testid="action-effective-from"
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.effective_from}
                    minDate={new Date()}
                  />
                )}
              />
              {errors.effective_from && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMsg(errors.effective_from.message)}
                </p>
              )}
            </div>
            {config.needsEffectiveUntil && (
              <div>
                <Label htmlFor="effective_until" className="mb-1.5">
                  {t("actions.fields.effective_until")}
                </Label>
                <Controller
                  control={form.control}
                  name="effective_until"
                  render={({ field }) => (
                    <DatePicker
                      id="effective_until"
                      data-testid="action-effective-until"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* Comment */}
        {config.needsComment && (
          <div>
            <Label
              htmlFor="comment"
              error={!!errors.comment}
              className="mb-1.5"
            >
              {action === "deactivate" &&
              watchedReason === DEACTIVATION_REASON_OTHER
                ? t("actions.fields.commentRequired")
                : t("actions.fields.comment")}
            </Label>
            <Textarea
              id="comment"
              data-testid="action-comment-input"
              aria-invalid={!!errors.comment}
              className="bg-background px-4 py-2.5 min-h-[80px] resize-none text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
              placeholder={t("actions.fields.commentPlaceholder")}
              {...form.register("comment")}
            />
            {errors.comment && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.comment.message)}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 pb-2">
          <Button
            type="button"
            variant="outline"
            data-testid="action-cancel-button"
            onClick={() => handleOpenChange(false)}
          >
            {t("modal.actions.cancel")}
          </Button>
          <Button
            type="submit"
            data-testid="action-submit-button"
            variant={action === "deactivate" ? "destructive" : "default"}
            disabled={isSubmitting}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { UserActionModal }
