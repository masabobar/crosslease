import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TenantInfoCard } from "@/features/tenants/components/TenantInfoCard"
import { NewGrantDialog } from "@/features/tenants/components/NewGrantDialog"
import { RevokeGrantDialog } from "@/features/tenants/components/RevokeGrantDialog"
import { SoftBadge } from "@/features/tenants/components/SoftBadge"
import type { SoftBadgeTone } from "@/features/tenants/components/SoftBadge"
import { UserInitialsAvatar } from "@/features/tenants/components/UserInitialsAvatar"
import { useTenantGrants } from "@/features/tenants/hooks/useTenantGrants"
import { useTenantAccessPolicy } from "@/features/tenants/hooks/useTenantAccessPolicy"
import { useUsers } from "@/features/users/hooks/useUsers"
import type { SupportGrant, TenantStatus } from "@/features/tenants/api/schema"
import {
  GrantStatusSchema,
  TenantStatusSchema,
} from "@/features/tenants/api/schema"
import type { GrantStatus } from "@/features/tenants/api/schema"
import type { UserListItem } from "@/features/users/api/schema"
import { SUPPORT_USER_ROLE, SYSTEM_ADMIN_ROLE } from "@/features/users/types"
import {
  GRANTOR_LOOKUP_PAGE_SIZE,
  SUPPORT_USERS_DROPDOWN_PAGE_SIZE,
} from "@/features/tenants/constants"
import { ApiError } from "@/lib/api"
import { formatDateTime, getInitials } from "@/lib/formatters"

const GRANT_STATUS_TONE: Record<GrantStatus, SoftBadgeTone> = {
  active: "success",
  expired: "neutral",
  revoked: "danger",
}

type ResolvedUser = { name: string; initials: string }

// The grants API returns only user ids; names come from the separately-fetched
// support-user and admin lists. Falls back to a truncated id when a referenced
// user is outside the fetched page.
function resolveUser(
  userId: string,
  userMap: Map<string, UserListItem>
): ResolvedUser {
  const user = userMap.get(userId)
  if (!user) {
    const shortId = userId.slice(0, 8)
    return { name: shortId, initials: shortId.slice(0, 2).toUpperCase() }
  }
  return {
    name: `${user.first_name} ${user.last_name}`,
    initials: getInitials(user.first_name, user.last_name),
  }
}

type GrantRowProps = {
  grant: SupportGrant
  grantee: ResolvedUser
  grantedByName: string
  isLast: boolean
  isAdmin: boolean
  tenantStatus: TenantStatus
  onRevoke: (grant: SupportGrant) => void
}

function GrantRow({
  grant,
  grantee,
  grantedByName,
  isLast,
  isAdmin,
  tenantStatus,
  onRevoke,
}: GrantRowProps) {
  const { t } = useTranslation("tenants")

  const isEmergencyPending =
    grant.is_emergency && grant.review_completed_at === null
  const showRevokeButton =
    isAdmin &&
    grant.status === GrantStatusSchema.enum.active &&
    tenantStatus !== TenantStatusSchema.enum.archived

  const metaLine = (() => {
    const grantedPart = t("detail.grants.grantedBy", { name: grantedByName })
    if (grant.status === GrantStatusSchema.enum.revoked && grant.revoked_at) {
      return `${grantedPart} · ${t("detail.grants.revokedAt", { date: formatDateTime(grant.revoked_at) })}`
    }
    if (grant.status === GrantStatusSchema.enum.expired) {
      return `${grantedPart} · ${t("detail.grants.expiredAt", { date: formatDateTime(grant.valid_until) })}`
    }
    return `${grantedPart} · ${formatDateTime(grant.valid_from)} – ${formatDateTime(grant.valid_until)}`
  })()

  return (
    <div
      className={`flex gap-3 items-center pt-2 ${isLast ? "pb-3" : "pb-3 border-b border-border"}`}
    >
      <UserInitialsAvatar initials={grantee.initials} size="md" />

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {grantee.name}
          </span>
          <SoftBadge
            label={t(`detail.grants.grantStatuses.${grant.status}`)}
            tone={GRANT_STATUS_TONE[grant.status]}
          />
          {isEmergencyPending && (
            <SoftBadge
              label={t("detail.grants.emergencyPendingReview")}
              tone="warning"
            />
          )}
        </div>
        <span className="text-xs text-foreground">
          {t(`detail.grants.accessReasons.${grant.access_reason}`)}
        </span>
        <span className="text-xs text-muted-foreground">{metaLine}</span>
        {grant.status === GrantStatusSchema.enum.revoked &&
          grant.revocation_reason && (
            <span className="text-xs text-muted-foreground">
              {t("detail.grants.revokedReason")}: {grant.revocation_reason}
            </span>
          )}
      </div>

      {showRevokeButton && (
        <Button
          variant="outline"
          className="h-auto px-2.5 py-1 text-sm rounded-[10px] shrink-0"
          onClick={() => onRevoke(grant)}
          data-testid={`btn-revoke-grant-${grant.id}`}
        >
          {t("detail.grants.revoke")}
        </Button>
      )}
    </div>
  )
}

