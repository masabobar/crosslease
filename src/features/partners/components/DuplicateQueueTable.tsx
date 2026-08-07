import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TableEmptyState } from "@/components/ui/empty"
import { DuplicateConfidenceBadge } from "@/features/partners/components/DuplicateConfidenceBadge"
import { DuplicatePairStatusBadge } from "@/features/partners/components/DuplicatePairStatusBadge"
import { formatDate } from "@/lib/formatters"
import { DuplicateCandidatePairStatusSchema } from "@/features/partners/api/schema"
import type {
  DuplicateCandidatePairResponse,
  PartnerDetailResponse,
} from "@/features/partners/api/schema"

// NOTE: this table is a flex/div grid rather than shadcn <Table>. The columns
// below mix fixed widths with flex-grow so every partners table lines up
// column-for-column across tabs; <table>'s own sizing algorithm does not honour
// those constraints. Converting is tracked as a follow-up and needs per-screen
// visual verification, so it is deliberately not a drop-in change.
const COL_PARTNER_A = "flex-1 min-w-[180px]"
const COL_PARTNER_B = "flex-1 min-w-[180px]"
const COL_CONFIDENCE = "w-[110px] shrink-0"
const COL_DETECTED_ON = "w-[110px] shrink-0"
const COL_STATUS = "w-[180px] shrink-0"
const COL_ACTION = "w-[140px] shrink-0"
const ROW_H = "min-h-[52px]"
const SKELETON_COUNT = 5

type DuplicateQueueTableProps = {
  pairs: DuplicateCandidatePairResponse[]
  partnersById: Map<string, PartnerDetailResponse>
  isLoading: boolean
  partnersError: boolean
  hasActiveFilters: boolean
  canResolve: boolean
  canInitiateMerge: boolean
  onRowClick: (pair: DuplicateCandidatePairResponse) => void
  onResolve: (pair: DuplicateCandidatePairResponse) => void
  onInitiateMerge: (pair: DuplicateCandidatePairResponse) => void
  onReviewMerge: () => void
}

function PartnerCell({
  partnerId,
  partnersById,
  partnersError,
}: {
  partnerId: string
  partnersById: Map<string, PartnerDetailResponse>
  partnersError: boolean
}) {
  const { t } = useTranslation("partners")
  const partner = partnersById.get(partnerId)
  return (
    <div className="p-2">
      <p className="text-sm font-medium truncate text-foreground leading-tight">
        {partner?.display_name ?? (partnersError ? t("errors.generic") : "…")}
      </p>
      {partner && (
        <p className="text-xs text-muted-foreground truncate">
          {t(`type.${partner.partner_type}` as "type.legal_entity")}
        </p>
      )}
    </div>
  )
}

