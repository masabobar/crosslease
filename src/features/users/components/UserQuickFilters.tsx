import { parseISO } from "date-fns"
import { Calendar, Check, FileDown, Filter, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { USER_ROLES } from "@/features/users/types"
import type { UserRole, UserFilterState } from "@/features/users/types"
import { USER_STATUSES } from "@/features/users/api/schema"
import type { UserStatus } from "@/features/users/api/schema"
import type { UserFilterVisibility } from "@/features/users/utils"
import { DatePicker } from "@/components/ui/date-picker"
import { useTenants } from "@/features/tenants/hooks/useTenants"
import { RoleBadge } from "./RoleBadge"
import { UserStatusBadge } from "./UserStatusBadge"

export type QuickFilterKey = "role" | "tenant" | "mfa" | "status" | "lastLogin"

const MFA_OPTIONS = [{ value: "enabled" }, { value: "disabled" }] as const

type MfaOptionValue = (typeof MFA_OPTIONS)[number]["value"]

type FilterButtonConfig = {
  key: QuickFilterKey
  icon: "filter" | "calendar"
  visibilityKey?: keyof UserFilterVisibility
}

const FILTER_BUTTONS: FilterButtonConfig[] = [
  { key: "role", icon: "filter" },
  { key: "tenant", icon: "filter", visibilityKey: "tenant" },
  { key: "mfa", icon: "filter", visibilityKey: "mfa" },
  { key: "status", icon: "filter" },
  { key: "lastLogin", icon: "calendar", visibilityKey: "lastLogin" },
]

function getFilterCount(key: QuickFilterKey, filters: UserFilterState): number {
  switch (key) {
    case "role":
      return filters.role.length
    case "status":
      return filters.status.length
    case "tenant":
      return filters.tenant_id ? 1 : 0
    case "mfa":
      return filters.mfa_enabled ? 1 : 0
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
  onExport?: () => void
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
  className,
}: UserQuickFiltersProps) {
  const { t } = useTranslation("users")
  const { data: tenantsData } = useTenants()

  const buttonLabels: Record<QuickFilterKey, string> = {
    role: t("quickFilters.buttons.role"),
    tenant: t("quickFilters.buttons.tenant"),
    mfa: t("quickFilters.buttons.mfa"),
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
            <button
              key={role}
              type="button"
              data-testid={`filter-option-role-${role}`}
              onClick={() =>
                onFilterChange({
                  role: checked
                    ? appliedFilters.role.filter(r => r !== role)
                    : [...appliedFilters.role, role],
                })
              }
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-left"
            >
              <span
                className={cn(
                  "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
                  checked ? "bg-primary border-primary" : "border-border"
                )}
              >
                {checked && <Check size={10} className="text-white" />}
              </span>
              <RoleBadge role={role} />
            </button>
          )
        })

      case "tenant": {
        const tenants = (tenantsData?.tenants ?? []).filter(
          t => t.status === "active"
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
            <button
              key={tenant.id}
              type="button"
              data-testid={`filter-option-tenant-${tenant.id}`}
              onClick={() =>
                onFilterChange({ tenant_id: selected ? null : tenant.id })
              }
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-left"
            >
              <span
                className={cn(
                  "shrink-0 size-4 rounded-full border flex items-center justify-center transition-colors",
                  selected ? "bg-primary border-primary" : "border-border"
                )}
              >
                {selected && <span className="size-2 rounded-full bg-white" />}
              </span>
              <span className="text-sm text-foreground truncate">
                {tenant.name}
              </span>
            </button>
          )
        })
      }

      case "mfa":
        return MFA_OPTIONS.map(opt => {
          const checked = appliedFilters.mfa_enabled === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`filter-option-mfa-${opt.value}`}
              onClick={() =>
                onFilterChange({ mfa_enabled: checked ? null : opt.value })
              }
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-left"
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
                {t(`filter.mfa.${opt.value}` as `filter.mfa.${MfaOptionValue}`)}
              </span>
            </button>
          )
        })

      case "status":
        return USER_STATUSES.map((status: UserStatus) => {
          const checked = appliedFilters.status.includes(status)
          return (
            <button
              key={status}
              type="button"
              data-testid={`filter-option-status-${status}`}
              onClick={() =>
                onFilterChange({
                  status: checked
                    ? appliedFilters.status.filter(s => s !== status)
                    : [...appliedFilters.status, status],
                })
              }
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-left"
            >
              <span
                className={cn(
                  "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
                  checked ? "bg-primary border-primary" : "border-border"
                )}
              >
                {checked && <Check size={10} className="text-white" />}
              </span>
              <UserStatusBadge status={status} />
            </button>
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
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-6">
        <Input
          data-testid="user-search-input"
          placeholder={t("quickFilters.searchPlaceholder")}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="h-8 w-[288px]"
          endAction={
            <Search
              size={16}
              className="text-muted-foreground pointer-events-none"
            />
          }
        />

        <div className="flex items-center gap-2">
          {visibleButtons.map(({ key, icon }) => {
            const count = getFilterCount(key, appliedFilters)
            const isActive = count > 0

            return (
              <Popover key={key}>
                <PopoverTrigger
                  data-testid={`filter-${key}-button`}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-xl hover:bg-muted data-[popup-open]:bg-muted transition-colors whitespace-nowrap"
                >
                  {icon === "calendar" ? (
                    <Calendar
                      size={16}
                      className="shrink-0 text-muted-foreground"
                    />
                  ) : (
                    <Filter
                      size={16}
                      className="shrink-0 text-muted-foreground"
                    />
                  )}
                  {buttonLabels[key]}
                  {isActive && (
                    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#0284c7] text-white text-xs font-medium leading-none">
                      {count}
                    </span>
                  )}
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  className={cn(
                    "p-0 py-1",
                    key === "lastLogin" ? "w-72 py-0" : "w-48",
                    key === "tenant" && "max-h-60 overflow-y-auto"
                  )}
                >
                  {renderPopoverContent(key)}
                </PopoverContent>
              </Popover>
            )
          })}

          <button
            type="button"
            data-testid="advanced-filters-button"
            onClick={onOpenAdvanced}
            className="inline-flex items-center h-8 px-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-xl hover:bg-muted transition-colors whitespace-nowrap"
          >
            {t("quickFilters.advancedFilters")}
          </button>
        </div>
      </div>

      <button
        type="button"
        data-testid="export-button"
        onClick={onExport}
        className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-xl hover:bg-muted transition-colors"
      >
        <FileDown size={16} className="shrink-0 text-muted-foreground" />
        {t("quickFilters.export")}
      </button>
    </div>
  )
}
