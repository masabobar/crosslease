import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SquarePen } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DetailRow,
  SectionCard,
} from "@/features/users/components/UserDetailPrimitives"
import { EmailChangeConfirmDialog } from "@/features/users/components/EmailChangeConfirmDialog"
import { useChangeEmail } from "@/features/users/hooks/useChangeEmail"
import { useEditUser } from "@/features/users/hooks/useEditUser"
import { buildIdentityPatch } from "@/features/users/utils"
import { FieldMessage } from "@/features/users/components/FieldMessage"
import { useToastStore } from "@/store/toastStore"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import {
  AdminIdentityFormSchema,
  UserStatusSchema,
} from "@/features/users/api/schema"
import type {
  AdminIdentityFormValues,
  UserDetail,
} from "@/features/users/api/schema"

type UserIdentityCardProps = {
  user: UserDetail
  /** The viewer may edit another user's identity fields. */
  canEditIdentity: boolean
  isOwnProfile: boolean
  /** Support and auditor roles do not see the service-account flag. */
  isReadOnlyViewer: boolean
}

/**
 * Identity section of the admin user detail page: read-only rows that swap to inputs in
 * edit mode. Name and phone go to PATCH /users/{id}; an email change is a separate
 * governed action, so the two are submitted independently and reported per outcome.
 */
