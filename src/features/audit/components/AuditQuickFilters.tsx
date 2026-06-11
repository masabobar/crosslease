import { useState } from "react"
import { parseISO } from "date-fns"
import { Calendar, Check, Filter, Search, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import type { AuditFilterState } from "@/features/audit/types"
import { Button } from "@/components/ui/button"
import { AUDIT_EVENT_TYPES } from "@/features/audit/api/schema"
import { formatEventType, formatActionType } from "@/lib/formatters"

const ACTION_TYPES = [
  "create",
  "update",
  "state_transition",
  "access",
  "approval",
  "rejection",
] as const

const TRIGGER_SOURCES = [
  "manual",
  "automatic",
  "scheduled_job",
  "lifecycle_engine",
] as const

const ENTITY_TYPES = [
  "user",
  "contract",
  "financing",
  "request",
  "document",
  "partner",
  "system",
] as const

type AuditQuickFiltersProps = {
  appliedFilters: AuditFilterState
  onFilterChange: (update: Partial<AuditFilterState>) => void
  className?: string
}

const FILTER_BTN =
  "inline-flex items-center gap-1.5 h-8 px-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-xl hover:bg-muted data-[popup-open]:bg-muted transition-colors whitespace-nowrap"

function ActiveBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-sky-600 text-white text-xs font-medium leading-none">
      {count}
    </span>
  )
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

export function AuditQuickFilters({
  appliedFilters,
  onFilterChange,
  className,
}: AuditQuickFiltersProps) {
  const { t } = useTranslation("audit")
  const [actorInputValue, setActorInputValue] = useState(
    appliedFilters.actor_id ?? ""
  )

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Search */}
      <Input
        data-testid="filter-search-input"
        placeholder={t("filterBar.searchPlaceholder")}
        value={appliedFilters.search ?? ""}
        onChange={e => onFilterChange({ search: e.target.value || null })}
        className="h-8 w-[220px] text-sm"
        endAction={
          <Search
            size={16}
            className="text-muted-foreground pointer-events-none"
          />
        }
      />

      {/* Entity type */}
      <Popover>
        <PopoverTrigger
          data-testid="filter-entity-type-button"
          className={FILTER_BTN}
        >
          <Filter size={16} className="shrink-0 text-muted-foreground" />
          {t("filterBar.buttons.entityType")}
          <ActiveBadge count={appliedFilters.entity_type ? 1 : 0} />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-48 p-0 py-1">
          <SingleSelectPopover
            options={ENTITY_TYPES}
            selected={
              appliedFilters.entity_type as (typeof ENTITY_TYPES)[number] | null
            }
            onSelect={v => onFilterChange({ entity_type: v })}
            formatLabel={v =>
              t(`entityType.${v}`, { defaultValue: formatActionType(v) })
            }
            testIdPrefix="filter-option-entity-type"
          />
        </PopoverContent>
      </Popover>

      {/* Event type */}
      <Popover>
        <PopoverTrigger
          data-testid="filter-event-type-button"
          className={FILTER_BTN}
        >
          <Filter size={16} className="shrink-0 text-muted-foreground" />
          {t("filterBar.buttons.eventType")}
          <ActiveBadge count={appliedFilters.event_type.length} />
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className="w-56 p-0 py-1 max-h-72 overflow-y-auto"
        >
          {AUDIT_EVENT_TYPES.map(et => {
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
        </PopoverContent>
      </Popover>

      {/* Action type */}
      <Popover>
        <PopoverTrigger
          data-testid="filter-action-type-button"
          className={FILTER_BTN}
        >
          <Filter size={16} className="shrink-0 text-muted-foreground" />
          {t("filterBar.buttons.action")}
          <ActiveBadge count={appliedFilters.action_type ? 1 : 0} />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-48 p-0 py-1">
          <SingleSelectPopover
            options={ACTION_TYPES}
            selected={
              appliedFilters.action_type as (typeof ACTION_TYPES)[number] | null
            }
            onSelect={v => onFilterChange({ action_type: v })}
            formatLabel={v => formatActionType(v)}
            testIdPrefix="filter-option-action-type"
          />
        </PopoverContent>
      </Popover>

      {/* Actor */}
      <Popover>
        <PopoverTrigger
          data-testid="filter-actor-button"
          className={FILTER_BTN}
        >
          <Filter size={16} className="shrink-0 text-muted-foreground" />
          {t("filterBar.buttons.actor")}
          <ActiveBadge count={appliedFilters.actor_id ? 1 : 0} />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-72 p-3">
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
        </PopoverContent>
      </Popover>

      {/* Trigger sources */}
      <Popover>
        <PopoverTrigger
          data-testid="filter-trigger-source-button"
          className={FILTER_BTN}
        >
          <Filter size={16} className="shrink-0 text-muted-foreground" />
          {t("filterBar.buttons.triggerSource")}
          <ActiveBadge count={appliedFilters.trigger_source ? 1 : 0} />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-48 p-0 py-1">
          <SingleSelectPopover
            options={TRIGGER_SOURCES}
            selected={
              appliedFilters.trigger_source as
                | (typeof TRIGGER_SOURCES)[number]
                | null
            }
            onSelect={v => onFilterChange({ trigger_source: v })}
            formatLabel={v => formatActionType(v)}
            testIdPrefix="filter-option-trigger-source"
          />
        </PopoverContent>
      </Popover>

      {/* Date range */}
      <Popover>
        <PopoverTrigger
          data-testid="filter-date-range-button"
          className={FILTER_BTN}
        >
          <Calendar size={16} className="shrink-0 text-muted-foreground" />
          {t("filterBar.buttons.dateRange")}
          <ActiveBadge
            count={
              [appliedFilters.from_dt, appliedFilters.to_dt].filter(Boolean)
                .length
            }
          />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-72 py-0">
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
        </PopoverContent>
      </Popover>

      {/* Sensitive toggle */}
      <button
        type="button"
        data-testid="filter-sensitive-button"
        onClick={() =>
          onFilterChange({
            sensitive: appliedFilters.sensitive === true ? null : true,
          })
        }
        className={cn(
          FILTER_BTN,
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
