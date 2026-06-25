import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TenantInfoCard } from "@/features/tenants/components/TenantInfoCard"
import { NewGrantDialog } from "@/features/tenants/components/NewGrantDialog"
import { RevokeGrantDialog } from "@/features/tenants/components/RevokeGrantDialog"
import { useTenantGrants } from "@/features/tenants/hooks/useTenantGrants"
import { useTenantAccessPolicy } from "@/features/tenants/hooks/useTenantAccessPolicy"
import { useUsers } from "@/features/users/hooks/useUsers"
import type { SupportGrant } from "@/features/tenants/api/schema"
import type { UserListItem } from "@/features/users/api/schema"

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type GrantBadgeVariant = "active" | "expired" | "revoked" | "emergency"

const BADGE_STYLES: Record<GrantBadgeVariant, { bg: string; text: string }> = {
  active: { bg: "bg-[rgba(22,163,74,0.1)]", text: "text-[#16a34a]" },
  expired: { bg: "bg-[rgba(244,244,245,0.6)]", text: "text-foreground" },
  revoked: { bg: "bg-[rgba(224,52,52,0.1)]", text: "text-[#e6000a]" },
  emergency: { bg: "bg-[rgba(227,146,25,0.1)]", text: "text-[#d97706]" },
}

function GrantBadge({
  label,
  variant,
}: {
  label: string
  variant: GrantBadgeVariant
}) {
  const { bg, text } = BADGE_STYLES[variant]
  return (
    <span
      className={`inline-flex items-center h-[18px] px-1.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  )
}

function GranteeAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map(w => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2)
  return (
    <div className="size-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
      <span className="text-sm text-muted-foreground">{initials}</span>
    </div>
  )
}

function resolveGranteeName(
  grant: SupportGrant,
  userMap: Map<string, UserListItem>
): string {
  const user = userMap.get(grant.grantee_id)
  return user
    ? `${user.first_name} ${user.last_name}`
    : grant.grantee_id.slice(0, 8)
}

type GrantRowProps = {
  grant: SupportGrant
  granteeName: string
  grantedByName: string
  isLast: boolean
  isAdmin: boolean
  onRevoke: (grant: SupportGrant) => void
}

function GrantRow({
  grant,
  granteeName,
  grantedByName,
  isLast,
  isAdmin,
  onRevoke,
}: GrantRowProps) {
  const { t } = useTranslation("tenants")

  const isEmergencyPending =
    grant.is_emergency && grant.review_completed_at === null
  const showRevokeButton = isAdmin && grant.status === "active"

  const metaLine = (() => {
    const grantedPart = t("detail.grants.grantedBy", { name: grantedByName })
    if (grant.status === "revoked" && grant.revoked_at) {
      return `${grantedPart} · ${t("detail.grants.revokedAt", { date: formatDateTime(grant.revoked_at) })}`
    }
    if (grant.status === "expired") {
      return `${grantedPart} · ${t("detail.grants.expiredAt", { date: formatDateTime(grant.valid_until) })}`
    }
    return `${grantedPart} · ${formatDateTime(grant.valid_from)} – ${formatDateTime(grant.valid_until)}`
  })()

  return (
    <div
      className={`flex gap-3 items-center pt-2 ${isLast ? "pb-3" : "pb-3 border-b border-border"}`}
    >
      <GranteeAvatar name={granteeName} />

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {granteeName}
          </span>
          <GrantBadge
            label={t(`detail.grants.grantStatuses.${grant.status}`)}
            variant={grant.status}
          />
          {isEmergencyPending && (
            <GrantBadge
              label={t("detail.grants.emergencyPendingReview")}
              variant="emergency"
            />
          )}
        </div>
        <span className="text-xs text-foreground">
          {t(`detail.grants.accessReasons.${grant.access_reason}`)}
        </span>
        <span className="text-xs text-muted-foreground">{metaLine}</span>
        {grant.status === "revoked" && grant.revocation_reason && (
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
  isAdmin: boolean
}

export function SupportGrantsTab({
  tenantId,
  tenantName,
  isAdmin,
}: SupportGrantsTabProps) {
  const { t } = useTranslation("tenants")
  const [newGrantOpen, setNewGrantOpen] = useState(false)
  const [grantToRevoke, setGrantToRevoke] = useState<SupportGrant | null>(null)

  const { data: grants, isLoading, isError } = useTenantGrants(tenantId)
  const { data: accessPolicy } = useTenantAccessPolicy(tenantId)
  const { data: usersData } = useUsers({
    role: ["support_user"],
    per_page: 100,
  })

  const supportAccessEnabled =
    accessPolicy?.support_read_only_access.enabled ?? true

  const userMap = new Map<string, UserListItem>(
    (usersData?.users ?? []).map(u => [u.id, u])
  )

  const newGrantButton =
    isAdmin && supportAccessEnabled ? (
      <Button
        className="h-auto px-2.5 py-1 text-sm rounded-[10px]"
        onClick={() => setNewGrantOpen(true)}
        data-testid="btn-new-grant"
      >
        {t("detail.grants.newGrant")}
      </Button>
    ) : undefined

  return (
    <div className="flex flex-col gap-4" data-testid="tab-content-grants">
      {/* Disabled support access banner */}
      {isAdmin && !supportAccessEnabled && (
        <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-destructive/10 border border-destructive">
          <TriangleAlert
            size={16}
            className="text-destructive shrink-0 mt-0.5"
          />
          <p className="text-sm font-medium text-destructive">
            {t("detail.grants.supportDisabledBanner")}
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
            {t("errors.generic")}
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
                granteeName={resolveGranteeName(grant, userMap)}
                grantedByName={resolveGranteeName(
                  { ...grant, grantee_id: grant.granted_by },
                  userMap
                )}
                isLast={i === grants.length - 1}
                isAdmin={isAdmin}
                onRevoke={setGrantToRevoke}
              />
            ))}
          </>
        )}
      </TenantInfoCard>

      {isAdmin && (
        <>
          <NewGrantDialog
            open={newGrantOpen}
            onOpenChange={setNewGrantOpen}
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
              granteeName={resolveGranteeName(grantToRevoke, userMap)}
            />
          )}
        </>
      )}
    </div>
  )
}
