import { useState } from "react"
import { useParams } from "react-router-dom"
import {
  Mail,
  Clock,
  Calendar,
  SquarePen,
  UserRoundX,
  Ban,
  UserRoundCheck,
  UserCheck,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge"
import { UserStatusBanner } from "@/features/users/components/UserStatusBanner"
import { UserActionModal } from "@/features/users/components/UserActionModal"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useApproveUser } from "@/features/users/hooks/useApproveUser"
import {
  formatLastLogin,
  formatDate,
  formatDateTime,
  getInitials,
  getUserActionVisibility,
} from "@/features/users/utils"
import { useToastStore } from "@/store/toastStore"
import { useQueryClient } from "@tanstack/react-query"
import { USERS_QUERY_KEYS } from "@/features/users/api/usersApi"
import { ApiError } from "@/lib/api"
import type { UserDetail } from "@/features/users/api/schema"
import { READ_ONLY_VIEWER_ROLES, type UserRole } from "@/features/users/types"

type ActiveAction =
  | "suspend"
  | "reactivate"
  | "deactivate"
  | "resend-invitation"

const PLATFORM_ROLES: readonly UserRole[] = [
  "system_admin",
  "support_user",
  "auditor",
]

function getRoleClassificationKey(
  role: UserRole
):
  | "detail.page.roleClassification.platform"
  | "detail.page.roleClassification.tenantOperational" {
  if (PLATFORM_ROLES.includes(role))
    return "detail.page.roleClassification.platform"
  return "detail.page.roleClassification.tenantOperational"
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2 py-0 text-sm leading-5">
      <span className="text-muted-foreground w-[180px] shrink-0">{label}</span>
      <span className="text-foreground min-w-0">{children}</span>
    </div>
  )
}

type SectionCardProps = {
  title: string
  children: React.ReactNode
  onEdit?: () => void
}

function SectionCard({ title, children, onEdit }: SectionCardProps) {
  const { t } = useTranslation("users")
  return (
    <div className="bg-muted border border-border rounded-[10px] flex flex-col flex-1 min-w-0">
      <div className="flex items-center justify-between h-10 px-3">
        <span className="text-xs font-semibold text-foreground tracking-wide">
          {title}
        </span>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 px-[10px] py-[4px] text-sm font-medium text-foreground bg-card border border-input rounded-[10px] hover:bg-muted/60 transition-colors"
          >
            <SquarePen size={14} />
            {t("detail.page.actions.edit")}
          </button>
        )}
      </div>
      <div className="bg-card border border-border rounded-b-[10px] p-3 flex flex-col gap-3 flex-1">
        {children}
      </div>
    </div>
  )
}

type TabKey = "lifecycle" | "auth" | "audit"

