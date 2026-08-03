import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { AlertTriangle } from "lucide-react"
import { usePartnerIdentityHistory } from "@/features/partners/hooks/usePartnerIdentityHistory"
import { ANCHOR_FIELDS } from "@/features/partners/constants"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { formatDateTime } from "@/lib/formatters"
import type {
  IdentityChangeStatus,
  PartnerType,
} from "@/features/partners/api/schema"

const COL_FIELD = "w-[150px] shrink-0"
const COL_STATUS = "w-[130px] shrink-0"
const COL_PREV = "flex-1 min-w-[160px]"
const COL_NEW = "flex-1 min-w-[160px]"
const COL_PROPOSED_BY = "w-[160px] shrink-0"
const COL_COUNTER_BY = "w-[160px] shrink-0"
const COL_TIMESTAMP = "w-[140px] shrink-0"
const COL_REASON = "flex-1 min-w-[200px]"

const STATUS_BADGE: Record<IdentityChangeStatus, string> = {
  pending_four_eyes: "bg-warning/10 text-warning",
  committed: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
}

function IdentityChangeStatusBadge({
  status,
}: {
  status: IdentityChangeStatus
}) {
  const { t } = useTranslation("partners")
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_BADGE[status]}`}
    >
      {t(`identityChangeStatus.${status}`)}
    </span>
  )
}

function anchorLabel(
  t: TFunction<"partners">,
  partnerType: PartnerType,
  anchorKey: string
): string {
  const field = ANCHOR_FIELDS[partnerType].find(a => a.key === anchorKey)
  if (!field) return anchorKey.replace(/_/g, " ")
  return t(field.labelKey as "submit.identityStep.fields.legalName")
}

function formatAddressAnchorValue(value: unknown): string {
  if (!value || typeof value !== "object") return "—"
  const addr = value as {
    street?: string | null
    city?: string | null
    postal_code?: string | null
  }
  const cityLine = [addr.postal_code, addr.city].filter(Boolean).join(" ")
  return [addr.street, cityLine].filter(Boolean).join(", ") || "—"
}

function formatAnchorValue(anchorKey: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (anchorKey === "registered_address") return formatAddressAnchorValue(value)
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value)
  }
  return JSON.stringify(value)
}

type IdentityChangesTabProps = {
  partnerId: string
  partnerType: PartnerType
}

function IdentityChangesTab({
  partnerId,
  partnerType,
}: IdentityChangesTabProps) {
  const { t } = useTranslation("partners")
  const { data, isLoading, isError } = usePartnerIdentityHistory(partnerId)

  if (isLoading) {
    return (
      <div className="py-8">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-muted animate-pulse mb-2"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-8 text-center">
        {t("errors.generic")}
      </p>
    )
  }

  const items = data?.items ?? []

  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <p className="text-base font-semibold text-foreground">
          {t("detail.identityChanges.title")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("detail.identityChanges.subtitle")}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("detail.identityChanges.empty")}
        </p>
      ) : (
        <div className="w-full border border-border rounded-[10px] overflow-hidden bg-background">
          <div className="flex border-b border-border h-10 items-center">
            <div
              className={`${COL_FIELD} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.identityChanges.fields.changedField")}
            </div>
            <div
              className={`${COL_STATUS} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.identityChanges.fields.status")}
            </div>
            <div
              className={`${COL_PREV} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.identityChanges.fields.previousValue")}
            </div>
            <div
              className={`${COL_NEW} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.identityChanges.fields.newValue")}
            </div>
            <div
              className={`${COL_PROPOSED_BY} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.identityChanges.fields.proposedBy")}
            </div>
            <div
              className={`${COL_COUNTER_BY} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.identityChanges.fields.counterConfirmedBy")}
            </div>
            <div
              className={`${COL_TIMESTAMP} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.identityChanges.fields.proposedAt")}
            </div>
            <div
              className={`${COL_REASON} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.identityChanges.fields.changeReason")}
            </div>
          </div>
          {items.map(item => (
            <div
              key={item.identity_change_id}
              className="flex border-b border-border last:border-0 py-3 items-start"
            >
              <div className={`${COL_FIELD} px-2 flex flex-col gap-1`}>
                {item.target_anchors.map(anchor => (
                  <span
                    key={anchor}
                    className="text-sm font-medium text-foreground"
                  >
                    {anchorLabel(t, partnerType, anchor)}
                  </span>
                ))}
              </div>
              <div className={`${COL_STATUS} px-2 flex flex-col gap-1`}>
                <IdentityChangeStatusBadge status={item.status} />
                {item.is_high_risk && (
                  <span className="inline-flex items-center gap-1 text-xs text-warning">
                    <AlertTriangle size={12} />
                    {t("detail.identityChanges.fields.highRisk")}
                  </span>
                )}
              </div>
              <div className={`${COL_PREV} px-2 flex flex-col gap-1`}>
                {item.target_anchors.map(anchor => (
                  <span key={anchor} className="text-sm text-muted-foreground">
                    {formatAnchorValue(
                      anchor,
                      item.pre_change_snapshot[anchor]
                    )}
                  </span>
                ))}
              </div>
              <div className={`${COL_NEW} px-2 flex flex-col gap-1`}>
                {item.target_anchors.map(anchor => (
                  <span key={anchor} className="text-sm text-foreground">
                    {formatAnchorValue(anchor, item.proposed_values[anchor])}
                  </span>
                ))}
              </div>
              <div className={`${COL_PROPOSED_BY} px-2 flex flex-col gap-1`}>
                <span className="text-sm text-foreground truncate">
                  {item.proposed_by.display_name}
                </span>
                {item.proposed_by.role && (
                  <RoleBadge role={item.proposed_by.role} />
                )}
              </div>
              <div className={`${COL_COUNTER_BY} px-2 flex flex-col gap-1`}>
                {item.counter_confirmed_by ? (
                  <>
                    <span className="text-sm text-foreground truncate">
                      {item.counter_confirmed_by.display_name}
                    </span>
                    {item.counter_confirmed_by.role && (
                      <RoleBadge role={item.counter_confirmed_by.role} />
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
              <div
                className={`${COL_TIMESTAMP} px-2 text-sm text-muted-foreground`}
              >
                {formatDateTime(item.proposed_at)}
              </div>
              <div
                className={`${COL_REASON} px-2 text-sm text-muted-foreground`}
              >
                {item.change_reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { IdentityChangesTab }
