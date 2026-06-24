import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { TenantInfoCard } from "@/features/tenants/components/TenantInfoCard"
import { useTenantGrants } from "@/features/tenants/hooks/useTenantGrants"
import type { SupportGrant } from "@/features/tenants/api/schema"

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type BadgeVariant = "active" | "expired" | "revoked" | "emergency"

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  active: { bg: "bg-[rgba(22,163,74,0.1)]", text: "text-[#16a34a]" },
  expired: { bg: "bg-[rgba(244,244,245,0.6)]", text: "text-foreground" },
  revoked: { bg: "bg-[rgba(224,52,52,0.1)]", text: "text-[#e6000a]" },
  emergency: { bg: "bg-[rgba(227,146,25,0.1)]", text: "text-[#d97706]" },
}

function SoftBadge({
  label,
  variant,
}: {
  label: string
  variant: BadgeVariant
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

function GranteeAvatar({ granteeId }: { granteeId: string }) {
  const initials = granteeId.substring(0, 2).toUpperCase()
  return (
    <div className="size-10 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
      <span className="text-sm text-muted-foreground">{initials}</span>
    </div>
  )
}

function GrantRow({ grant, isLast }: { grant: SupportGrant; isLast: boolean }) {
  const { t } = useTranslation("tenants")

  const isEmergencyPending =
    grant.is_emergency && grant.review_completed_at === null
  const showRevokeButton = grant.status === "active"
  const showRevocationNote =
    grant.status === "revoked" && !!grant.revocation_reason

  const accessReasonLabel = t(
    `detail.grants.accessReasons.${grant.access_reason}` as "detail.grants.accessReasons.user_access_issue"
  )

  const grantedByPart = t("detail.grants.grantedBy", {
    name: grant.granted_by.substring(0, 8),
  })
  let timePart: string
  if (grant.status === "revoked" && grant.revoked_at) {
    timePart = t("detail.grants.revokedAt", {
      date: formatDateTime(grant.revoked_at),
    })
  } else if (grant.status === "expired") {
    timePart = t("detail.grants.expiredAt", {
      date: formatDateTime(grant.valid_until),
    })
  } else {
    timePart = `${formatDateTime(grant.valid_from)} – ${formatDateTime(grant.valid_until)}`
  }
  const metaLine = `${grantedByPart} · ${timePart}`

  return (
    <div
      className={`flex gap-3 items-center pt-2 ${
        isLast ? "pb-3" : "pb-3 border-b border-border"
      }`}
    >
      <GranteeAvatar granteeId={grant.grantee_id} />

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {grant.grantee_id.substring(0, 8)}
          </span>
          <SoftBadge
            label={t(
              `detail.grants.grantStatuses.${grant.status}` as "detail.grants.grantStatuses.active"
            )}
            variant={grant.status}
          />
        </div>
        <span className="text-xs text-foreground">{accessReasonLabel}</span>
        <span className="text-xs text-muted-foreground">{metaLine}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isEmergencyPending && (
          <SoftBadge
            label={t("detail.grants.emergencyPendingReview")}
            variant="emergency"
          />
        )}
        {showRevocationNote && (
          <span className="text-xs text-muted-foreground">
            {grant.revocation_reason}
          </span>
        )}
        {showRevokeButton && (
          <Button
            variant="outline"
            className="h-auto px-2.5 py-1 text-sm rounded-[10px]"
            data-testid={`btn-revoke-grant-${grant.id}`}
          >
            {t("detail.grants.revoke")}
          </Button>
        )}
      </div>
    </div>
  )
}

type SupportGrantsTabProps = {
  tenantId: string
  isAdmin: boolean
}

export function SupportGrantsTab({ tenantId, isAdmin }: SupportGrantsTabProps) {
  const { t } = useTranslation("tenants")
  const { data: grants, isLoading, isError } = useTenantGrants(tenantId)

  const newGrantButton = isAdmin ? (
    <Button
      className="h-auto px-2.5 py-1 text-sm rounded-[10px]"
      data-testid="btn-new-grant"
    >
      {t("detail.grants.newGrant")}
    </Button>
  ) : undefined

  return (
    <div className="flex flex-col gap-6" data-testid="tab-content-grants">
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
                isLast={i === grants.length - 1}
              />
            ))}
          </>
        )}
      </TenantInfoCard>
    </div>
  )
}
