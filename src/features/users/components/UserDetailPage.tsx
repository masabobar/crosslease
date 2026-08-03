import { useState } from "react"
import { useParams, Navigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserActionModal } from "@/features/users/components/UserActionModal"
import { AvatarUploadMenu } from "@/features/users/components/AvatarUploadMenu"
import { EditAuditorPeriodDialog } from "@/features/users/components/EditAuditorPeriodDialog"
import { EditRoleScopeDialog } from "@/features/users/components/EditRoleScopeDialog"
import { ResetMfaConfirmDialog } from "@/features/users/components/ResetMfaConfirmDialog"
import { UserDetailSkeleton } from "@/features/users/components/UserDetailSkeleton"
import { UserDetailTabsCard } from "@/features/users/components/UserDetailTabsCard"
import { UserHeroCard } from "@/features/users/components/UserHeroCard"
import { UserIdentityCard } from "@/features/users/components/UserIdentityCard"
import { UserLifecycleActions } from "@/features/users/components/UserLifecycleActions"
import { UserRoleScopeCard } from "@/features/users/components/UserRoleScopeCard"
import { UserStatusBanner } from "@/features/users/components/UserStatusBanner"
import { useChangeRole } from "@/features/users/hooks/useChangeRole"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useProfilePicture } from "@/features/users/hooks/useProfilePicture"
import { useResetMfaWithToast } from "@/features/users/hooks/useResetMfaWithToast"
import { useUpdateAccessPeriod } from "@/features/users/hooks/useUpdateAccessPeriod"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { PATHS } from "@/router/paths"
import { getInitials } from "@/lib/formatters"
import { buildActionToastPayload } from "@/features/users/utils"
import { useToastStore } from "@/store/toastStore"
import { useQueryClient } from "@tanstack/react-query"
import { USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type {
  AuditorPeriodFormValues,
  UserDetail,
} from "@/features/users/api/schema"
import { UserStatusSchema } from "@/features/users/api/schema"
import {
  AUDITOR_ROLE,
  READ_ONLY_VIEWER_ROLES,
  ROLE_TRANSITIONS,
  USER_IDENTITY_EDIT_ROLES,
  USER_ROLE_CHANGE_ROLES,
  type UserRole,
  type UserModalActionType,
} from "@/features/users/types"

function UserDetailContent({ user }: { user: UserDetail }) {
  const { t } = useTranslation("users")
  const { data: currentUser } = useCurrentUser()
  const showToast = useToastStore(s => s.showToast)
  const queryClient = useQueryClient()

  const [activeAction, setActiveAction] = useState<UserModalActionType | null>(
    null
  )
  const [isEditingRole, setIsEditingRole] = useState(false)
  const [isEditingAuditorPeriod, setIsEditingAuditorPeriod] = useState(false)
  const [showMfaResetConfirm, setShowMfaResetConfirm] = useState(false)

  const changeRoleMutation = useChangeRole()
  const updateAccessPeriodMutation = useUpdateAccessPeriod()
  const {
    uploadMutation: uploadPictureMutation,
    deleteMutation: deletePictureMutation,
    handleFileSelected,
    handleRemovePicture,
  } = useProfilePicture(user.id)
  const { resetMfa, isPending: isResettingMfa } = useResetMfaWithToast()

  const isOwnProfile = currentUser?.id === user.id
  const canEditIdentity =
    !!currentUser && USER_IDENTITY_EDIT_ROLES.includes(currentUser.role)
  const canChangeRoleScope =
    !!currentUser && USER_ROLE_CHANGE_ROLES.includes(currentUser.role)
  const isReadOnlyViewer =
    !!currentUser?.role && READ_ONLY_VIEWER_ROLES.includes(currentUser.role)

  const initials = getInitials(user.first_name, user.last_name)
  const name = `${user.first_name} ${user.last_name}`

  function handleActionSuccess() {
    if (!activeAction) return
    showToast(buildActionToastPayload(activeAction, name, t))
    setActiveAction(null)
    void queryClient.invalidateQueries({
      queryKey: USERS_QUERY_KEYS.detail(user.id),
    })
  }

  // Both submit handlers deliberately let rejections propagate: the dialog owns the form,
  // so it is the only place a VALIDATION_ERROR's field detail can be attached to an input.
  async function handleRoleSubmit(values: {
    new_role: UserRole
    reason: string
  }) {
    await changeRoleMutation.mutateAsync({ userId: user.id, input: values })
    setIsEditingRole(false)
    showToast({
      variant: "success",
      title: t("detail.page.editRole.success.title"),
      message: t("detail.page.editRole.success.message"),
    })
  }

  async function handleAuditorPeriodSubmit(values: AuditorPeriodFormValues) {
    // The picker yields a plain calendar date; the endpoint expects an ISO instant.
    const isoDate = new Date(
      `${values.new_access_valid_until}T00:00:00.000Z`
    ).toISOString()
    await updateAccessPeriodMutation.mutateAsync({
      userId: user.id,
      input: { ...values, new_access_valid_until: isoDate },
    })
    setIsEditingAuditorPeriod(false)
    showToast({
      variant: "success",
      title: t("detail.page.editRole.accessPeriodSuccess.title"),
      message: t("detail.page.editRole.accessPeriodSuccess.message"),
    })
  }

  // Auditors get their engagement window edited; peer-level role swaps go through the
  // role dialog. Anything else has no configured transition, so no edit affordance.
  function resolveRoleScopeEdit(): (() => void) | undefined {
    if (
      !canChangeRoleScope ||
      user.status === UserStatusSchema.enum.deactivated
    ) {
      return undefined
    }
    if (user.role === AUDITOR_ROLE) {
      return () => setIsEditingAuditorPeriod(true)
    }
    if (ROLE_TRANSITIONS[user.role]?.length) {
      return () => setIsEditingRole(true)
    }
    return undefined
  }

  return (
    <div className="flex flex-col gap-6">
      <UserStatusBanner status={user.status} />

      <UserHeroCard
        user={user}
        avatar={
          isOwnProfile ? (
            <AvatarUploadMenu
              name={name}
              initials={initials}
              profilePictureUrl={user.profile_picture_url}
              isPending={
                uploadPictureMutation.isPending ||
                deletePictureMutation.isPending
              }
              onFileSelected={handleFileSelected}
              onRemove={handleRemovePicture}
            />
          ) : (
            <div className="size-14 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center overflow-hidden">
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={name}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-xl font-normal text-muted-foreground">
                  {initials}
                </span>
              )}
            </div>
          )
        }
        actions={
          <UserLifecycleActions
            user={user}
            viewerRole={currentUser?.role}
            onModalAction={setActiveAction}
            onResetMfa={() => setShowMfaResetConfirm(true)}
          />
        }
      />

      <div className="flex gap-6">
        <UserIdentityCard
          user={user}
          canEditIdentity={canEditIdentity}
          isOwnProfile={isOwnProfile}
          isReadOnlyViewer={isReadOnlyViewer}
        />
        <UserRoleScopeCard user={user} onEdit={resolveRoleScopeEdit()} />
      </div>

      <EditRoleScopeDialog
        open={isEditingRole}
        currentRole={user.role}
        isPending={changeRoleMutation.isPending}
        onClose={() => setIsEditingRole(false)}
        onSubmit={handleRoleSubmit}
      />

      <EditAuditorPeriodDialog
        open={isEditingAuditorPeriod}
        currentAccessValidUntil={user.access_valid_until}
        activatedAt={user.activated_at}
        isPending={updateAccessPeriodMutation.isPending}
        onClose={() => setIsEditingAuditorPeriod(false)}
        onSubmit={handleAuditorPeriodSubmit}
      />

      <UserDetailTabsCard user={user} />

      {activeAction && (
        <UserActionModal
          action={activeAction}
          user={{
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
          }}
          onClose={() => setActiveAction(null)}
          onSuccess={handleActionSuccess}
        />
      )}

      <ResetMfaConfirmDialog
        open={showMfaResetConfirm}
        name={name}
        isPending={isResettingMfa}
        onClose={() => setShowMfaResetConfirm(false)}
        onConfirm={() =>
          resetMfa(user.id, name, () => setShowMfaResetConfirm(false))
        }
      />
    </div>
  )
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation("users")
  const { data: user, isLoading, isError } = useUserDetail(id ?? null)
  const { data: currentUser, isError: isCurrentUserError } = useCurrentUser()

  if (currentUser && id && currentUser.id === id) {
    return <Navigate to={PATHS.SETTINGS_PROFILE} replace />
  }

  return (
    <div className="p-8" data-testid="user-detail-page">
      {isCurrentUserError && (
        <Alert
          variant="destructive"
          className="mb-4"
          data-testid="current-user-error-banner"
        >
          <AlertDescription>
            {t("detail.currentUserLoadError")}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && <UserDetailSkeleton testId="user-detail-loading" />}

      {isError && !isLoading && (
        <div
          data-testid="user-detail-error"
          className="flex items-center justify-center h-40"
        >
          <p className="text-sm text-muted-foreground">
            {t("detail.loadError")}
          </p>
        </div>
      )}

      {user && !isLoading && <UserDetailContent user={user} />}
    </div>
  )
}
