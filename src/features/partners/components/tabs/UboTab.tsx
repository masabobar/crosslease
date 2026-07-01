import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import {
  fetchPartnerUbo,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import { formatDateTime } from "@/lib/formatters"
import type { PartnerType } from "@/features/partners/api/schema"

type UboTabProps = {
  partnerId: string
  partnerType: PartnerType
}

function UboTab({ partnerId, partnerType: _partnerType }: UboTabProps) {
  const { t } = useTranslation("partners")
  const { data, isLoading, isError } = useQuery({
    queryKey: PARTNERS_QUERY_KEYS.ubo(partnerId),
    queryFn: () => fetchPartnerUbo(partnerId),
  })

  if (isLoading) {
    return (
      <div className="py-8">
        {Array.from({ length: 2 }, (_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-muted animate-pulse mb-2"
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

  const records = data?.records ?? []

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t("detail.ubo.title")}
          </p>
          {data && (
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {data.ubo_completeness_status}
            </p>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("detail.ubo.empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {records.map(record => (
            <div
              key={record.id}
              className="rounded-xl border border-border px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {record.ubo_display_name}
                </p>
                <span className="text-sm font-semibold text-foreground">
                  {record.ownership_percentage}%
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-xs text-muted-foreground capitalize">
                  {t("detail.ubo.fields.ownershipType")}:{" "}
                  {record.ownership_type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("detail.ubo.fields.capturedBy")}:{" "}
                  {record.captured_by.display_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(record.captured_at)}
                </p>
              </div>
              {record.indirect_ownership_notes && (
                <p className="text-xs text-muted-foreground mt-1">
                  {record.indirect_ownership_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { UboTab }