function TabButton({
  active,
  onClick,
  children,
  "data-testid": testId,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  "data-testid"?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`flex items-center h-[26px] px-1.5 pb-4 pt-0.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-foreground/60 hover:text-foreground/80"
      }`}
    >
      {children}
    </button>
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
        {formatLastLogin(user.last_login)}
      </DetailRow>
      <DetailRow label={t("detail.page.fields.lastActivity")}>
        {formatLastLogin(user.last_activity ?? user.last_login)}
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
        <span className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
          {t("detail.page.values.on")}
        </span>
        <span>{t("detail.page.values.emailOtp")}</span>
        <span>—</span>
        <span>{t("detail.page.values.no")}</span>
        <span>—</span>
        <span>—</span>
        <span>{t("detail.page.values.standard")}</span>
        <span>{t("detail.page.values.no")}</span>
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

function UserDetailContent({ user }: { user: UserDetail }) {
  const { t } = useTranslation("users")
  const { data: currentUser } = useCurrentUser()
  const showToast = useToastStore(s => s.showToast)
  const queryClient = useQueryClient()
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("lifecycle")
  const { mutateAsync: approve, isPending: isApproving } = useApproveUser()

  const isAdmin = currentUser?.role === "system_admin"
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
  } = getUserActionVisibility(user.status, user.role, currentUser?.role)

  const initials = getInitials(user.first_name, user.last_name)
  const name = `${user.first_name} ${user.last_name}`

  const accessPeriod = user.access_valid_until
    ? formatDate(user.access_valid_until)
    : "—"

  function handleActionSuccess() {
    if (!activeAction) return
    const toastMap: Record<
      ActiveAction,
      { variant: "success" | "warning"; title: string; message: string }
    > = {
      suspend: {
        variant: "warning",
        title: t("actions.suspend.success.title"),
        message: t("actions.suspend.success.message", { name }),
      },
      reactivate: {
        variant: "success",
        title: t("actions.reactivate.success.title"),
        message: t("actions.reactivate.success.message", { name }),
      },
      deactivate: {
        variant: "warning",
        title: t("actions.deactivate.success.title"),
        message: t("actions.deactivate.success.message", { name }),
      },
      "resend-invitation": {
        variant: "success",
        title: t("actions.resend-invitation.success.title"),
        message: t("actions.resend-invitation.success.message", { name }),
      },
    }
    showToast(toastMap[activeAction])
    setActiveAction(null)
    void queryClient.invalidateQueries({
      queryKey: USERS_QUERY_KEYS.detail(user.id),
    })
  }

  async function handleApprove() {
    try {
      const result = await approve(user.id)
      const approvedName = `${result.user.first_name} ${result.user.last_name}`
      showToast({
        variant: "success",
        title: t("approveSuccess.title"),
        message: t("approveSuccess.message", {
          name: approvedName,
          email: result.user.email,
        }),
      })
      void queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEYS.detail(user.id),
      })
    } catch (err) {
      showToast({
        variant: "warning",
        title: t("approveSuccess.errorTitle"),
        message:
          err instanceof ApiError
            ? err.message
            : t("approveSuccess.errorFallback"),
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <UserStatusBanner status={user.status} />
      {/* Hero card */}
      <div className="flex flex-col border border-border rounded-[10px]">
        {/* Top row: avatar + name + actions */}
        <div className="bg-card flex items-center justify-between px-3 py-4 rounded-t-[10px]">
          <div className="flex items-center gap-3">
            <div className="size-14 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center">
              <span className="text-xl font-normal text-muted-foreground">
                {initials}
              </span>
            </div>
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
                <button
                  type="button"
                  data-testid="detail-suspend-button"
                  onClick={() => setActiveAction("suspend")}
                  className="flex items-center gap-[6px] px-[10px] py-[8px] text-sm font-medium text-foreground bg-card border border-input rounded-[12px] hover:bg-muted/60 transition-colors"
                >
                  <UserRoundX size={16} />
                  {t("detail.page.actions.suspendUser")}
                </button>
              )}
              {canReactivate && (
                <button
                  type="button"
                  data-testid="detail-reactivate-button"
                  onClick={() => setActiveAction("reactivate")}
                  className="flex items-center gap-[6px] px-[10px] py-[8px] text-sm font-medium text-foreground bg-card border border-input rounded-[12px] hover:bg-muted/60 transition-colors"
                >
                  <UserRoundCheck size={16} />
                  {t("actions.reactivate.label")}
                </button>
              )}
              {canDeactivate && (
                <button
                  type="button"
                  data-testid="detail-deactivate-button"
                  onClick={() => setActiveAction("deactivate")}
                  className="flex items-center gap-[6px] px-[10px] py-[8px] text-sm font-medium text-foreground bg-card border border-input rounded-[12px] hover:bg-muted/60 transition-colors"
                >
                  <Ban size={16} />
                  {t("detail.page.actions.deactivateUser")}
                </button>
              )}
              {canApprove && (
                <button
                  type="button"
                  data-testid="detail-approve-button"
                  disabled={isApproving}
                  onClick={() => void handleApprove()}
                  className="flex items-center gap-[6px] px-[10px] py-[8px] text-sm font-medium text-foreground bg-card border border-input rounded-[12px] hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheck size={16} />
                  {t("table.actions.approve")}
                </button>
              )}
              {canResendInvitation && (
                <button
                  type="button"
                  data-testid="detail-resend-invitation-button"
                  onClick={() => setActiveAction("resend-invitation")}
                  className="flex items-center gap-[6px] px-[10px] py-[8px] text-sm font-medium text-foreground bg-card border border-input rounded-[12px] hover:bg-muted/60 transition-colors"
                >
                  <Mail size={16} />
                  {t("actions.resend-invitation.label")}
                </button>
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
              {formatLastLogin(user.last_login)}
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
        <SectionCard
          title={t("detail.page.sections.identity")}
          onEdit={isReadOnlyViewer ? undefined : () => {}}
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

        <SectionCard
          title={t("detail.page.sections.roleScope")}
          onEdit={isReadOnlyViewer ? undefined : () => {}}
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
            {user.role === "auditor"
              ? formatDate(user.access_valid_until)
              : "—"}
          </DetailRow>
          <DetailRow label={t("detail.page.fields.effectiveTenantScope")}>
            {user.tenant_name ?? "—"}
          </DetailRow>
        </SectionCard>
      </div>

      {/* Tabbed card */}
      <div className="bg-muted border border-border rounded-[10px] flex flex-col">
        <div className="flex items-end h-10 px-3 pt-2 gap-1 border-b border-border">
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

      {activeAction &&
      activeAction !== "suspend" &&
      activeAction !== "reactivate" &&
      activeAction !== "deactivate"
        ? null
        : activeAction && (
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
    </div>
  )
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation("users")
  const { data: user, isLoading, isError } = useUserDetail(id ?? null)

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
