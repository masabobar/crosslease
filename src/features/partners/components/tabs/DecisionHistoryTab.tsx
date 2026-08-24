import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePartnerDecisionHistory } from "@/features/partners/hooks/usePartnerDecisionHistory"
import { initialsFromName } from "@/features/partners/utils"
import {
  formatActionType,
  formatDateTime,
  formatEventType,
} from "@/lib/formatters"
import type { DecisionHistoryEntry } from "@/features/partners/api/schema"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

const DECISION_HISTORY_PAGE_SIZE = 50

function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value)
  }
  return JSON.stringify(value)
}

function diffKeys(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): string[] {
  const keys = new Set([
    ...Object.keys(oldData ?? {}),
    ...Object.keys(newData ?? {}),
  ])
  return Array.from(keys)
}

function EntryDiff({ entry }: { entry: DecisionHistoryEntry }) {
  if (!entry.old_data && !entry.new_data) return null
  const keys = diffKeys(entry.old_data, entry.new_data)
  if (keys.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5 pl-4">
      {keys.map(key => (
        <div key={key} className="flex items-center gap-2 text-xs">
          <span className="font-medium text-foreground shrink-0">
            {formatActionType(key)}:
          </span>
          <span className="text-muted-foreground">
            {formatDiffValue(entry.old_data?.[key])}
          </span>
          <ArrowRight size={12} className="text-muted-foreground shrink-0" />
          <span className="text-foreground">
            {formatDiffValue(entry.new_data?.[key])}
          </span>
        </div>
      ))}
    </div>
  )
}

function DecisionHistoryEntryRow({ entry }: { entry: DecisionHistoryEntry }) {
  const { t } = useTranslation("partners")

  return (
    <div className="flex flex-col gap-2 border-b border-border last:border-0 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {formatEventType(entry.event_type)}
          </span>
          <span className="text-xs text-muted-foreground">
            · {formatActionType(entry.action_type)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {formatDateTime(entry.occurred_at)}
        </span>
      </div>

      <div className="flex items-center gap-2 pl-4">
        {entry.actor_display && (
          <div className="size-6 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center">
            <span className="text-[10px] font-medium text-muted-foreground">
              {initialsFromName(entry.actor_display)}
            </span>
          </div>
        )}
        <span className="text-xs text-muted-foreground truncate">
          {entry.actor_display ?? t("detail.decisionHistory.systemActor")}
        </span>
        {entry.trigger_source && (
          <span className="text-xs text-muted-foreground/70">
            · {formatActionType(entry.trigger_source)}
          </span>
        )}
      </div>

      <EntryDiff entry={entry} />
    </div>
  )
}

type DecisionHistoryTabProps = {
  partnerId: string
}

function DecisionHistoryTab({ partnerId }: DecisionHistoryTabProps) {
  const { t } = useTranslation("partners")
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePartnerDecisionHistory(partnerId, {
    per_page: DECISION_HISTORY_PAGE_SIZE,
  })

  if (isLoading) {
    return (
      <div className="py-8">
        {Array.from({ length: 4 }, (_, i) => (
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
        {resolveApiErrorMessage(error, t)}
      </p>
    )
  }

  const items = data?.pages.flatMap(p => p.items) ?? []

  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <p className="text-base font-semibold text-foreground">
          {t("detail.decisionHistory.title")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("detail.decisionHistory.subtitle")}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("detail.decisionHistory.empty")}
        </p>
      ) : (
        <div className="w-full border border-border rounded-[10px] bg-background px-3">
          {items.map((entry, i) => (
            <DecisionHistoryEntryRow
              key={`${entry.occurred_at}-${i}`}
              entry={entry}
            />
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
            data-testid="decision-history-load-more"
          >
            {isFetchingNextPage
              ? t("detail.decisionHistory.loadingMore")
              : t("detail.decisionHistory.loadMore")}
          </Button>
        </div>
      )}
    </div>
  )
}

export { DecisionHistoryTab }