type SupportGrantsTabProps = {
  tenantId: string
  tenantName: string
  tenantStatus: TenantStatus
  isAdmin: boolean
}

export function SupportGrantsTab({
  tenantId,
  tenantName,
  tenantStatus,
  isAdmin,
}: SupportGrantsTabProps) {
  const { t } = useTranslation("tenants")
  const [isNewGrantOpen, setIsNewGrantOpen] = useState(false)
  const [grantToRevoke, setGrantToRevoke] = useState<SupportGrant | null>(null)

  const { data: grants, isLoading, isError, error } = useTenantGrants(tenantId)
  const { data: accessPolicy, isError: isAccessPolicyError } =
    useTenantAccessPolicy(tenantId)
  const { data: usersData } = useUsers({
    role: [SUPPORT_USER_ROLE],
    per_page: SUPPORT_USERS_DROPDOWN_PAGE_SIZE,
  })
  // Grantors are system admins, who are absent from the support-user list above —
  // without this the `granted by` column always fell back to a truncated UUID.
  const { data: grantorsData } = useUsers({
    role: [SYSTEM_ADMIN_ROLE],
    per_page: GRANTOR_LOOKUP_PAGE_SIZE,
  })

  // Fail closed: an unknown/error policy state must not allow grant creation.
  const isSupportAccessEnabled = isAccessPolicyError
    ? false
    : (accessPolicy?.support_read_only_access.enabled ?? true)

  const userMap = new Map<string, UserListItem>(
    [...(usersData?.users ?? []), ...(grantorsData?.users ?? [])].map(u => [
      u.id,
      u,
    ])
  )

  const newGrantButton =
    isAdmin &&
    isSupportAccessEnabled &&
    tenantStatus !== TenantStatusSchema.enum.archived ? (
      <Button
        className="h-auto px-2.5 py-1 text-sm rounded-[10px]"
        onClick={() => setIsNewGrantOpen(true)}
        data-testid="btn-new-grant"
      >
        {t("detail.grants.newGrant")}
      </Button>
    ) : undefined

  return (
    <div className="flex flex-col gap-4" data-testid="tab-content-grants">
      {/* Disabled support access banner */}
      {isAdmin && !isSupportAccessEnabled && (
        <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-destructive/10 border border-destructive">
          <TriangleAlert
            size={16}
            className="text-destructive shrink-0 mt-0.5"
          />
          <p className="text-sm font-medium text-destructive">
            {isAccessPolicyError
              ? t("errors.generic")
              : t("detail.grants.supportDisabledBanner")}
          </p>
        </div>
      )}

      <TenantInfoCard
        title={t("detail.grants.sectionTitle")}
        editButton={newGrantButton}
      >
        {isLoading && <div className="h-48 animate-pulse bg-muted rounded" />}

        {isError && !isLoading && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {error instanceof ApiError
              ? t(`errors.${error.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic")}
          </p>
        )}

        {!isLoading && !isError && (!grants || grants.length === 0) && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("detail.grants.noGrants")}
          </p>
        )}

        {!isLoading && !isError && grants && grants.length > 0 && (
          <>
            {grants.map((grant, i) => (
              <GrantRow
                key={grant.id}
                grant={grant}
                grantee={resolveUser(grant.grantee_id, userMap)}
                grantedByName={resolveUser(grant.granted_by, userMap).name}
                isLast={i === grants.length - 1}
                isAdmin={isAdmin}
                tenantStatus={tenantStatus}
                onRevoke={setGrantToRevoke}
              />
            ))}
          </>
        )}
      </TenantInfoCard>

      {isAdmin && (
        <>
          <NewGrantDialog
            open={isNewGrantOpen}
            onOpenChange={setIsNewGrantOpen}
            tenantId={tenantId}
            tenantName={tenantName}
          />
          {grantToRevoke && (
            <RevokeGrantDialog
              open={!!grantToRevoke}
              onOpenChange={open => {
                if (!open) setGrantToRevoke(null)
              }}
              tenantId={tenantId}
              tenantName={tenantName}
              grant={grantToRevoke}
              granteeName={resolveUser(grantToRevoke.grantee_id, userMap).name}
            />
          )}
        </>
      )}
    </div>
  )
}
