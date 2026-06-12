import { useState, useRef, type ReactNode } from "react"
import { ApiError } from "@/lib/api"
import { useParams, useNavigate, Navigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Mail,
  Clock,
  Calendar,
  SquarePen,
  UserRoundX,
  Ban,
  UserRoundCheck,
  UserCheck,
  ShieldAlert,
  ShieldOff,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge"
import { UserStatusBanner } from "@/features/users/components/UserStatusBanner"
import { UserActionModal } from "@/features/users/components/UserActionModal"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { PATHS } from "@/router/paths"
import {
  formatLastLogin,
  formatDate,
  formatDateTime,
  getInitials,
} from "@/lib/formatters"
import {
  getUserActionVisibility,
  buildActionToastPayload,
  getRoleClassificationKey,
} from "@/features/users/utils"
import {
  DetailRow,
  SectionCard,
} from "@/features/users/components/UserDetailPrimitives"
import { useToastStore } from "@/store/toastStore"
import { useQueryClient } from "@tanstack/react-query"
import { USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import type {
  UserDetail,
  AuditorPeriodUpdateReason,
} from "@/features/users/api/schema"
import {
  UserStatusSchema,
  phoneNumberSchema,
} from "@/features/users/api/schema"
import {
  AUDITOR_DATE_RANGE_ROLES,
  AUDITOR_ROLE,
  READ_ONLY_VIEWER_ROLES,
  ROLE_TRANSITIONS,
  SYSTEM_ADMIN_ROLE,
  type UserRole,
  type UserModalActionType,
} from "@/features/users/types"
import { useEditUser } from "@/features/users/hooks/useEditUser"
import { useChangeEmail } from "@/features/users/hooks/useChangeEmail"
import { useChangeRole } from "@/features/users/hooks/useChangeRole"
import { useUpdateAccessPeriod } from "@/features/users/hooks/useUpdateAccessPeriod"
import { useProfilePicture } from "@/features/users/hooks/useProfilePicture"
import { useResetUserMfa } from "@/features/users/hooks/useUserActions"
import { EditRoleScopeDialog } from "@/features/users/components/EditRoleScopeDialog"
import { EditAuditorPeriodDialog } from "@/features/users/components/EditAuditorPeriodDialog"

type TabKey = "lifecycle" | "auth" | "audit"

function TabButton({
  active,
  onClick,
  children,
  "data-testid": testId,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  "data-testid"?: string
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      data-testid={testId}
      className={`h-auto px-1.5 py-1 rounded-none border-none hover:bg-transparent focus-visible:ring-0 focus-visible:border-none ${
        active
          ? "text-foreground hover:text-foreground"
          : "text-foreground/60 hover:text-foreground/80"
      }`}
    >
      {children}
    </Button>
  )
}

function LifecycleTab({ user }: { user: UserDetail }) {
  const { t } = useTranslation("users")
  return (
    <div className="flex flex-col gap-3 p-3">
      <DetailRow label={t("detail.page.fields.accountStatus")}>
        <UserStatusBadge status={user.status} />
      </DetailRow>
      <DetailRow label={t("detail.page.fields.invitationSent")}>
        {formatDateTime(user.invited_at)}
      </DetailRow>
      <DetailRow label={t("detail.page.fields.activationTimestamp")}>
        {formatDateTime(user.activated_at)}
      </DetailRow>
      <DetailRow label={t("detail.page.fields.lastLogin")}>
        {formatLastLogin(user.last_login, t)}
      </DetailRow>
      <DetailRow label={t("detail.page.fields.lastActivity")}>
        {formatLastLogin(user.last_activity ?? user.last_login, t)}
      </DetailRow>
      <DetailRow label={t("detail.page.fields.lastSuspensionReason")}>
        {user.last_suspension_reason ?? "—"}
      </DetailRow>
      <DetailRow label={t("detail.page.fields.lastDeactivationReason")}>
        {user.last_deactivation_reason ?? "—"}
      </DetailRow>
    </div>
  )
}

function AuthSecurityTab() {
  const { t } = useTranslation("users")
  return (
    <div className="flex gap-20 p-3">
      <div className="flex flex-col gap-3 text-sm text-muted-foreground whitespace-nowrap">
        <span>{t("detail.page.authSecurity.mfaStatus")}</span>
        <span>{t("detail.page.authSecurity.mfaMethod")}</span>
        <span>{t("detail.page.authSecurity.failedLoginAttempts")}</span>
        <span>{t("detail.page.authSecurity.accountLockoutStatus")}</span>
        <span>{t("detail.page.authSecurity.ssoProvider")}</span>
        <span>{t("detail.page.authSecurity.lastMfaReset")}</span>
        <span>{t("detail.page.authSecurity.authPolicy")}</span>
        <span>{t("detail.page.authSecurity.privilegedAccess")}</span>
      </div>
      <div className="flex flex-col gap-3 text-sm text-foreground">
        <span>—</span>
        <span>—</span>
        <span>—</span>
        <span>—</span>
        <span>—</span>
        <span>—</span>
        <span>—</span>
        <span>—</span>
      </div>
    </div>
  )
}

function AuditGovernanceTab() {
  return (
    <div className="p-3 flex items-center justify-center min-h-[80px]">
      <p className="text-sm text-muted-foreground">—</p>
    </div>
  )
}

const IdentityFormSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone_number: phoneNumberSchema.or(z.literal("")).optional(),
})
type IdentityFormValues = z.infer<typeof IdentityFormSchema>

