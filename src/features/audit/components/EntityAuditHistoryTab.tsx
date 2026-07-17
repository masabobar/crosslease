import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api"
import { AuditTable } from "@/features/audit/components/AuditTable"
import { AuditEventDrawer } from "@/features/audit/components/AuditEventDrawer"
import { useEntityAuditEvents } from "@/features/audit/hooks/useEntityAuditEvents"
import type { AuditEventListItem } from "@/features/audit/api/schema"

const ENTITY_TAB_PAGE_SIZE = 10

type EntityAuditHistoryTabProps = {
  entityType: string
  entityId: string
}

export function EntityAuditHistoryTab({
  entityType,
  entityId,
}: EntityAuditHistoryTabProps) {
  const { t } = useTranslation("audit")
  const [page, setPage] = useState(1)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useEntityAuditEvents(
    entityType,
    entityId,
    page,
    ENTITY_TAB_PAGE_SIZE
  )

  function handleRowClick(event: AuditEventListItem) {
    setSelectedEventId(event.id)
  }

  return (
    <div
      className="p-3 flex flex-col gap-3"
      data-testid="entity-audit-history-tab"
    >
      {isError && !isLoading && (
        <p
          className="py-8 text-center text-sm text-muted-foreground"
          data-testid="entity-audit-load-error"
        >
          {error instanceof ApiError
            ? t(`errors.${error.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")}
        </p>
      )}

      {!isError && (
        <AuditTable
          events={data?.events ?? []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          hasActiveFilters={false}
        />
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            data-testid="entity-audit-prev"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 gap-1 rounded-xl pl-1.5 pr-2.5 text-sm"
          >
            <ChevronLeft size={16} />
            {t("page.pagination.previous")}
          </Button>
          <span className="px-2 text-xs text-muted-foreground tabular-nums">
            {page} / {data.total_pages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            data-testid="entity-audit-next"
            onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
            disabled={page === data.total_pages}
            className="h-8 gap-1 rounded-xl pl-2.5 pr-1.5 text-sm"
          >
            {t("page.pagination.next")}
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      <AuditEventDrawer
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  )
}
