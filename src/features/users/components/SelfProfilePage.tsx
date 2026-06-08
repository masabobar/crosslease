import { useState, useRef, type ReactNode } from "react"
import { ApiError } from "@/lib/api"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Clock, Calendar, SquarePen } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { useUploadSelfPicture } from "@/features/users/hooks/useUploadSelfPicture"
import { useDeleteSelfPicture } from "@/features/users/hooks/useDeleteSelfPicture"
import { useUpdateSelf } from "@/features/users/hooks/useUpdateSelf"
import { useToastStore } from "@/store/toastStore"
import {
  formatLastLogin,
  formatDate,
  formatDateTime,
  getInitials,
} from "@/features/users/utils"
import {
  AUDITOR_DATE_RANGE_ROLES,
  PLATFORM_USER_ROLES,
} from "@/features/users/types"
import type { UserDetail } from "@/features/users/api/schema"
import type { UserRole } from "@/features/users/types"

function getRoleClassificationKey(
  role: UserRole
):
  | "detail.page.roleClassification.platform"
  | "detail.page.roleClassification.tenantOperational" {
  if (PLATFORM_USER_ROLES.includes(role))
    return "detail.page.roleClassification.platform"
  return "detail.page.roleClassification.tenantOperational"
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-2 py-0 text-sm leading-5">
      <span className="text-muted-foreground w-[180px] shrink-0">{label}</span>
      <span className="text-foreground min-w-0">{children}</span>
    </div>
  )
}

function SectionCard({
  title,
  children,
  headerActions,
}: {
  title: string
  children: ReactNode
  headerActions?: ReactNode
}) {
  return (
    <div className="bg-muted border border-border rounded-[10px] flex flex-col flex-1 min-w-0">
      <div className="flex items-center justify-between h-10 px-3">
        <span className="text-xs font-semibold text-foreground tracking-wide">
          {title}
        </span>
        {headerActions}
      </div>
      <div className="bg-card border border-border rounded-b-[10px] p-3 flex flex-col gap-3 flex-1">
        {children}
      </div>
    </div>
  )
}

const PhoneFormSchema = z.object({
  phone_number: z
    .string()
    .regex(/^\+?[0-9\s\-()\s]{7,30}$/, "Invalid phone number format")
    .or(z.literal("")),
})
type PhoneFormValues = z.infer<typeof PhoneFormSchema>

function SelfProfileContent({ user }: { user: UserDetail }) {
  const { t } = useTranslation("users")
  const showToast = useToastStore(s => s.showToast)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [activeTab, setActiveTab] = useState<"lifecycle" | "auth">("lifecycle")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadPictureMutation = useUploadSelfPicture(user.id)
  const deletePictureMutation = useDeleteSelfPicture(user.id)
  const updateSelfMutation = useUpdateSelf(user.id)

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(PhoneFormSchema),
  })

  const initials = getInitials(user.first_name, user.last_name)
  const name = `${user.first_name} ${user.last_name}`
  const isPicturePending =
    uploadPictureMutation.isPending || deletePictureMutation.isPending

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    void uploadPictureMutation
      .mutateAsync(file)
      .then(() => {
        showToast({
          variant: "success",
          title: t("detail.page.selfProfile.pictureUpdated.title"),
          message: t("detail.page.selfProfile.pictureUpdated.message"),
        })
      })
      .catch((err: unknown) => {
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

  function handleRemovePicture() {
    void deletePictureMutation
      .mutateAsync()
      .then(() => {
        showToast({
          variant: "success",
          title: t("detail.page.selfProfile.pictureRemoved.title"),
          message: t("detail.page.selfProfile.pictureRemoved.message"),
        })
      })
      .catch((err: unknown) => {
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

  function handlePhoneSubmit(values: PhoneFormValues) {
    const phone = values.phone_number === "" ? null : values.phone_number
    void updateSelfMutation
      .mutateAsync({ phone_number: phone })
      .then(() => {
        setIsEditingPhone(false)
        showToast({
          variant: "success",
          title: t("detail.page.selfProfile.phoneSuccess.title"),
          message: t("detail.page.selfProfile.phoneSuccess.message"),
        })
      })
      .catch((err: unknown) => {
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
      {/* Hero card */}
      <div className="flex flex-col border border-border rounded-[10px]">
        <div className="bg-card flex items-center px-3 py-4 rounded-t-[10px]">
          <div className="flex items-center gap-3">
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
                disabled={isPicturePending}
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

            <div className="flex flex-col gap-3">
              <p className="text-2xl font-semibold text-foreground">{name}</p>
              <div className="flex items-center gap-2">
                <RoleBadge role={user.role} />
                <UserStatusBadge status={user.status} />
              </div>
            </div>
          </div>
        </div>

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
          onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)}
          className="flex flex-col flex-1"
        >
          <SectionCard
            title={t("detail.page.sections.identity")}
            headerActions={
              isEditingPhone ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPhone(false)}
                    disabled={updateSelfMutation.isPending}
                    data-testid="phone-cancel-button"
                  >
                    {t("detail.page.actions.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateSelfMutation.isPending}
                    data-testid="phone-save-button"
                  >
                    {t("detail.page.actions.saveChanges")}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  data-testid="phone-edit-button"
                  onClick={() => {
                    phoneForm.reset({ phone_number: user.phone_number ?? "" })
                    setIsEditingPhone(true)
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
              {user.first_name}
            </DetailRow>
            <DetailRow label={t("detail.page.fields.lastName")}>
              {user.last_name}
            </DetailRow>
            <DetailRow label={t("detail.page.fields.email")}>
              {user.email}
            </DetailRow>
            <DetailRow label={t("detail.page.fields.phoneNumber")}>
              {isEditingPhone ? (
                <Input
                  {...phoneForm.register("phone_number")}
                  data-testid="phone-number-input"
                  placeholder="+1 234 567 8900"
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!phoneForm.formState.errors.phone_number}
                />
              ) : (
                (user.phone_number ?? "—")
              )}
            </DetailRow>
          </SectionCard>
        </form>

        <SectionCard title={t("detail.page.sections.roleScope")}>
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
            {user.access_valid_until
              ? formatDate(user.access_valid_until)
              : "—"}
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

      {/* Lifecycle / Auth tabs */}
      <div className="bg-muted border border-border rounded-[10px] flex flex-col">
        <div className="flex items-center h-10 px-3 gap-1 border-b border-border">
          {(["lifecycle", "auth"] as const).map(tab => (
            <Button
              key={tab}
              variant="ghost"
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-${tab}`}
              className={`h-auto px-1.5 py-1 rounded-none border-none hover:bg-transparent focus-visible:ring-0 focus-visible:border-none ${
                activeTab === tab
                  ? "text-foreground hover:text-foreground"
                  : "text-foreground/60 hover:text-foreground/80"
              }`}
            >
              {tab === "lifecycle"
                ? t("detail.page.tabs.lifecycle")
                : t("detail.page.tabs.authSecurity")}
            </Button>
          ))}
        </div>
        <div className="bg-card border border-border rounded-b-[10px]">
          {activeTab === "lifecycle" && (
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
            </div>
          )}
          {activeTab === "auth" && (
            <div className="flex gap-20 p-3">
              <div className="flex flex-col gap-3 text-sm text-muted-foreground whitespace-nowrap">
                <span>{t("detail.page.authSecurity.mfaStatus")}</span>
                <span>{t("detail.page.authSecurity.mfaMethod")}</span>
                <span>{t("detail.page.authSecurity.ssoProvider")}</span>
              </div>
              <div className="flex flex-col gap-3 text-sm text-foreground">
                <span>—</span>
                <span>—</span>
                <span>—</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SelfProfilePage() {
  const { t } = useTranslation("users")
  const { data: currentUser } = useCurrentUser()
  const {
    data: user,
    isLoading,
    isError,
  } = useUserDetail(currentUser?.id ?? null)

  return (
    <div className="p-8" data-testid="self-profile-page">
      {isLoading && (
        <div className="space-y-6">
          <div className="h-28 bg-muted rounded-[10px] animate-pulse" />
          <div className="flex gap-6">
            <div className="flex-1 h-48 bg-muted rounded-[10px] animate-pulse" />
            <div className="flex-1 h-48 bg-muted rounded-[10px] animate-pulse" />
          </div>
          <div className="h-48 bg-muted rounded-[10px] animate-pulse" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-muted-foreground">
            {t("detail.loadError")}
          </p>
        </div>
      )}

      {user && !isLoading && <SelfProfileContent user={user} />}
    </div>
  )
}