function DuplicateQueueTable({
  pairs,
  partnersById,
  isLoading,
  partnersError,
  hasActiveFilters,
  canResolve,
  canInitiateMerge,
  onRowClick,
  onResolve,
  onInitiateMerge,
  onReviewMerge,
}: DuplicateQueueTableProps) {
  const { t } = useTranslation("partners")

  return (
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="duplicate-queue-table"
    >
      {/* Header */}
      <div className="flex border-b border-border h-10 items-center">
        <div
          className={`${COL_PARTNER_A} text-sm font-medium text-foreground px-2`}
        >
          {t("duplicates.list.table.columns.partnerA")}
        </div>
        <div
          className={`${COL_PARTNER_B} text-sm font-medium text-foreground px-2`}
        >
          {t("duplicates.list.table.columns.partnerB")}
        </div>
        <div
          className={`${COL_CONFIDENCE} text-sm font-medium text-foreground px-2`}
        >
          {t("duplicates.list.table.columns.confidence")}
        </div>
        <div
          className={`${COL_DETECTED_ON} text-sm font-medium text-foreground px-2`}
        >
          {t("duplicates.list.table.columns.detectedOn")}
        </div>
        <div
          className={`${COL_STATUS} text-sm font-medium text-foreground px-2`}
        >
          {t("duplicates.list.table.columns.status")}
        </div>
        <div className={`${COL_ACTION} shrink-0`} />
        <div className="shrink-0 w-8" />
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div data-testid="duplicate-queue-table-loading">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div
              key={i}
              className={`flex border-b border-border ${ROW_H} items-center`}
            >
              <div className={`${COL_PARTNER_A} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-32" />
              </div>
              <div className={`${COL_PARTNER_B} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-32" />
              </div>
              <div className={`${COL_CONFIDENCE} p-2`}>
                <div className="bg-muted rounded-full h-5 animate-pulse w-16" />
              </div>
              <div className={`${COL_DETECTED_ON} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-16" />
              </div>
              <div className={`${COL_STATUS} p-2`}>
                <div className="bg-muted rounded-full h-5 animate-pulse w-24" />
              </div>
              <div className={`${COL_ACTION} shrink-0`} />
              <div className="shrink-0 w-8" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && pairs.length === 0 && (
        <TableEmptyState
          title={
            hasActiveFilters
              ? t("duplicates.list.emptyFiltered.title")
              : t("duplicates.list.emptyState.title")
          }
          description={
            hasActiveFilters
              ? t("duplicates.list.emptyFiltered.description")
              : t("duplicates.list.emptyState.description")
          }
        />
      )}

      {/* Data rows */}
      {!isLoading &&
        pairs.map(pair => (
          <div
            key={pair.pair_id}
            data-testid={`duplicate-pair-row-${pair.pair_id}`}
            onClick={() => onRowClick(pair)}
            className={`flex border-b border-border last:border-b-0 ${ROW_H} items-center hover:bg-muted/40 transition-colors cursor-pointer`}
          >
            <div className={COL_PARTNER_A}>
              <PartnerCell
                partnerId={pair.partner_a_id}
                partnersById={partnersById}
                partnersError={partnersError}
              />
            </div>
            <div className={COL_PARTNER_B}>
              <PartnerCell
                partnerId={pair.partner_b_id}
                partnersById={partnersById}
                partnersError={partnersError}
              />
            </div>
            <div className={`${COL_CONFIDENCE} p-2`}>
              <DuplicateConfidenceBadge confidence={pair.confidence} />
            </div>
            <div className={`${COL_DETECTED_ON} p-2`}>
              <span className="text-sm text-muted-foreground">
                {formatDate(pair.detected_at)}
              </span>
            </div>
            <div className={`${COL_STATUS} p-2`}>
              <DuplicatePairStatusBadge status={pair.status} />
            </div>
            <div
              className={`${COL_ACTION} p-2 flex items-center`}
              onClick={e => e.stopPropagation()}
            >
              {canResolve &&
                (pair.status ===
                  DuplicateCandidatePairStatusSchema.enum.pending ||
                  pair.status ===
                    DuplicateCandidatePairStatusSchema.enum.deferred) && (
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`duplicate-pair-resolve-${pair.pair_id}`}
                    onClick={() => onResolve(pair)}
                  >
                    {t("duplicates.list.table.actions.resolve")}
                  </Button>
                )}
              {canInitiateMerge &&
                pair.status ===
                  DuplicateCandidatePairStatusSchema.enum
                    .confirmed_duplicate && (
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`duplicate-pair-initiate-merge-${pair.pair_id}`}
                    onClick={() => onInitiateMerge(pair)}
                  >
                    {t("duplicates.list.table.actions.initiateMerge")}
                  </Button>
                )}
              {canResolve &&
                pair.status ===
                  DuplicateCandidatePairStatusSchema.enum.merge_in_progress && (
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`duplicate-pair-review-merge-${pair.pair_id}`}
                    onClick={onReviewMerge}
                  >
                    {t("duplicates.list.table.actions.reviewMerge")}
                  </Button>
                )}
            </div>
            <div className="shrink-0 w-8 flex items-center justify-center">
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          </div>
        ))}
    </div>
  )
}

export { DuplicateQueueTable }
