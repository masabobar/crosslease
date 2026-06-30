import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import {
  fetchConfirmationHistory,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import { formatDateTime } from "@/lib/formatters"

type ConfirmationHistoryTabProps = {
  partnerId: string
}

function ConfirmationHistoryTab({ partnerId }: ConfirmationHistoryTabProps) {
  const { t } = useTranslation("partners")
  const { data, isLoading, isError } = useQuery({
    queryKey: PARTNERS_QUERY_KEYS.confirmationHistory(partnerId),
    queryFn: () => fetchConfirmationHistory(partnerId),
  })

  if (isLoading) {
    return (
      <div className="py-8">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-muted animate-pulse mb-2"
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
        {t("detail.confirmationHistory.title")}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("detail.confirmationHistory.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-0">
          {items.map(entry => (
            <div
              key={entry.id}
              className="flex items-start gap-3 py-3 border-b border-border last:border-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground capitalize">
                    {entry.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {entry.captured_by} · {formatDateTime(entry.captured_on)}
                  </span>
                </div>
                {entry.note && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { ConfirmationHistoryTab }
