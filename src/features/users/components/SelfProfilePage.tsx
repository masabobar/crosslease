import { useState, useRef } from "react"
import { toast } from "sonner"
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
import { useProfilePicture } from "@/features/users/hooks/useProfilePicture"
import { useUpdateSelf } from "@/features/users/hooks/useUpdateSelf"
import { useToastStore } from "@/store/toastStore"
import {
  formatLastLogin,
  formatDate,
  formatDateTime,
  getInitials,
} from "@/lib/formatters"
import { AUDITOR_DATE_RANGE_ROLES } from "@/features/users/types"
import type { UserDetail } from "@/features/users/api/schema"
import { phoneNumberSchema } from "@/features/users/api/schema"
import { getRoleClassificationKey } from "@/features/users/utils"
import {
  DetailRow,
  SectionCard,
} from "@/features/users/components/UserDetailPrimitives"

const IdentityFormSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone_number: phoneNumberSchema.or(z.literal("")).optional(),
})
type IdentityFormValues = z.infer<typeof IdentityFormSchema>

function SelfProfileContent({ user }: { user: UserDetail }) {
  const { t } = useTranslation("users")
  const showToast = useToastStore(s => s.showToast)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<"lifecycle" | "auth">("lifecycle")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    isPending: isPicturePending,
    handleFileSelected,
    handleRemovePicture,
  } = useProfilePicture(user.id)
  const updateSelfMutation = useUpdateSelf(user.id)

  const identityForm = useForm<IdentityFormValues>({
    resolver: zodResolver(IdentityFormSchema),
  })

  const initials = getInitials(user.first_name, user.last_name)
  const name = `${user.first_name} ${user.last_name}`

  function handleIdentitySubmit(values: IdentityFormValues) {
    const hasNameChanges =
      values.first_name !== user.first_name ||
      values.last_name !== user.last_name
    const hasPhoneChange =
      (values.phone_number ?? "") !== (user.phone_number ?? "")

    if (!hasNameChanges && !hasPhoneChange) {
      setIsEditing(false)
      return
    }

    const input: {
      first_name: string
      last_name: string
      phone_number?: string | null
    } = {
      first_name: values.first_name,
      last_name: values.last_name,
    }
    if (hasPhoneChange) {
      input.phone_number =
        values.phone_number === "" ? null : (values.phone_number ?? null)
    }

    void updateSelfMutation
      .mutateAsync(input)
      .then(() => {
        setIsEditing(false)
        showToast({
          variant: "success",
          title: t("detail.page.editIdentity.success.title"),
          message: t("detail.page.editIdentity.success.message"),
        })
      })
      .catch((err: unknown) => {
        toast.error(
          err instanceof ApiError
            ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")
        )
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
                  placeholder="+1 234 567 8900"
                  className="h-[28px] py-0 text-sm rounded-[8px]"
                  error={!!identityForm.formState.errors.phone_number}
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
