import { useState } from "react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SquarePen } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AvatarUploadMenu } from "@/features/users/components/AvatarUploadMenu"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { useProfilePicture } from "@/features/users/hooks/useProfilePicture"
import { useUpdateSelf } from "@/features/users/hooks/useUpdateSelf"
import { useToastStore } from "@/store/toastStore"
import { getInitials } from "@/lib/formatters"
import type { UserDetail } from "@/features/users/api/schema"
import { SelfIdentityFormSchema } from "@/features/users/api/schema"
import type { SelfIdentityFormValues } from "@/features/users/api/schema"
import { buildIdentityPatch } from "@/features/users/utils"
import {
  DetailRow,
  SectionCard,
} from "@/features/users/components/UserDetailPrimitives"
import { UserDetailSkeleton } from "@/features/users/components/UserDetailSkeleton"
import { UserDetailTabsCard } from "@/features/users/components/UserDetailTabsCard"
import { UserHeroCard } from "@/features/users/components/UserHeroCard"
import { UserRoleScopeCard } from "@/features/users/components/UserRoleScopeCard"

function SelfProfileContent({ user }: { user: UserDetail }) {
  const { t } = useTranslation("users")
  const showToast = useToastStore(s => s.showToast)
  const [isEditing, setIsEditing] = useState(false)

  const {
    isPending: isPicturePending,
    handleFileSelected,
    handleRemovePicture,
  } = useProfilePicture(user.id)
  const updateSelfMutation = useUpdateSelf(user.id)

  const identityForm = useForm<SelfIdentityFormValues>({
    resolver: zodResolver(SelfIdentityFormSchema),
  })

  const initials = getInitials(user.first_name, user.last_name)
  const name = `${user.first_name} ${user.last_name}`

  function handleIdentitySubmit(values: SelfIdentityFormValues) {
    const { patch, hasChanges } = buildIdentityPatch(values, user)

    if (!hasChanges) {
      setIsEditing(false)
      return
    }

    void updateSelfMutation
      .mutateAsync(patch)
      .then(() => {
        setIsEditing(false)
        showToast({
          variant: "success",
          title: t("detail.page.editIdentity.success.title"),
          message: t("detail.page.editIdentity.success.message"),
        })
      })
      .catch((err: unknown) => {
        if (
          applyApiFieldErrors({
            error: err,
            fields: Object.keys(identityForm.getValues()),
            setError: identityForm.setError,
          })
        )
          return

        toast.error(
          err instanceof ApiError
            ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")
        )
      })
  }

  return (
    <div className="flex flex-col gap-6">
      <UserHeroCard
        user={user}
        avatar={
          <AvatarUploadMenu
            name={name}
            initials={initials}
            profilePictureUrl={user.profile_picture_url}
            isPending={isPicturePending}
            onFileSelected={handleFileSelected}
            onRemove={handleRemovePicture}
          />
        }
      />

      {/* Identity + Role cards */}
      <div className="flex gap-6">
        <form
          onSubmit={identityForm.handleSubmit(handleIdentitySubmit)}
          className="flex flex-col flex-1"
        >
          <SectionCard
            title={t("detail.page.sections.identity")}
            headerActions={
              isEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={updateSelfMutation.isPending}
                    data-testid="identity-cancel-button"
                  >
                    {t("detail.page.actions.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateSelfMutation.isPending}
                    data-testid="identity-save-button"
                  >
                    {t("detail.page.actions.saveChanges")}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  data-testid="identity-edit-button"
                  onClick={() => {
                    identityForm.reset({
                      first_name: user.first_name,
                      last_name: user.last_name,
                      phone_number: user.phone_number ?? "",
                    })
                    setIsEditing(true)
                  }}
                  className="h-auto gap-1 rounded-[10px] px-[10px] py-[4px] text-sm"
                >
                  <SquarePen size={14} />
                  {t("detail.page.actions.edit")}
                </Button>
              )
            }
          >
            <DetailRow label={t("detail.page.fields.userId")}>
              {user.user_id}
            </DetailRow>
            <DetailRow label={t("detail.page.fields.firstName")}>
              {isEditing ? (
                <Input
                  {...identityForm.register("first_name")}
                  data-testid="identity-first-name-input"
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!identityForm.formState.errors.first_name}
                />
              ) : (
                user.first_name
              )}
            </DetailRow>
            <DetailRow label={t("detail.page.fields.lastName")}>
              {isEditing ? (
                <Input
                  {...identityForm.register("last_name")}
                  data-testid="identity-last-name-input"
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!identityForm.formState.errors.last_name}
                />
              ) : (
                user.last_name
              )}
            </DetailRow>
            <DetailRow label={t("detail.page.fields.email")}>
              {isEditing ? (
                <Input
                  value={user.email}
                  type="email"
                  data-testid="identity-email-input"
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  disabled
                  readOnly
                />
              ) : (
                user.email
              )}
            </DetailRow>
            <DetailRow label={t("detail.page.fields.phoneNumber")}>
              {isEditing ? (
                <Input
                  {...identityForm.register("phone_number")}
                  data-testid="phone-number-input"
                  placeholder={t("detail.page.fields.phoneNumberPlaceholder")}
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!identityForm.formState.errors.phone_number}
                />
              ) : (
                (user.phone_number ?? "—")
              )}
            </DetailRow>
          </SectionCard>
        </form>

        <UserRoleScopeCard user={user} />
      </div>

      <UserDetailTabsCard user={user} variant="self" />
    </div>
  )
}

export default function SelfProfilePage() {
  const { t } = useTranslation("users")
  const { data: currentUser, isError: isCurrentUserError } = useCurrentUser()
  const {
    data: user,
    isLoading,
    isError,
  } = useUserDetail(currentUser?.id ?? null)

  return (
    <div className="p-8" data-testid="self-profile-page">
      {isLoading && <UserDetailSkeleton />}

      {(isError || isCurrentUserError) && !isLoading && (
        <div
          className="flex items-center justify-center h-40"
          data-testid="self-profile-error"
        >
          <p className="text-sm text-muted-foreground">
            {t("detail.loadError")}
          </p>
        </div>
      )}

      {user && !isLoading && <SelfProfileContent user={user} />}
    </div>
  )
}
