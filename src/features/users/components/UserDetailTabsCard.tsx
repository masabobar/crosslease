import { useState } from "react"
import { useTranslation } from "react-i18next"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import type { UnderlineTab } from "@/components/ui/underline-tabs"
import { DetailRow } from "@/features/users/components/UserDetailPrimitives"
import { EntityAuditHistoryTab } from "@/features/audit/components/EntityAuditHistoryTab"
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge"
import { USER_DETAIL_TAB } from "@/features/users/types"
import type { UserDetailTabKey } from "@/features/users/types"
import { formatDateTime, formatLastLogin } from "@/lib/formatters"
import type { UserDetail } from "@/features/users/api/schema"

/** Auth & Security rows. Every value is still awaiting its backend field. */
const AUTH_SECURITY_FIELD_KEYS = [
  "mfaStatus",
  "mfaMethod",
  "failedLoginAttempts",
  "accountLockoutStatus",
  "ssoProvider",
  "lastMfaReset",
  "authPolicy",
  "privilegedAccess",
] as const

type AuthSecurityFieldKey = (typeof AUTH_SECURITY_FIELD_KEYS)[number]

function LifecycleTab({
  user,
  showSuspensionReasons,
}: {
  user: UserDetail
  showSuspensionReasons: boolean
}) {
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
      {showSuspensionReasons && (
        <>
          <DetailRow label={t("detail.page.fields.lastSuspensionReason")}>
            {user.last_suspension_reason ?? "—"}
          </DetailRow>
          <DetailRow label={t("detail.page.fields.lastDeactivationReason")}>
            {user.last_deactivation_reason ?? "—"}
          </DetailRow>
        </>
      )}
    </div>
  )
}

function AuthSecurityTab({
  fieldKeys,
}: {
  fieldKeys: readonly AuthSecurityFieldKey[]
}) {
  const { t } = useTranslation("users")
  return (
    <div className="flex gap-20 p-3">
      <div className="flex flex-col gap-3 text-sm text-muted-foreground whitespace-nowrap">
        {fieldKeys.map(key => (
          <span key={key}>{t(`detail.page.authSecurity.${key}`)}</span>
        ))}
      </div>
      <div className="flex flex-col gap-3 text-sm text-foreground">
        {fieldKeys.map(key => (
          <span key={key}>—</span>
        ))}
      </div>
    </div>
  )
}

type UserDetailTabsCardProps = {
  user: UserDetail
  /** The self-service profile shows a reduced Auth & Security set and hides moderation reasons. */
  variant?: "admin" | "self"
}

/**
 * Lifecycle / Auth & Security / Audit tab card, shared by the admin detail page and the
 * self-service profile. Uses the same `UnderlineTabBar` as every other detail page in the
 * app (tenants, partners, audit, workflow task catalog) instead of a local tab bar.
 */
export function UserDetailTabsCard({
  user,
  variant = "admin",
}: UserDetailTabsCardProps) {
  const { t } = useTranslation("users")
  const [activeTab, setActiveTab] = useState<UserDetailTabKey>(
    USER_DETAIL_TAB.LIFECYCLE
  )

  const isAdmin = variant === "admin"
  const authFieldKeys = isAdmin
    ? AUTH_SECURITY_FIELD_KEYS
    : (["mfaStatus", "mfaMethod", "ssoProvider"] as const)

  const tabs: UnderlineTab<UserDetailTabKey>[] = [
    {
      key: USER_DETAIL_TAB.LIFECYCLE,
      label: t("detail.page.tabs.lifecycle"),
      testId: "tab-lifecycle",
    },
    {
      key: USER_DETAIL_TAB.AUTH,
      label: t("detail.page.tabs.authSecurity"),
      testId: "tab-auth-security",
    },
    {
      key: USER_DETAIL_TAB.AUDIT,
      label: t("detail.page.tabs.auditGovernance"),
      testId: "tab-audit-governance",
    },
  ]

  return (
    <div className="bg-muted border border-border rounded-[10px] flex flex-col">
      {/* Padding only — the default tab sizing is what lets the active underline overlap
          the bar's bottom border, matching every other detail page. */}
      <UnderlineTabBar
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="px-3 pt-2"
      />
      <div className="bg-card border border-border rounded-b-[10px]">
        {activeTab === USER_DETAIL_TAB.LIFECYCLE && (
          <LifecycleTab user={user} showSuspensionReasons={isAdmin} />
        )}
        {activeTab === USER_DETAIL_TAB.AUTH && (
          <AuthSecurityTab fieldKeys={authFieldKeys} />
        )}
        {activeTab === USER_DETAIL_TAB.AUDIT && (
          <EntityAuditHistoryTab entityType="user" entityId={user.id} />
        )}
      </div>
    </div>
  )
}
