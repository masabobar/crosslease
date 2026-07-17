import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import { FilterPill } from "@/components/ui/filter-pill"
import { cn } from "@/lib/utils"
import { DuplicateQueueTable } from "@/features/partners/components/DuplicateQueueTable"
import { ResolveDuplicateDialog } from "@/features/partners/components/ResolveDuplicateDialog"
import { TenantScopeGate } from "@/components/TenantScopeGate"
import { useDuplicatePairs } from "@/features/partners/hooks/useDuplicatePairs"
import { usePartnersByIds } from "@/features/partners/hooks/usePartnersByIds"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useTenantSelectionStore } from "@/store/tenantSelectionStore"
import { SYSTEM_ADMIN_ROLE } from "@/features/users/types"
import {
  PARTNER_DUPLICATE_RESOLVE_ALLOWED_ROLES,
  PARTNER_MERGE_INITIATE_ALLOWED_ROLES,
} from "@/features/partners/types"
import { PATHS, partnerDuplicateDetail } from "@/router/paths"
import {
  DuplicateCandidatePairStatusSchema,
  DuplicateConfidenceSchema,
} from "@/features/partners/api/schema"
import type {
  DuplicateCandidatePairResponse,
  DuplicateCandidatePairStatus,
  DuplicateConfidence,
} from "@/features/partners/api/schema"

const STATUS_OPTIONS: DuplicateCandidatePairStatus[] =
  DuplicateCandidatePairStatusSchema.options

const CONFIDENCE_OPTIONS: DuplicateConfidence[] =
  DuplicateConfidenceSchema.options