function EmailChangeConfirmDialog({
  open,
  currentEmail,
  newEmail,
  isPending,
  onCancel,
  onConfirm,
}: {
  open: boolean
  currentEmail: string
  newEmail: string
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation("users")
  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onCancel()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[480px] gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle>
            {t("detail.page.editIdentity.confirm.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 py-4 flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("detail.page.editIdentity.confirm.currentEmail")}
              </span>
              <span className="text-foreground">{currentEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("detail.page.editIdentity.confirm.newEmail")}
              </span>
              <span className="text-foreground font-semibold">{newEmail}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-[10px] border border-amber-600 bg-amber-500/10 px-[10px] py-2">
            <ShieldAlert size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-amber-600">
                {t("detail.page.editIdentity.confirm.warning.title")}
              </span>
              <span className="text-sm text-amber-600/80">
                {t("detail.page.editIdentity.confirm.warning.description")}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter className="mx-0 mb-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            data-testid="email-change-cancel"
          >
            {t("detail.page.editIdentity.confirm.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            data-testid="email-change-confirm"
          >
            {t("detail.page.editIdentity.confirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UserDetailContent({ user }: { user: UserDetail }) {
  const { t } = useTranslation("users")
  const { data: currentUser } = useCurrentUser()
  const showToast = useToastStore(s => s.showToast)
  const queryClient = useQueryClient()
  const [activeAction, setActiveAction] = useState<UserModalActionType | null>(
    null
  )
  const [activeTab, setActiveTab] = useState<TabKey>("lifecycle")
  const navigate = useNavigate()
  const [isEditingIdentity, setIsEditingIdentity] = useState(false)
  const [showEmailConfirm, setShowEmailConfirm] = useState(false)
  const [pendingNewEmail, setPendingNewEmail] = useState("")

  const editUserMutation = useEditUser()
  const changeEmailMutation = useChangeEmail()
  const changeRoleMutation = useChangeRole()
  const updateAccessPeriodMutation = useUpdateAccessPeriod()
  const {
    uploadMutation: uploadPictureMutation,
    deleteMutation: deletePictureMutation,
    handleFileSelected,
    handleRemovePicture,
  } = useProfilePicture(user.id)
  const resetMfaMutation = useResetUserMfa()
  const [isEditingRole, setIsEditingRole] = useState(false)
  const [isEditingAuditorPeriod, setIsEditingAuditorPeriod] = useState(false)
  const [showMfaResetConfirm, setShowMfaResetConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const identityForm = useForm<IdentityFormValues>({
    resolver: zodResolver(IdentityFormSchema),
  })

  const isOwnProfile = currentUser?.id === user.id
  const isAdmin = currentUser?.role === SYSTEM_ADMIN_ROLE
  const isReadOnlyViewer =
    currentUser?.role !== null &&
    currentUser?.role !== undefined &&
    READ_ONLY_VIEWER_ROLES.includes(currentUser.role)
  const {
    canApprove,
    canResendInvitation,
    canSuspend,
    canReactivate,
    canDeactivate,
    canResetMfa,
  } = getUserActionVisibility(user.status, user.role, currentUser?.role)

  const initials = getInitials(user.first_name, user.last_name)
  const name = `${user.first_name} ${user.last_name}`

  const accessPeriod = user.access_valid_until
    ? formatDate(user.access_valid_until)
    : "—"

  function handleActionSuccess() {
    if (!activeAction) return
    showToast(buildActionToastPayload(activeAction, name, t))
    setActiveAction(null)
    void queryClient.invalidateQueries({
      queryKey: USERS_QUERY_KEYS.detail(user.id),
    })
  }

  function startEditingIdentity() {
    identityForm.reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number ?? "",
    })
    setIsEditingIdentity(true)
  }

  function cancelEditingIdentity() {
    identityForm.reset()
    setIsEditingIdentity(false)
  }

  function handleSaveIdentity(values: IdentityFormValues) {
    const emailChanged = values.email !== user.email
    if (emailChanged) {
      setPendingNewEmail(values.email)
      setShowEmailConfirm(true)
      return
    }
    submitIdentityChanges(values, null)
  }

  function submitIdentityChanges(
    values: IdentityFormValues,
    newEmail: string | null
  ) {
    const hasNameChanges =
      values.first_name !== user.first_name ||
      values.last_name !== user.last_name
    const hasPhoneChange =
      (values.phone_number ?? "") !== (user.phone_number ?? "")

    const editInput: {
      first_name: string
      last_name: string
      phone_number?: string | null
    } = {
      first_name: values.first_name,
      last_name: values.last_name,
    }
    if (hasPhoneChange) {
      editInput.phone_number =
        values.phone_number === "" ? null : (values.phone_number ?? null)
    }

    const editPromise =
      hasNameChanges || hasPhoneChange
        ? editUserMutation.mutateAsync({ userId: user.id, input: editInput })
        : Promise.resolve(null)

    const emailPromise = newEmail
      ? changeEmailMutation.mutateAsync({
          userId: user.id,
          input: { new_email: newEmail },
        })
      : Promise.resolve(null)

    void Promise.all([editPromise, emailPromise])
      .then(() => {
        setIsEditingIdentity(false)
        setShowEmailConfirm(false)
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
      })
      .catch((err: unknown) => {
        showToast({
          variant: "warning",
          title: t("detail.page.editIdentity.error.title"),
          message:
            err instanceof ApiError
              ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic"),
        })
      })
  }

  const isSaving = editUserMutation.isPending || changeEmailMutation.isPending

  function handleRoleSubmit(values: { new_role: UserRole; reason: string }) {
    void changeRoleMutation
      .mutateAsync({
        userId: user.id,
        input: { new_role: values.new_role, reason: values.reason },
      })
      .then(() => {
        setIsEditingRole(false)
        showToast({
          variant: "success",
          title: t("detail.page.editRole.success.title"),
          message: t("detail.page.editRole.success.message"),
        })
      })
      .catch((err: unknown) => {
        showToast({
          variant: "warning",
          title: t("detail.page.editRole.error.title"),
          message:
            err instanceof ApiError
              ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic"),
        })
      })
  }

  function handleAuditorPeriodSubmit(values: {
    new_access_valid_until: string
    reason: string
  }) {
    const isoDate = new Date(
      values.new_access_valid_until + "T00:00:00.000Z"
    ).toISOString()
    void updateAccessPeriodMutation
      .mutateAsync({
        userId: user.id,
        input: {
          new_access_valid_until: isoDate,
          reason: values.reason as AuditorPeriodUpdateReason,
        },
      })
      .then(() => {
        setIsEditingAuditorPeriod(false)
        showToast({
          variant: "success",
          title: t("detail.page.editRole.accessPeriodSuccess.title"),
          message: t("detail.page.editRole.accessPeriodSuccess.message"),
        })
      })
      .catch((err: unknown) => {
        showToast({
          variant: "warning",
          title: t("detail.page.editRole.error.title"),
          message:
            err instanceof ApiError
              ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic"),
        })
      })
  }

  function handleMfaReset() {
    void resetMfaMutation
      .mutateAsync(user.id)
      .then(() => {
        setShowMfaResetConfirm(false)
        showToast({
          variant: "success",
          title: t("actions.resetMfa.success.title"),
          message: t("actions.resetMfa.success.message", { name }),
        })
      })
      .catch((err: unknown) => {
        setShowMfaResetConfirm(false)
        showToast({
          variant: "warning",
          title: t("errors.generic"),
          message:
            err instanceof ApiError
              ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic"),
        })
      })
  }

  return (
    <div className="flex flex-col gap-6">
      <UserStatusBanner status={user.status} />
      {/* Hero card */}
      <div className="flex flex-col border border-border rounded-[10px]">
        {/* Top row: avatar + name + actions */}
        <div className="bg-card flex items-center justify-between px-3 py-4 rounded-t-[10px]">
          <div className="flex items-center gap-3">
            {isOwnProfile ? (
              <>
                {/* NOTE: raw <input type="file"> — hidden file input triggered programmatically; no shadcn equivalent */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelected}
                  data-testid="avatar-file-input"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    data-testid="avatar-dropdown-trigger"
                    disabled={
                      uploadPictureMutation.isPending ||
                      deletePictureMutation.isPending
                    }
                    className="size-14 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
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
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      data-testid="avatar-replace-photo"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t("detail.page.selfProfile.avatar.replacePhoto")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      data-testid="avatar-remove-photo"
                      disabled={!user.profile_picture_url}
                      onClick={handleRemovePicture}
                    >
                      {t("detail.page.selfProfile.avatar.removePhoto")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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
            )}
            <div className="flex flex-col gap-3">
              <p className="text-2xl font-semibold text-foreground">{name}</p>
              <div className="flex items-center gap-2">
                <RoleBadge role={user.role} />
                <UserStatusBadge status={user.status} />
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-[10px]">
              {canSuspend && (
                <Button
                  variant="outline"
                  data-testid="detail-suspend-button"
                  onClick={() => setActiveAction("suspend")}
                  className="h-auto gap-[6px] rounded-[12px] px-[10px] py-[8px] text-sm"
                >
                  <UserRoundX size={16} />
                  {t("detail.page.actions.suspendUser")}
                </Button>
              )}
              {canReactivate && (
                <Button
                  variant="outline"
                  data-testid="detail-reactivate-button"
                  onClick={() => setActiveAction("reactivate")}
                  className="h-auto gap-[6px] rounded-[12px] px-[10px] py-[8px] text-sm"
                >
                  <UserRoundCheck size={16} />
                  {t("actions.reactivate.label")}
                </Button>
              )}
              {canDeactivate && (
                <Button
                  variant="outline"
                  data-testid="detail-deactivate-button"
                  onClick={() => setActiveAction("deactivate")}
                  className="h-auto gap-[6px] rounded-[12px] px-[10px] py-[8px] text-sm"
                >
                  <Ban size={16} />
                  {t("detail.page.actions.deactivateUser")}
                </Button>
              )}
              {canApprove && (
                <Button
                  variant="outline"
                  data-testid="detail-approve-button"
                  onClick={() =>
                    navigate(PATHS.PENDING_APPROVALS, {
                      state: { highlightUserId: user.id },
                    })
                  }
                  className="h-auto gap-[6px] rounded-[12px] px-[10px] py-[8px] text-sm"
                >
                  <UserCheck size={16} />
                  {t("table.actions.approve")}
                </Button>
              )}
              {canResendInvitation && (
                <Button
                  variant="outline"
                  data-testid="detail-resend-invitation-button"
                  onClick={() => setActiveAction("resend-invitation")}
                  className="h-auto gap-[6px] rounded-[12px] px-[10px] py-[8px] text-sm"
                >
                  <Mail size={16} />
                  {t("actions.resend-invitation.label")}
                </Button>
              )}
              {canResetMfa && (
                <Button
                  variant="outline"
                  data-testid="detail-reset-mfa-button"
                  onClick={() => setShowMfaResetConfirm(true)}
                  className="h-auto gap-[6px] rounded-[12px] px-[10px] py-[8px] text-sm"
                >
                  <ShieldOff size={16} />
                  {t("actions.resetMfa.label")}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Bottom info bar */}
        <div className="bg-muted border-t border-border flex items-center gap-6 px-3 py-3 rounded-b-[10px]">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-muted-foreground" />
            <span className="text-sm text-foreground">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t("detail.page.lastLogin")}
            </span>
            <span className="text-sm text-foreground">
              {formatLastLogin(user.last_login, t)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t("detail.page.activeSince")}
            </span>
            <span className="text-sm text-foreground">
              {formatDate(user.activated_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Identity + Role cards */}
      <div className="flex gap-6">
        <form
          className="flex flex-col flex-1"
          onSubmit={identityForm.handleSubmit(handleSaveIdentity)}
        >
          <SectionCard
            title={t("detail.page.sections.identity")}
            headerActions={
              isAdmin || isOwnProfile ? (
                isEditingIdentity ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelEditingIdentity}
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
                    onClick={startEditingIdentity}
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
              {isEditingIdentity ? (
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
              {isEditingIdentity ? (
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
              {isEditingIdentity ? (
                <Input
                  {...identityForm.register("email")}
                  type="email"
                  data-testid="identity-email-input"
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!identityForm.formState.errors.email}
                  disabled={
                    !!user.pending_email ||
                    user.status === UserStatusSchema.enum.invited ||
                    user.status === UserStatusSchema.enum.pending_approval
                  }
                  title={
                    user.pending_email
                      ? t(
                          "detail.page.editIdentity.emailDisabledVerificationInProgress"
                        )
                      : user.status === UserStatusSchema.enum.invited ||
                          user.status === UserStatusSchema.enum.pending_approval
                        ? t("detail.page.editIdentity.emailDisabledPending")
                        : undefined
                  }
                />
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
              {isEditingIdentity ? (
                <Input
                  {...identityForm.register("phone_number")}
                  data-testid="phone-number-input"
                  placeholder="+1 234 567 8900"
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!identityForm.formState.errors.phone_number}
                />
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

        <SectionCard
          title={t("detail.page.sections.roleScope")}
          onEdit={
            !isAdmin
              ? undefined
              : user.role === AUDITOR_ROLE
                ? () => setIsEditingAuditorPeriod(true)
                : ROLE_TRANSITIONS[user.role] !== undefined
                  ? () => setIsEditingRole(true)
                  : undefined
          }
          data-testid="role-scope-edit-button"
        >
          <DetailRow label={t("detail.page.fields.role")}>
            <RoleBadge role={user.role} />
          </DetailRow>
          <DetailRow label={t("detail.page.fields.roleClassification")}>
            {t(getRoleClassificationKey(user.role))}
          </DetailRow>
          <DetailRow label={t("detail.page.fields.tenant")}>
            {user.tenant_name ?? "—"}
          </DetailRow>
          <DetailRow label={t("detail.page.fields.accessValidityPeriod")}>
            {accessPeriod}
          </DetailRow>
          <DetailRow label={t("detail.page.fields.auditEngagementValidUntil")}>
            {AUDITOR_DATE_RANGE_ROLES.includes(user.role)
              ? formatDate(user.access_valid_until)
              : "—"}
          </DetailRow>
          <DetailRow label={t("detail.page.fields.effectiveTenantScope")}>
            {user.tenant_name ?? "—"}
          </DetailRow>
        </SectionCard>
      </div>

      <EmailChangeConfirmDialog
        open={showEmailConfirm}
        currentEmail={user.email}
        newEmail={pendingNewEmail}
        isPending={isSaving}
        onCancel={() => setShowEmailConfirm(false)}
        onConfirm={() =>
          submitIdentityChanges(identityForm.getValues(), pendingNewEmail)
        }
      />

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

      {/* Tabbed card */}
      <div className="bg-muted border border-border rounded-[10px] flex flex-col">
        <div className="flex items-center h-10 px-3 gap-1 border-b border-border">
          <TabButton
            active={activeTab === "lifecycle"}
            onClick={() => setActiveTab("lifecycle")}
            data-testid="tab-lifecycle"
          >
            {t("detail.page.tabs.lifecycle")}
          </TabButton>
          <TabButton
            active={activeTab === "auth"}
            onClick={() => setActiveTab("auth")}
            data-testid="tab-auth-security"
          >
            {t("detail.page.tabs.authSecurity")}
          </TabButton>
          <TabButton
            active={activeTab === "audit"}
            onClick={() => setActiveTab("audit")}
            data-testid="tab-audit-governance"
          >
            {t("detail.page.tabs.auditGovernance")}
          </TabButton>
        </div>
        <div className="bg-card border border-border rounded-b-[10px]">
          {activeTab === "lifecycle" && <LifecycleTab user={user} />}
          {activeTab === "auth" && <AuthSecurityTab />}
          {activeTab === "audit" && <AuditGovernanceTab />}
        </div>
      </div>

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

      <Dialog
        open={showMfaResetConfirm}
        onOpenChange={o => {
          if (!o) setShowMfaResetConfirm(false)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[480px] gap-0 p-0 overflow-hidden"
        >
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle>{t("actions.resetMfa.title", { name })}</DialogTitle>
          </DialogHeader>
          <div className="px-4 py-4">
            <div className="flex items-start gap-2 rounded-[10px] border border-amber-600 bg-amber-500/10 px-[10px] py-2">
              <ShieldAlert
                size={16}
                className="text-amber-600 mt-0.5 shrink-0"
              />
              <span className="text-sm text-amber-600/80">
                {t("actions.resetMfa.description", { name })}
              </span>
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0">
            <Button
              variant="outline"
              onClick={() => setShowMfaResetConfirm(false)}
              disabled={resetMfaMutation.isPending}
              data-testid="mfa-reset-cancel"
            >
              {t("modal.actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleMfaReset}
              disabled={resetMfaMutation.isPending}
              data-testid="mfa-reset-confirm"
            >
              {t("actions.resetMfa.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation("users")
  const { data: user, isLoading, isError } = useUserDetail(id ?? null)
  const { data: currentUser } = useCurrentUser()

  if (currentUser && id && currentUser.id === id) {
    return <Navigate to={PATHS.SETTINGS_PROFILE} replace />
  }

  return (
    <div className="p-8" data-testid="user-detail-page">
      {isLoading && (
        <div data-testid="user-detail-loading" className="space-y-6">
          <div className="h-28 bg-muted rounded-[10px] animate-pulse" />
          <div className="flex gap-6">
            <div className="flex-1 h-48 bg-muted rounded-[10px] animate-pulse" />
            <div className="flex-1 h-48 bg-muted rounded-[10px] animate-pulse" />
          </div>
          <div className="h-48 bg-muted rounded-[10px] animate-pulse" />
        </div>
      )}

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
