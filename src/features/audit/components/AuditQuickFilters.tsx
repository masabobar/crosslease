import { parseISO } from "date-fns"
import { Calendar, Check, Filter, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { useTenants } from "@/features/tenants/hooks/useTenants"
import { TenantStatusSchema } from "@/features/tenants/api/schema"
import { getAuditFilterVisibility } from "@/features/audit/types"
import type { AuditFilterState } from "@/features/audit/types"
import type { UserRole } from "@/features/users/types"
import { Button } from "@/components/ui/button"
import { AUDIT_EVENT_TYPES } from "@/features/audit/api/schema"
import { formatEventType } from "@/lib/formatters"

type AuditQuickFiltersProps = {
  appliedFilters: AuditFilterState
  onFilterChange: (update: Partial<AuditFilterState>) => void
  viewerRole?: UserRole | null
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

export function AuditQuickFilters({
  appliedFilters,
  onFilterChange,
  viewerRole,
  className,
}: AuditQuickFiltersProps) {
  const { t } = useTranslation("audit")
  const filterVis = getAuditFilterVisibility(viewerRole)
  const { data: tenantsData } = useTenants(filterVis.tenant)

  const tenantOptions = (tenantsData?.tenants ?? [])
    .filter(ten => ten.status === TenantStatusSchema.enum.active)
    .map(ten => ({ value: ten.id, label: ten.name }))

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {/* Search */}
      <Input
        data-testid="filter-search-input"
        placeholder={t("filterBar.searchPlaceholder")}
        value={appliedFilters.search ?? ""}
        onChange={e => onFilterChange({ search: e.target.value || null })}
        className="h-8 w-[288px] text-sm"
        endAction={
          <Search
            size={16}
            className="text-muted-foreground pointer-events-none"
          />
        }
      />

      <div className="flex items-center gap-2">
        {/* Event Type */}
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

        {/* Tenant (system_admin only) */}
        {filterVis.tenant && (
          <Popover>
            <PopoverTrigger
              data-testid="filter-tenant-button"
              className={FILTER_BTN}
            >
              <Filter size={16} className="shrink-0 text-muted-foreground" />
              {t("filterBar.buttons.tenant")}
              <ActiveBadge count={appliedFilters.tenant_id ? 1 : 0} />
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="start"
              className="w-56 p-0 py-1 max-h-60 overflow-y-auto"
            >
              {tenantOptions.map(o => {
                const selected = appliedFilters.tenant_id === o.value
                return (
                  <Button
                    key={o.value}
                    variant="ghost"
                    data-testid={`filter-option-tenant-${o.value}`}
                    onClick={() =>
                      onFilterChange({ tenant_id: selected ? null : o.value })
                    }
                    className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
                  >
                    <span
                      className={cn(
                        "shrink-0 size-4 rounded-full border flex items-center justify-center transition-colors",
                        selected ? "bg-primary border-primary" : "border-border"
                      )}
                    >
                      {selected && (
                        <span className="size-2 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="text-sm text-foreground truncate">
                      {o.label}
                    </span>
                  </Button>
                )
              })}
            </PopoverContent>
          </Popover>
        )}

        {/* Date Range */}
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
      </div>
    </div>
  )
}