export default function DuplicateQueuePage() {
  const { t } = useTranslation("partners")
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const selectedTenantId = useTenantSelectionStore(s => s.selectedTenantId)
  const tenantId =
    currentUser?.tenant_id ??
    (currentUser?.role === SYSTEM_ADMIN_ROLE ? selectedTenantId : null)

  const canResolve =
    !!currentUser &&
    PARTNER_DUPLICATE_RESOLVE_ALLOWED_ROLES.includes(currentUser.role)
  const canInitiateMerge =
    !!currentUser &&
    PARTNER_MERGE_INITIATE_ALLOWED_ROLES.includes(currentUser.role)

  const [search, setSearch] = useState("")
  const [statusFilters, setStatusFilters] = useState<
    DuplicateCandidatePairStatus[]
  >([])
  const [confidenceFilters, setConfidenceFilters] = useState<
    DuplicateConfidence[]
  >([])
  const [resolveTarget, setResolveTarget] =
    useState<DuplicateCandidatePairResponse | null>(null)

  const { data, isLoading, isError } = useDuplicatePairs(tenantId)
  const pairs = data?.items ?? []

  const partnerIds = pairs.flatMap(p => [p.partner_a_id, p.partner_b_id])
  const { partnersById, isError: isPartnersError } =
    usePartnersByIds(partnerIds)

  const searchValue = search.trim().toLowerCase()
  const filteredPairs = pairs.filter(pair => {
    if (statusFilters.length > 0 && !statusFilters.includes(pair.status)) {
      return false
    }
    if (
      confidenceFilters.length > 0 &&
      !confidenceFilters.includes(pair.confidence)
    ) {
      return false
    }
    if (searchValue) {
      const nameA = partnersById.get(pair.partner_a_id)?.display_name ?? ""
      const nameB = partnersById.get(pair.partner_b_id)?.display_name ?? ""
      if (
        !nameA.toLowerCase().includes(searchValue) &&
        !nameB.toLowerCase().includes(searchValue)
      ) {
        return false
      }
    }
    return true
  })

  const hasActiveFilters =
    !!search.trim() || statusFilters.length > 0 || confidenceFilters.length > 0

  function toggleStatus(status: DuplicateCandidatePairStatus) {
    setStatusFilters(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  function toggleConfidence(confidence: DuplicateConfidence) {
    setConfidenceFilters(prev =>
      prev.includes(confidence)
        ? prev.filter(c => c !== confidence)
        : [...prev, confidence]
    )
  }

  if (currentUser && !tenantId) {
    return (
      <TenantScopeGate
        isSystemAdmin={currentUser.role === SYSTEM_ADMIN_ROLE}
        selectTenantPrompt={t("list.selectTenantPrompt")}
        tenantRequiredMessage={t("list.tenantRequired")}
      />
    )
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("duplicates.list.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("duplicates.list.subtitle")}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-6 mt-6">
        <SearchInput
          data-testid="duplicate-filter-search"
          placeholder={t("duplicates.list.filters.searchPlaceholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-[288px]"
        />

        <div className="flex items-center gap-2">
          <FilterButton
            data-testid="duplicate-filter-status"
            label={t("duplicates.list.filters.status")}
            count={statusFilters.length}
            contentClassName="w-56"
          >
            {STATUS_OPTIONS.map(status => {
              const checked = statusFilters.includes(status)
              return (
                <Button
                  key={status}
                  variant="ghost"
                  data-testid={`duplicate-filter-status-${status}`}
                  onClick={() => toggleStatus(status)}
                  className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
                >
                  <span
                    className={cn(
                      "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
                      checked ? "bg-primary border-primary" : "border-border"
                    )}
                  >
                    {checked && <Check size={10} className="text-white" />}
                  </span>
                  <span className="text-sm text-foreground">
                    {t(
                      `duplicates.pairStatus.${status}` as "duplicates.pairStatus.pending"
                    )}
                  </span>
                </Button>
              )
            })}
          </FilterButton>

          <FilterButton
            data-testid="duplicate-filter-confidence"
            label={t("duplicates.list.filters.confidence")}
            count={confidenceFilters.length}
            contentClassName="w-44"
          >
            {CONFIDENCE_OPTIONS.map(confidence => {
              const checked = confidenceFilters.includes(confidence)
              return (
                <Button
                  key={confidence}
                  variant="ghost"
                  data-testid={`duplicate-filter-confidence-${confidence}`}
                  onClick={() => toggleConfidence(confidence)}
                  className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
                >
                  <span
                    className={cn(
                      "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
                      checked ? "bg-primary border-primary" : "border-border"
                    )}
                  >
                    {checked && <Check size={10} className="text-white" />}
                  </span>
                  <span className="text-sm text-foreground">
                    {t(
                      `duplicates.confidence.${confidence}` as "duplicates.confidence.definite"
                    )}
                  </span>
                </Button>
              )
            })}
          </FilterButton>
        </div>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {search.trim() && (
            <FilterPill
              label={t("duplicates.list.filterPills.search", {
                value: search.trim(),
              })}
              onRemove={() => setSearch("")}
              data-testid="duplicate-filter-pill-remove-search"
            />
          )}
          {statusFilters.map(status => (
            <FilterPill
              key={`status-${status}`}
              label={t("duplicates.list.filterPills.status", {
                value: t(
                  `duplicates.pairStatus.${status}` as "duplicates.pairStatus.pending"
                ),
              })}
              onRemove={() => toggleStatus(status)}
              data-testid={`duplicate-filter-pill-remove-status-${status}`}
            />
          ))}
          {confidenceFilters.map(confidence => (
            <FilterPill
              key={`confidence-${confidence}`}
              label={t("duplicates.list.filterPills.confidence", {
                value: t(
                  `duplicates.confidence.${confidence}` as "duplicates.confidence.definite"
                ),
              })}
              onRemove={() => toggleConfidence(confidence)}
              data-testid={`duplicate-filter-pill-remove-confidence-${confidence}`}
            />
          ))}
          <Button
            type="button"
            variant="ghost"
            data-testid="duplicate-filters-clear-all"
            onClick={() => {
              setSearch("")
              setStatusFilters([])
              setConfidenceFilters([])
            }}
            className="h-auto px-2 py-0 text-xs font-normal text-destructive hover:text-destructive hover:bg-transparent hover:opacity-80 transition-opacity"
          >
            {t("duplicates.list.filters.clearAll")}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4">
        {isError && !isLoading && (
          <p className="text-sm text-destructive py-8 text-center">
            {t("errors.generic")}
          </p>
        )}
        {!isError && (
          <DuplicateQueueTable
            pairs={filteredPairs}
            partnersById={partnersById}
            isLoading={isLoading}
            partnersError={isPartnersError}
            hasActiveFilters={hasActiveFilters}
            canResolve={canResolve}
            canInitiateMerge={canInitiateMerge}
            onRowClick={pair => navigate(partnerDuplicateDetail(pair.pair_id))}
            onResolve={setResolveTarget}
            onInitiateMerge={pair =>
              navigate(partnerDuplicateDetail(pair.pair_id))
            }
            onReviewMerge={() => navigate(PATHS.PENDING_APPROVALS)}
          />
        )}
      </div>

      {/* Dialogs */}
      {resolveTarget && (
        <ResolveDuplicateDialog
          open={!!resolveTarget}
          onOpenChange={open => !open && setResolveTarget(null)}
          pair={resolveTarget}
          tenantId={tenantId}
        />
      )}
    </div>
  )
}
