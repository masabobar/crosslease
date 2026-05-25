import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { DialogModal } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import type { SelectOption } from "@/components/ui/select"
import {
  SUSPENSION_REASONS,
  REACTIVATION_REASONS,
  DEACTIVATION_REASONS,
  RESEND_REASONS,
} from "@/features/users/api/schema"
import type {
  SuspensionReason,
  ReactivationReason,
  DeactivationReason,
  ResendReason,
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
  const required = tCommon("validation.required")
  const today = new Date().toISOString().split("T")[0]

  const formSchema = z
    .object({
      reason: z.string().min(1, required),
      comment: z.string().optional(),
      effective_from: z.string().optional(),
      effective_until: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (config.needsEffectiveFrom && !data.effective_from) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: required,
          path: ["effective_from"],
        })
      }
    })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      comment: "",
      effective_from: config.needsEffectiveFrom ? today : "",
      effective_until: "",
    },
  })

  const { errors, isSubmitting } = form.formState
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
        case "suspend":
          await suspend({
            userId,
            input: {
              reason: data.reason as SuspensionReason,
              comment: data.comment?.trim() || undefined,
              effective_from: new Date(data.effective_from!).toISOString(),
              effective_until: data.effective_until
                ? new Date(data.effective_until).toISOString()
                : undefined,
            },
          })
          break
        case "reactivate":
          await reactivate({
            userId,
            input: {
              reason: data.reason as ReactivationReason,
              comment: data.comment?.trim() || undefined,
            },
          })
          break
        case "deactivate":
          await deactivate({
            userId,
            input: {
              reason: data.reason as DeactivationReason,
              comment: data.comment?.trim() || undefined,
              effective_from: new Date(data.effective_from!).toISOString(),
            },
          })
          break
        case "resend-invitation":
          await resend({
            userId,
            input: { reason: data.reason as ResendReason },
          })
          break
      }
      form.reset()
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError("root", { message: err.message })
      }
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

      <form onSubmit={onSubmit} className="px-6 py-4 space-y-5">
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
              {errors.reason.message}
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
              <Input
                id="effective_from"
                type="date"
                error={!!errors.effective_from}
                {...form.register("effective_from")}
              />
              {errors.effective_from && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.effective_from.message}
                </p>
              )}
            </div>
            {config.needsEffectiveUntil && (
              <div>
                <Label htmlFor="effective_until" className="mb-1.5">
                  {t("actions.fields.effective_until")}
                </Label>
                <Input
                  id="effective_until"
                  type="date"
                  {...form.register("effective_until")}
                />
              </div>
            )}
          </div>
        )}

        {/* Comment */}
        {config.needsComment && (
          <div>
            <Label htmlFor="comment" className="mb-1.5">
              {t("actions.fields.comment")}
            </Label>
            <textarea
              id="comment"
              className="w-full bg-background border border-border text-foreground text-sm rounded-lg outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary px-4 py-2.5 min-h-[80px] resize-none"
              placeholder={t("actions.fields.commentPlaceholder")}
              {...form.register("comment")}
            />
          </div>
        )}

        {/* Root error */}
        {errors.root && (
          <p className="text-sm text-destructive">{errors.root.message}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 pb-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            {t("modal.actions.cancel")}
          </Button>
          <Button
            type="submit"
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