export function UserIdentityCard({
  user,
  canEditIdentity,
  isOwnProfile,
  isReadOnlyViewer,
}: UserIdentityCardProps) {
  const { t } = useTranslation("users")
  const showToast = useToastStore(s => s.showToast)
  const [isEditing, setIsEditing] = useState(false)
  const [showEmailConfirm, setShowEmailConfirm] = useState(false)
  const [pendingNewEmail, setPendingNewEmail] = useState("")

  const editUserMutation = useEditUser()
  const changeEmailMutation = useChangeEmail()

  const form = useForm<AdminIdentityFormValues>({
    resolver: zodResolver(AdminIdentityFormSchema),
  })

  const isSaving = editUserMutation.isPending || changeEmailMutation.isPending
  const isEmailLocked =
    !!user.pending_email ||
    user.status === UserStatusSchema.enum.invited ||
    user.status === UserStatusSchema.enum.pending_approval

  function startEditing() {
    form.reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number ?? "",
    })
    setIsEditing(true)
  }

  function cancelEditing() {
    form.reset()
    setIsEditing(false)
  }

  function handleSave(values: AdminIdentityFormValues) {
    if (values.email !== user.email) {
      setPendingNewEmail(values.email)
      setShowEmailConfirm(true)
      return
    }
    submitChanges(values, null)
  }

  /** Translated reason for a single rejected outcome, used in the partial-success toasts. */
  function reasonMessage(outcome: PromiseSettledResult<unknown>): string {
    const reason = outcome.status === "rejected" ? outcome.reason : null
    return resolveApiErrorMessage(reason, t)
  }

  function applyFieldErrors(outcome: PromiseSettledResult<unknown>): boolean {
    if (outcome.status !== "rejected") return false
    return applyApiFieldErrors({
      error: outcome.reason,
      fields: Object.keys(form.getValues()),
      setError: form.setError,
    })
  }

  function submitChanges(
    values: AdminIdentityFormValues,
    newEmail: string | null
  ) {
    const { patch, hasChanges } = buildIdentityPatch(values, user)

    const editPromise = hasChanges
      ? editUserMutation.mutateAsync({ userId: user.id, input: patch })
      : Promise.resolve(null)

    const emailPromise = newEmail
      ? changeEmailMutation.mutateAsync({
          userId: user.id,
          input: { new_email: newEmail },
        })
      : Promise.resolve(null)

    // allSettled, not all: the two calls hit different endpoints, so one can
    // persist while the other rejects. Promise.all discarded that distinction and
    // reported a bare error even though the profile change had already been saved.
    void Promise.allSettled([editPromise, emailPromise]).then(
      ([editOutcome, emailOutcome]) => {
        const editFailed = hasChanges && editOutcome.status === "rejected"
        const emailFailed = !!newEmail && emailOutcome.status === "rejected"

        if (editFailed && emailFailed) {
          // Nothing persisted — keep the form open so the user can retry.
          if (!applyFieldErrors(editOutcome)) {
            toast.error(reasonMessage(editOutcome))
          }
          return
        }

        // A field-level rejection is actionable in the form, so stay in edit mode
        // rather than closing it behind a toast the user cannot act on.
        if (editFailed && applyFieldErrors(editOutcome)) return
        if (emailFailed && applyFieldErrors(emailOutcome)) return

        setIsEditing(false)
        setShowEmailConfirm(false)

        if (editFailed) {
          showToast({
            variant: "warning",
            title: t("detail.page.editIdentity.partial.emailOnly.title"),
            message: t("detail.page.editIdentity.partial.emailOnly.message", {
              newEmail,
              reason: reasonMessage(editOutcome),
            }),
          })
          return
        }

        if (emailFailed) {
          showToast({
            variant: "warning",
            title: t("detail.page.editIdentity.partial.profileOnly.title"),
            message: t("detail.page.editIdentity.partial.profileOnly.message", {
              reason: reasonMessage(emailOutcome),
            }),
          })
          return
        }

        if (newEmail) {
          showToast({
            variant: "success",
            title: t("detail.page.editIdentity.emailChangeSuccess.title"),
            message: t("detail.page.editIdentity.emailChangeSuccess.message", {
              newEmail,
              oldEmail: user.email,
            }),
          })
        } else {
          showToast({
            variant: "success",
            title: t("detail.page.editIdentity.success.title"),
            message: t("detail.page.editIdentity.success.message"),
          })
        }
      }
    )
  }

  const canShowEditControls =
    (canEditIdentity || isOwnProfile) &&
    user.status !== UserStatusSchema.enum.deactivated

  return (
    <>
      <form
        className="flex flex-col flex-1"
        onSubmit={form.handleSubmit(handleSave)}
      >
        <SectionCard
          title={t("detail.page.sections.identity")}
          headerActions={
            canShowEditControls ? (
              isEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={isSaving}
                    data-testid="identity-cancel-button"
                  >
                    {t("detail.page.actions.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving}
                    data-testid="identity-save-button"
                  >
                    {t("detail.page.actions.saveChanges")}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  data-testid="identity-edit-button"
                  onClick={startEditing}
                  className="h-auto gap-1 rounded-[10px] px-[10px] py-[4px] text-sm"
                >
                  <SquarePen size={14} />
                  {t("detail.page.actions.edit")}
                </Button>
              )
            ) : null
          }
        >
          <DetailRow label={t("detail.page.fields.userId")}>
            {user.user_id}
          </DetailRow>
          <DetailRow label={t("detail.page.fields.firstName")}>
            {isEditing ? (
              <>
                <Input
                  {...form.register("first_name")}
                  data-testid="identity-first-name-input"
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!form.formState.errors.first_name}
                />
                <FieldMessage
                  error={form.formState.errors.first_name}
                  data-testid="identity-first-name-error"
                />
              </>
            ) : (
              user.first_name
            )}
          </DetailRow>
          <DetailRow label={t("detail.page.fields.lastName")}>
            {isEditing ? (
              <>
                <Input
                  {...form.register("last_name")}
                  data-testid="identity-last-name-input"
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!form.formState.errors.last_name}
                />
                <FieldMessage
                  error={form.formState.errors.last_name}
                  data-testid="identity-last-name-error"
                />
              </>
            ) : (
              user.last_name
            )}
          </DetailRow>
          <DetailRow label={t("detail.page.fields.email")}>
            {isEditing ? (
              <>
                <Input
                  {...form.register("email")}
                  type="email"
                  data-testid="identity-email-input"
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!form.formState.errors.email}
                  disabled={isEmailLocked}
                  title={
                    user.pending_email
                      ? t(
                          "detail.page.editIdentity.emailDisabledVerificationInProgress"
                        )
                      : isEmailLocked
                        ? t("detail.page.editIdentity.emailDisabledPending")
                        : undefined
                  }
                />
                <FieldMessage
                  error={form.formState.errors.email}
                  data-testid="identity-email-error"
                />
              </>
            ) : user.pending_email ? (
              <div className="flex items-end gap-[10px] min-w-0">
                <div className="flex flex-col gap-1 min-w-0">
                  <span>{user.email}</span>
                  <span>{user.pending_email}</span>
                </div>
                <span className="shrink-0 text-xs font-medium text-amber-600">
                  {t("detail.page.editIdentity.pendingVerification")}
                </span>
              </div>
            ) : (
              user.email
            )}
          </DetailRow>
          <DetailRow label={t("detail.page.fields.phoneNumber")}>
            {isEditing ? (
              <>
                <Input
                  {...form.register("phone_number")}
                  data-testid="phone-number-input"
                  placeholder={t("detail.page.fields.phoneNumberPlaceholder")}
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!form.formState.errors.phone_number}
                />
                <FieldMessage
                  error={form.formState.errors.phone_number}
                  data-testid="phone-number-error"
                />
              </>
            ) : (
              (user.phone_number ?? "—")
            )}
          </DetailRow>
          {!isReadOnlyViewer && (
            <DetailRow label={t("detail.page.fields.serviceAccountFlag")}>
              {user.is_service_account !== null &&
              user.is_service_account !== undefined
                ? t(
                    user.is_service_account
                      ? "detail.page.values.enabled"
                      : "detail.page.values.off"
                  )
                : "—"}
            </DetailRow>
          )}
        </SectionCard>
      </form>

      <EmailChangeConfirmDialog
        open={showEmailConfirm}
        currentEmail={user.email}
        newEmail={pendingNewEmail}
        isPending={isSaving}
        onCancel={() => setShowEmailConfirm(false)}
        onConfirm={() => submitChanges(form.getValues(), pendingNewEmail)}
      />
    </>
  )
}
