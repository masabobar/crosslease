import { parseISO } from "date-fns"
import { FileDown, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { USER_ROLES } from "@/features/users/types"
import type { UserRole, UserFilterState } from "@/features/users/types"
import { USER_STATUSES } from "@/features/users/api/schema"
import type { ExportFormat, UserStatus } from "@/features/users/api/schema"
import type { UserFilterVisibility } from "@/features/users/utils"
import { DatePicker } from "@/components/ui/date-picker"
import { useTenants } from "@/features/tenants/hooks/useTenants"
import { TenantStatusSchema } from "@/features/tenants/api/schema"
import { FilterCheckboxOption } from "@/components/ui/filter-checkbox-option"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge"

export type QuickFilterKey = "role" | "tenant" | "status" | "lastLogin"

type FilterButtonConfig = {
  key: QuickFilterKey
  icon: "filter" | "calendar"
  visibilityKey?: keyof UserFilterVisibility
  contentClassName: string
}

const FILTER_BUTTONS: FilterButtonConfig[] = [
  { key: "role", icon: "filter", contentClassName: "w-48" },
  {
    key: "tenant",
    icon: "filter",
    visibilityKey: "tenant",
    contentClassName: "w-48 max-h-60 overflow-y-auto",
  },
  { key: "status", icon: "filter", contentClassName: "w-48" },
  {
    key: "lastLogin",
    icon: "calendar",
    visibilityKey: "lastLogin",
    contentClassName: "w-72 py-0",
  },
]

function getFilterCount(key: QuickFilterKey, filters: UserFilterState): number {
  switch (key) {
    case "role":
      return filters.role.length
    case "status":
      return filters.status.length
    case "tenant":
      return filters.tenant_id ? 1 : 0
    case "lastLogin":
      return [filters.last_login_from, filters.last_login_to].filter(Boolean)
        .length
  }
}

type UserQuickFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  appliedFilters: UserFilterState
  filterVisibility: UserFilterVisibility
  onFilterChange: (update: Partial<UserFilterState>) => void
  onOpenAdvanced: () => void
  onExport?: (format: ExportFormat) => void
  isExporting?: boolean
  className?: string
}

export function UserQuickFilters({
  search,
  onSearchChange,
  appliedFilters,
  filterVisibility,
  onFilterChange,
  onOpenAdvanced,
  onExport,
  isExporting = false,
  className,
}: UserQuickFiltersProps) {
  const { t } = useTranslation("users")
  const { data: tenantsData } = useTenants(filterVisibility.tenant)

  const buttonLabels: Record<QuickFilterKey, string> = {
    role: t("quickFilters.buttons.role"),
    tenant: t("quickFilters.buttons.tenant"),
    status: t("quickFilters.buttons.status"),
    lastLogin: t("quickFilters.buttons.lastLogin"),
  }

  const visibleButtons = FILTER_BUTTONS.filter(
    ({ visibilityKey }) => !visibilityKey || filterVisibility[visibilityKey]
  )

  function renderPopoverContent(key: QuickFilterKey) {
    switch (key) {
      case "role":
        return USER_ROLES.map((role: UserRole) => {
          const checked = appliedFilters.role.includes(role)
          return (
            <FilterCheckboxOption
              key={role}
              checked={checked}
              data-testid={`filter-option-role-${role}`}
              onClick={() =>
                onFilterChange({
                  role: checked
                    ? appliedFilters.role.filter(r => r !== role)
                    : [...appliedFilters.role, role],
                })
              }
            >
              <RoleBadge role={role} />
            </FilterCheckboxOption>
          )
        })

      case "tenant": {
        const tenants = (tenantsData?.tenants ?? []).filter(
          tenant => tenant.status === TenantStatusSchema.enum.active
        )
        if (tenants.length === 0) {
          return (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {t("quickFilters.noTenantsAvailable")}
            </p>
          )
        }
        return tenants.map(tenant => {
          const selected = appliedFilters.tenant_id === tenant.id
          return (
            <Button
              key={tenant.id}
              variant="ghost"
              data-testid={`filter-option-tenant-${tenant.id}`}
              onClick={() =>
                onFilterChange({ tenant_id: selected ? null : tenant.id })
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
                  <span className="size-2 rounded-full bg-primary-foreground" />
                )}
              </span>
              <span className="text-sm text-foreground truncate">
                {tenant.name}
              </span>
            </Button>
          )
        })
      }

      case "status":
        return USER_STATUSES.map((status: UserStatus) => {
          const checked = appliedFilters.status.includes(status)
          return (
            <FilterCheckboxOption
              key={status}
              checked={checked}
              data-testid={`filter-option-status-${status}`}
              onClick={() =>
                onFilterChange({
                  status: checked
                    ? appliedFilters.status.filter(s => s !== status)
                    : [...appliedFilters.status, status],
                })
              }
            >
              <UserStatusBadge status={status} />
            </FilterCheckboxOption>
          )
        })

      case "lastLogin":
        return (
          <div className="p-3">
            <div className="flex gap-2">
              <DatePicker
                value={appliedFilters.last_login_from ?? undefined}
                onChange={v => {
                  const newFrom = parseISO(v)
                  const currentTo = appliedFilters.last_login_to
                    ? parseISO(appliedFilters.last_login_to)
                    : null
                  onFilterChange({
                    last_login_from: v,
                    last_login_to:
                      currentTo && currentTo < newFrom
                        ? null
                        : appliedFilters.last_login_to,
                  })
                }}
                placeholder={t("filter.placeholders.from")}
                maxDate={new Date()}
                captionLayout="dropdown"
              />
              <DatePicker
                value={appliedFilters.last_login_to ?? undefined}
                onChange={v => onFilterChange({ last_login_to: v })}
                placeholder={t("filter.placeholders.to")}
                maxDate={new Date()}
                minDate={
                  appliedFilters.last_login_from
                    ? parseISO(appliedFilters.last_login_from)
                    : undefined
                }
                captionLayout="dropdown"
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-6">
        <SearchInput
          data-testid="user-search-input"
          placeholder={t("quickFilters.searchPlaceholder")}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-[288px]"
        />

        <div className="flex items-center gap-2">
          {visibleButtons.map(({ key, icon, contentClassName }) => {
            const count = getFilterCount(key, appliedFilters)
            return (
              <FilterButton
                key={key}
                data-testid={`filter-${key}-button`}
                label={buttonLabels[key]}
                count={count}
                icon={icon}
                contentClassName={contentClassName}
              >
                {renderPopoverContent(key)}
              </FilterButton>
            )
          })}

          <Button
            variant="outline"
            data-testid="advanced-filters-button"
            onClick={onOpenAdvanced}
            className="h-8 rounded-xl px-2.5 text-sm"
          >
            {t("quickFilters.advancedFilters")}
          </Button>
        </div>
      </div>

      {onExport && (
        <DropdownMenu>
          <DropdownMenuTrigger
            data-testid="export-button"
            disabled={isExporting}
            className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2
                size={16}
                className="shrink-0 text-muted-foreground animate-spin"
              />
            ) : (
              <FileDown size={16} className="shrink-0 text-muted-foreground" />
            )}
            {t("quickFilters.export")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              data-testid="export-csv-option"
              onClick={() => onExport("csv")}
            >
              {t("quickFilters.exportCsv")}
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid="export-xlsx-option"
              onClick={() => onExport("xlsx")}
            >
              {t("quickFilters.exportXlsx")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
