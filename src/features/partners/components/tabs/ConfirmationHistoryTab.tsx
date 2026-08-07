import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { usePartnerConfirmationHistory } from "@/features/partners/hooks/usePartnerConfirmationHistory"
import { initialsFromName } from "@/features/partners/utils"
import { formatDateTime } from "@/lib/formatters"
import { ApiError } from "@/lib/api"
import { PartnerStatusSchema } from "@/features/partners/api/schema"

const CONFIRMATION_HISTORY_PAGE_SIZE = 50

// NOTE: this table is a flex/div grid rather than shadcn <Table>. The columns
// below mix fixed widths with flex-grow so every partners table lines up
// column-for-column across tabs; <table>'s own sizing algorithm does not honour
// those constraints. Converting is tracked as a follow-up and needs per-screen
// visual verification, so it is deliberately not a drop-in change.
const COL_STATUS = "w-[140px] shrink-0"
const COL_CAPTURED_BY = "flex-1 min-w-[220px]"
const COL_CAPTURED_ON = "w-[160px] shrink-0"
const COL_NOTE = "flex-1 min-w-[280px]"

function ConfirmationStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("partners")
  const isConfirmed = status === PartnerStatusSchema.enum.confirmed
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isConfirmed
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {t(`status.${status}` as "status.confirmed", { defaultValue: status })}
    </span>
  )
}

type ConfirmationHistoryTabProps = {
  partnerId: string
}

function ConfirmationHistoryTab({ partnerId }: ConfirmationHistoryTabProps) {
  const { t } = useTranslation("partners")
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePartnerConfirmationHistory(partnerId, {
    per_page: CONFIRMATION_HISTORY_PAGE_SIZE,
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
        {error instanceof ApiError
          ? t(`errors.${error.code}`, { defaultValue: t("errors.generic") })
          : t("errors.generic")}
      </p>
    )
  }

  const items = data?.pages.flatMap(p => p.items) ?? []

  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <p className="text-base font-semibold text-foreground">
          {t("detail.confirmationHistory.title")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("detail.confirmationHistory.subtitle")}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("detail.confirmationHistory.empty")}
        </p>
      ) : (
        <div className="w-full border border-border rounded-[10px] overflow-hidden bg-background">
          <div className="flex border-b border-border h-10 items-center">
            <div
              className={`${COL_STATUS} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.confirmationHistory.fields.status")}
            </div>
            <div
              className={`${COL_CAPTURED_BY} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.confirmationHistory.fields.capturedBy")}
            </div>
            <div
              className={`${COL_CAPTURED_ON} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.confirmationHistory.fields.capturedOn")}
            </div>
            <div
              className={`${COL_NOTE} text-sm font-medium text-foreground px-2`}
            >
              {t("detail.confirmationHistory.fields.note")}
            </div>
          </div>
          {items.map(entry => (
            <div
              key={entry.id}
              className="flex border-b border-border last:border-0 py-2 items-center"
            >
              <div className={`${COL_STATUS} px-2`}>
                <ConfirmationStatusBadge status={entry.status} />
              </div>
              <div
                className={`${COL_CAPTURED_BY} px-2 flex items-center gap-2`}
              >
                <div className="size-8 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    {initialsFromName(entry.captured_by)}
                  </span>
                </div>
                <p className="text-sm text-foreground truncate">
                  {entry.captured_by}
                </p>
              </div>
              <div
                className={`${COL_CAPTURED_ON} px-2 text-sm text-muted-foreground`}
              >
                {formatDateTime(entry.captured_on)}
              </div>
              <div className={`${COL_NOTE} px-2 text-sm text-muted-foreground`}>
                {entry.note ?? "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            data-testid="confirmation-history-load-more"
          >
            {isFetchingNextPage
              ? t("detail.confirmationHistory.loadingMore")
              : t("detail.confirmationHistory.loadMore")}
          </Button>
        </div>
      )}
    </div>
  )
}

export { ConfirmationHistoryTab }
