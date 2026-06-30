import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import {
  fetchIdentityHistory,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import { formatDateTime } from "@/lib/formatters"
import type { IdentityChangeStatus } from "@/features/partners/api/schema"

const STATUS_COLORS: Record<IdentityChangeStatus, string> = {
  pending_four_eyes: "text-amber-600",
  committed: "text-green-600",
  rejected: "text-destructive",
}

type IdentityChangesTabProps = {
  partnerId: string
}

function IdentityChangesTab({ partnerId }: IdentityChangesTabProps) {
  const { t } = useTranslation("partners")
  const { data, isLoading, isError } = useQuery({
    queryKey: PARTNERS_QUERY_KEYS.identityHistory(partnerId),
    queryFn: () => fetchIdentityHistory(partnerId),
  })

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
      <p className="text-sm font-semibold text-foreground">
        {t("detail.identityChanges.title")}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("detail.identityChanges.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <div
              key={item.identity_change_id}
              className="rounded-xl border border-border px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.is_high_risk && (
                    <AlertTriangle size={14} className="text-amber-600" />
                  )}
                  <span
                    className={`text-xs font-medium ${STATUS_COLORS[item.status]}`}
                  >
                    {t(
                      `identityChangeStatus.${item.status}` as `identityChangeStatus.committed`
                    )}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(item.proposed_at)}
                </span>
              </div>
              <p className="text-sm text-foreground mt-1">
                {item.change_reason}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-xs text-muted-foreground">
                  {t("detail.identityChanges.fields.proposedBy")}:{" "}
                  {item.proposed_by.display_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("detail.identityChanges.fields.targetAnchors")}:{" "}
                  {item.target_anchors.join(", ")}
                </p>
              </div>
              {item.resolved_at && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("detail.identityChanges.fields.resolvedAt")}:{" "}
                  {formatDateTime(item.resolved_at)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { IdentityChangesTab }
