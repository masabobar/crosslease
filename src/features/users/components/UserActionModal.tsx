import { useForm, Controller, useWatch } from "react-hook-form"
import { parseISO } from "date-fns"
import {
  calendarDateToUtcInstant,
  todayCalendarDate,
} from "@/features/users/api/schema"
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
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { USER_ACTION_TYPE } from "@/features/users/types"
import type { UserModalActionType } from "@/features/users/types"
import { resolveFieldMessage } from "@/features/users/utils"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

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
  [USER_ACTION_TYPE.SUSPEND]: {
    needsComment: true,
    needsEffectiveFrom: true,
    needsEffectiveUntil: true,
  },
  [USER_ACTION_TYPE.REACTIVATE]: {
    needsComment: true,
    needsEffectiveFrom: false,
    needsEffectiveUntil: false,
  },
  [USER_ACTION_TYPE.DEACTIVATE]: {
    needsComment: true,
    needsEffectiveFrom: true,
    needsEffectiveUntil: false,
  },
  [USER_ACTION_TYPE.RESEND_INVITATION]: {
    needsComment: false,
    needsEffectiveFrom: false,
    needsEffectiveUntil: false,
  },
} as const satisfies Record<UserModalActionType, unknown>

// Form schemas compose from the canonical API schemas. effective_from is overridden to optional
// so the field can be empty mid-edit; superRefine adds the required-field UX error on submit.
// REACTIVATE and RESEND include the date fields solely to keep the FormValues union type uniform.
// Both date rules mirror the pickers below exactly, per .claude/rules/date-inputs.md §1:
// a calendar bound with no schema rule is only a suggestion, since a value can still
// arrive from a default, a reset or a programmatic setValue.
const SUSPEND_SCHEMA = SuspendUserInputSchema.extend({
  reason: z.enum(SUSPENSION_REASONS, { error: "required" }),
  effective_from: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.effective_from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "required",
      path: ["effective_from"],
    })
    return
  }
  // Inclusive floor — today is a legal start, matching `minDate={new Date()}`.
  if (data.effective_from < todayCalendarDate())
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "dateNotInPast",
      path: ["effective_from"],
    })
  // A suspension that lifts before it starts is not a period.
  if (data.effective_until && data.effective_until < data.effective_from)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "dateMustBeAfterFrom",
      path: ["effective_until"],
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
  if (!data.effective_from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "required",
      path: ["effective_from"],
    })
  } else if (data.effective_from < todayCalendarDate()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "dateNotInPast",
      path: ["effective_from"],
    })
  }
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

const ACTION_SCHEMAS = {
  [USER_ACTION_TYPE.SUSPEND]: SUSPEND_SCHEMA,
  [USER_ACTION_TYPE.REACTIVATE]: REACTIVATE_SCHEMA,
  [USER_ACTION_TYPE.DEACTIVATE]: DEACTIVATE_SCHEMA,
  [USER_ACTION_TYPE.RESEND_INVITATION]: RESEND_SCHEMA,
} as const

// Reason option lists, keyed by action so the four-branch switch collapses to a lookup.
const ACTION_REASONS = {
  [USER_ACTION_TYPE.SUSPEND]: SUSPENSION_REASONS,
  [USER_ACTION_TYPE.REACTIVATE]: REACTIVATION_REASONS,
  [USER_ACTION_TYPE.DEACTIVATE]: DEACTIVATION_REASONS,
  [USER_ACTION_TYPE.RESEND_INVITATION]: RESEND_REASONS,
} as const

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
  // Local calendar date, not `toISOString()`. In any UTC+ timezone the UTC date is a day
  // behind local between midnight and the offset, which pre-filled this form with a date
  // the `minDate` below greys out and submitted a past `effective_from`.
  const today = todayCalendarDate()

  const resolveMsg = (msg: string | undefined) =>
    resolveFieldMessage(msg, tCommon)

  const form = useForm<FormValues>({
    resolver: zodResolver(ACTION_SCHEMAS[action]),
    defaultValues: {
      reason: undefined,
      comment: "",
      effective_from: config.needsEffectiveFrom ? today : "",
      effective_until: "",
    },
  })

  const { errors, isSubmitting } = form.formState
  const watchedReason = useWatch({ control: form.control, name: "reason" })
  const effectiveFrom = useWatch({
    control: form.control,
    name: "effective_from",
  })
  const name = `${user.first_name} ${user.last_name}`

  function getReasonOptions(): SelectOption[] {
    return ACTION_REASONS[action].map(reason => ({
      value: reason,
      label: t(
        `actions.${action}.reasons.${reason}` as "actions.suspend.reasons.other"
      ),
    }))
  }

  const onSubmit = form.handleSubmit(async data => {
    const userId = user.id
    try {
      switch (action) {
        case USER_ACTION_TYPE.SUSPEND: {
          await suspend({
            userId,
            input: {
              reason: data.reason as SuspendFormValues["reason"],
              comment: data.comment?.trim() || undefined,
              effective_from: calendarDateToUtcInstant(data.effective_from!),
              effective_until: data.effective_until
                ? calendarDateToUtcInstant(data.effective_until)
                : undefined,
            },
          })
          break
        }
        case USER_ACTION_TYPE.REACTIVATE: {
          await reactivate({
            userId,
            input: {
              reason: data.reason as ReactivateFormValues["reason"],
              comment: data.comment?.trim() || undefined,
            },
          })
          break
        }
        case USER_ACTION_TYPE.DEACTIVATE: {
          await deactivate({
            userId,
            input: {
              reason: data.reason as DeactivateFormValues["reason"],
              comment: data.comment?.trim() || undefined,
              effective_from: calendarDateToUtcInstant(data.effective_from!),
            },
          })
          break
        }
        case USER_ACTION_TYPE.RESEND_INVITATION: {
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
      if (
        applyApiFieldErrors({
          error: err,
          fields: Object.keys(form.getValues()),
          setError: form.setError,
        })
      )
        return

      toast.error(resolveApiErrorMessage(err, t))
    }
  })

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset()
      onClose()
    }
  }

  const title = t(`actions.${action}.title` as "actions.suspend.title")
  const subtitle = t(
    `actions.${action}.subtitle` as "actions.suspend.subtitle",
    {
      name,
    }
  )
  const submitLabel = t(`actions.${action}.submit` as "actions.suspend.submit")

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
                    captionLayout="dropdown"
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
                <Label
                  htmlFor="effective_until"
                  error={!!errors.effective_until}
                  className="mb-1.5"
                >
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
                      // Floor is the chosen start, not today: an access period that ends
                      // before it begins is not a period. Its sibling above already floors
                      // at today; this one tracks the watched start value instead.
                      // Inclusive, matching the schema's `effective_until < effective_from`.
                      error={!!errors.effective_until}
                      minDate={
                        effectiveFrom ? parseISO(effectiveFrom) : new Date()
                      }
                      captionLayout="dropdown"
                    />
                  )}
                />
                {errors.effective_until && (
                  <p className="mt-1 text-sm text-destructive">
                    {resolveMsg(errors.effective_until.message)}
                  </p>
                )}
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
              {action === USER_ACTION_TYPE.DEACTIVATE &&
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
            variant={
              action === USER_ACTION_TYPE.DEACTIVATE ? "destructive" : "default"
            }
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
