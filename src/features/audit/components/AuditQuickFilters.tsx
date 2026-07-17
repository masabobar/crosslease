import { useState } from "react"
import { parseISO } from "date-fns"
import { Check, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import type { AuditFilterState } from "@/features/audit/types"
import { Button } from "@/components/ui/button"
import { formatEventType, formatActionType } from "@/lib/formatters"
import {
  FilterButton,
  FILTER_TRIGGER_CLASS,
} from "@/components/ui/filter-button"
import { useAuditFilterOptions } from "@/features/audit/hooks/useAuditFilterOptions"

type AuditQuickFiltersProps = {
  appliedFilters: AuditFilterState
  onFilterChange: (update: Partial<AuditFilterState>) => void
  className?: string
}

function SingleSelectPopover<T extends string>({
  options,
  selected,
  onSelect,
  formatLabel,
  testIdPrefix,
}: {
  options: readonly T[]
  selected: T | null
  onSelect: (value: T | null) => void
  formatLabel: (v: T) => string
  testIdPrefix: string
}) {
  return (
    <>
      {options.map(opt => {
        const isSelected = selected === opt
        return (
          <Button
            key={opt}
            variant="ghost"
            data-testid={`${testIdPrefix}-${opt}`}
            onClick={() => onSelect(isSelected ? null : opt)}
            className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
          >
            <span
              className={cn(
                "shrink-0 size-4 rounded-full border flex items-center justify-center transition-colors",
                isSelected ? "bg-primary border-primary" : "border-border"
              )}
            >
              {isSelected && <span className="size-2 rounded-full bg-white" />}
            </span>
            <span className="text-sm text-foreground">{formatLabel(opt)}</span>
          </Button>
        )
      })}
    </>
  )
}

function FilterOptionsError({ error }: { error: unknown }) {
  const { t } = useTranslation("audit")
  return (
    <p className="px-3 py-2 text-sm text-destructive">
      {error instanceof ApiError
        ? t(`errors.${error.code}`, { defaultValue: t("errors.generic") })
        : t("errors.generic")}
    </p>
  )
}

export function AuditQuickFilters({
  appliedFilters,
  onFilterChange,
  className,
}: AuditQuickFiltersProps) {
  const { t } = useTranslation("audit")
  const [actorInputValue, setActorInputValue] = useState(
    appliedFilters.actor_id ?? ""
  )
  const [lastAppliedActorId, setLastAppliedActorId] = useState(
    appliedFilters.actor_id
  )
  if (appliedFilters.actor_id !== lastAppliedActorId) {
    setLastAppliedActorId(appliedFilters.actor_id)
    setActorInputValue(appliedFilters.actor_id ?? "")
  }
  const {
    data: filterOptions,
    isError: isFilterOptionsError,
    error: filterOptionsError,
  } = useAuditFilterOptions()

  const entityTypes = filterOptions?.entity_types ?? []
  const actionTypes = filterOptions?.action_types ?? []
  const triggerSources = filterOptions?.trigger_sources ?? []
  const eventTypes = filterOptions?.event_types ?? []

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <FilterButton
        data-testid="filter-entity-type-button"
        label={t("filterBar.buttons.entityType")}
        count={appliedFilters.entity_type ? 1 : 0}
        contentClassName="w-48"
      >
        {isFilterOptionsError ? (
          <FilterOptionsError error={filterOptionsError} />
        ) : (
          <SingleSelectPopover
            options={entityTypes}
            selected={appliedFilters.entity_type}
            onSelect={v => onFilterChange({ entity_type: v })}
            formatLabel={v =>
              t(`entityType.${v}`, { defaultValue: formatActionType(v) })
            }
            testIdPrefix="filter-option-entity-type"
          />
        )}
      </FilterButton>

      <FilterButton
        data-testid="filter-event-type-button"
        label={t("filterBar.buttons.eventType")}
        count={appliedFilters.event_type.length}
        contentClassName="w-56 max-h-72 overflow-y-auto"
      >
        {isFilterOptionsError && (
          <FilterOptionsError error={filterOptionsError} />
        )}
        {!isFilterOptionsError &&
          eventTypes.map(et => {
            const checked = appliedFilters.event_type.includes(et)
            return (
              <Button
                key={et}
                variant="ghost"
                data-testid={`filter-option-event-type-${et}`}
                onClick={() =>
                  onFilterChange({
                    event_type: checked
                      ? appliedFilters.event_type.filter(e => e !== et)
                      : [...appliedFilters.event_type, et],
                  })
                }
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
                  {formatEventType(et)}
                </span>
              </Button>
            )
          })}
      </FilterButton>

      <FilterButton
        data-testid="filter-action-type-button"
        label={t("filterBar.buttons.action")}
        count={appliedFilters.action_type ? 1 : 0}
        contentClassName="w-48"
      >
        {isFilterOptionsError ? (
          <FilterOptionsError error={filterOptionsError} />
        ) : (
          <SingleSelectPopover
            options={actionTypes}
            selected={appliedFilters.action_type}
            onSelect={v => onFilterChange({ action_type: v })}
            formatLabel={v => formatActionType(v)}
            testIdPrefix="filter-option-action-type"
          />
        )}
      </FilterButton>

      <FilterButton
        data-testid="filter-actor-button"
        label={t("filterBar.buttons.actor")}
        count={appliedFilters.actor_id ? 1 : 0}
        contentClassName="w-72 p-3"
      >
        <Input
          data-testid="filter-actor-input"
          placeholder={t("filter.placeholders.uuid")}
          value={actorInputValue}
          onChange={e => setActorInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              onFilterChange({ actor_id: actorInputValue || null })
            }
          }}
          className="h-8 text-sm"
        />
        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActorInputValue("")
              onFilterChange({ actor_id: null })
            }}
          >
            {t("filterBar.clear")}
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onFilterChange({ actor_id: actorInputValue || null })
            }
          >
            {t("filterBar.apply")}
          </Button>
        </div>
      </FilterButton>

      <FilterButton
        data-testid="filter-trigger-source-button"
        label={t("filterBar.buttons.triggerSource")}
        count={appliedFilters.trigger_source ? 1 : 0}
        contentClassName="w-48"
      >
        {isFilterOptionsError ? (
          <FilterOptionsError error={filterOptionsError} />
        ) : (
          <SingleSelectPopover
            options={triggerSources}
            selected={appliedFilters.trigger_source}
            onSelect={v => onFilterChange({ trigger_source: v })}
            formatLabel={v => formatActionType(v)}
            testIdPrefix="filter-option-trigger-source"
          />
        )}
      </FilterButton>

      <FilterButton
        data-testid="filter-date-range-button"
        label={t("filterBar.buttons.dateRange")}
        count={
          [appliedFilters.from_dt, appliedFilters.to_dt].filter(Boolean).length
        }
        icon="calendar"
        contentClassName="w-72 py-0"
      >
        <div className="p-3">
          <div className="flex gap-2">
            <DatePicker
              value={appliedFilters.from_dt ?? undefined}
              onChange={v => {
                const newFrom = parseISO(v)
                const currentTo = appliedFilters.to_dt
                  ? parseISO(appliedFilters.to_dt)
                  : null
                onFilterChange({
                  from_dt: v,
                  to_dt:
                    currentTo && currentTo < newFrom
                      ? null
                      : appliedFilters.to_dt,
                })
              }}
              placeholder={t("filter.placeholders.from")}
              maxDate={new Date()}
            />
            <DatePicker
              value={appliedFilters.to_dt ?? undefined}
              onChange={v => onFilterChange({ to_dt: v })}
              placeholder={t("filter.placeholders.to")}
              maxDate={new Date()}
              minDate={
                appliedFilters.from_dt
                  ? parseISO(appliedFilters.from_dt)
                  : undefined
              }
            />
          </div>
        </div>
      </FilterButton>

      {/* NOTE: raw <button> — toggle chip with custom active colour; shadcn Toggle renders a different DOM shape that breaks chip row alignment */}
      <button
        type="button"
        data-testid="filter-sensitive-button"
        onClick={() =>
          onFilterChange({
            sensitive: appliedFilters.sensitive === true ? null : true,
          })
        }
        className={cn(
          FILTER_TRIGGER_CLASS,
          appliedFilters.sensitive === true &&
            "bg-destructive/10 border-destructive/40 text-destructive hover:bg-destructive/15"
        )}
      >
        <Shield size={16} className="shrink-0" />
        {t("filterBar.buttons.sensitive")}
      </button>
    </div>
  )
}
