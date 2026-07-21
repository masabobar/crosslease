import { useState, type ReactNode } from "react"
import { parseISO } from "date-fns"
import { ChevronDown, Check, Calendar } from "lucide-react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { useTranslation } from "react-i18next"
import { useTenants } from "@/features/tenants/hooks/useTenants"
import { TenantStatusSchema } from "@/features/tenants/api/schema"
import { cn } from "@/lib/utils"
import { USER_ROLES } from "@/features/users/types"
import type { UserRole, UserFilterState } from "@/features/users/types"
import { USER_STATUSES } from "@/features/users/api/schema"
import type { UserStatus } from "@/features/users/api/schema"
import { getUserFilterVisibility } from "@/features/users/utils"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

// i18n key casts for dynamic lookups
type RolesKey = `roles.${UserRole}`
type StatusesKey = `statuses.${UserStatus}`
import { RoleBadge } from "./RoleBadge"
import { UserStatusBadge } from "./UserStatusBadge"
import { FilterCheckboxRow } from "./FilterCheckboxRow"

type UserFilterPanelProps = {
  onClose: () => void
  appliedFilters: UserFilterState
  onApply: (filters: UserFilterState) => void
  viewerRole?: UserRole | null
}

// ─── Section header with gray background ────────────────────────────────────

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted border-y border-border/50 px-4 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
        {children}
      </p>
    </div>
  )
}

// ─── Field wrapper (label + content) ────────────────────────────────────────

function FilterField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="px-4 py-3">
      <p className="text-sm text-foreground mb-1.5">{label}</p>
      {children}
    </div>
  )
}

// ─── Multi-select dropdown ───────────────────────────────────────────────────

type MultiSelectProps<T extends string> = {
  value: T[]
  onChange: (value: T[]) => void
  options: T[]
  placeholder: string
  renderOption: (option: T) => ReactNode
  getLabel: (option: T) => string
  getMultiLabel: (count: number) => string
  "data-testid"?: string
}

function MultiSelectDropdown<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  renderOption,
  getLabel,
  getMultiLabel,
  "data-testid": testId,
}: MultiSelectProps<T>) {
  function toggle(option: T) {
    onChange(
      value.includes(option)
        ? value.filter(v => v !== option)
        : [...value, option]
    )
  }

  const triggerLabel =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? getLabel(value[0])
        : getMultiLabel(value.length)

  return (
    <Popover>
      <PopoverTrigger
        data-testid={testId}
        className={cn(
          "w-full h-9 px-3 flex items-center justify-between",
          "border border-border rounded-lg bg-background",
          "text-sm text-left outline-none",
          "hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          "transition-colors"
        )}
      >
        <span
          className={
            value.length === 0 ? "text-muted-foreground" : "text-foreground"
          }
        >
          {triggerLabel}
        </span>
        <ChevronDown
          size={14}
          className="text-muted-foreground shrink-0 ml-2"
        />
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        className="w-[var(--anchor-width)] p-0 py-1 max-h-60 overflow-y-auto"
      >
        {options.map(option => {
          const checked = value.includes(option)
          return (
            <FilterCheckboxRow
              key={option}
              checked={checked}
              data-testid={`filter-option-${option}`}
              onClick={() => toggle(option)}
            >
              {renderOption(option)}
            </FilterCheckboxRow>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

// ─── Text toggle (MFA status, flags) ────────────────────────────────────────

function TextToggle({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: string; label: string }[]
  value: string | null
  onChange: (v: string | null) => void
  disabled?: boolean
}) {
  return (
    <div
      className={cn("flex gap-2", disabled && "opacity-40 pointer-events-none")}
    >
      {options.map(opt => (
        <Button
          key={opt.value}
          type="button"
          variant="ghost"
          data-testid={`filter-toggle-${opt.value}`}
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={cn(
            "h-auto px-3 py-1 text-sm rounded-full border font-normal",
            value === opt.value
              ? "border-primary text-primary bg-primary/5 hover:bg-primary/5 hover:text-primary"
              : "border-border text-foreground hover:border-primary/40 hover:bg-transparent"
          )}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}

// ─── Single-select dropdown ──────────────────────────────────────────────────

function SingleSelectDropdown({
  value,
  onChange,
  options,
  placeholder,
  "data-testid": testId,
}: {
  value: string | null
  onChange: (value: string | null) => void
  options: { value: string; label: string }[]
  placeholder: string
  "data-testid"?: string
}) {
  const selected = options.find(o => o.value === value)

  function toggle(optValue: string) {
    onChange(value === optValue ? null : optValue)
  }

  return (
    <Popover>
      <PopoverTrigger
        data-testid={testId}
        className={cn(
          "w-full h-9 px-3 flex items-center justify-between",
          "border border-border rounded-lg bg-background",
          "text-sm text-left outline-none",
          "hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          "transition-colors"
        )}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          className="text-muted-foreground shrink-0 ml-2"
        />
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        className="w-[var(--anchor-width)] p-0 py-1 max-h-60 overflow-y-auto"
      >
        {options.map(option => (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            data-testid={`filter-panel-option-${option.value}`}
            onClick={() => toggle(option.value)}
            className={cn(
              "w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none text-sm",
              value === option.value
                ? "text-primary font-medium"
                : "text-foreground font-normal"
            )}
          >
            {value === option.value && (
              <Check size={12} className="text-primary shrink-0" />
            )}
            {value !== option.value && <span className="size-3 shrink-0" />}
            {option.label}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

// ─── Disabled select placeholder ────────────────────────────────────────────

function DisabledSelect({ placeholder }: { placeholder: string }) {
  return (
    <div className="w-full h-9 px-3 flex items-center justify-between border border-border rounded-lg bg-background opacity-40 pointer-events-none">
      <span className="text-sm text-muted-foreground">{placeholder}</span>
      <ChevronDown size={14} className="text-muted-foreground shrink-0" />
    </div>
  )
}

// ─── Disabled date field placeholder ────────────────────────────────────────

function DisabledDateField({ placeholder }: { placeholder: string }) {
  return (
    <div className="w-full h-9 px-3 flex items-center gap-2 border border-border rounded-lg bg-background opacity-40 pointer-events-none">
      <Calendar size={14} className="text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground flex-1">
        {placeholder}
      </span>
      <ChevronDown size={14} className="text-muted-foreground shrink-0" />
    </div>
  )
}

// ─── Main panel ─────────────────────────────────────────────────────────────

function UserFilterPanel({
  onClose,
  appliedFilters,
  onApply,
  viewerRole,
}: UserFilterPanelProps) {
  const { t } = useTranslation("users")
  const filterVis = getUserFilterVisibility(viewerRole)
  const { data: tenantsData } = useTenants(filterVis.tenant)

  const tenantOptions = (tenantsData?.tenants ?? [])
    .filter(ten => ten.status === TenantStatusSchema.enum.active)
    .map(ten => ({ value: ten.id, label: ten.name }))

  const [staged, setStaged] = useState<UserFilterState>(appliedFilters)

  function handleApply() {
    onApply(staged)
    onClose()
  }

  return (
    <Sheet
      open
      onOpenChange={o => {
        if (!o) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-[420px] gap-0 p-0"
        showCloseButton={false}
        data-testid="user-filter-panel"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-4 border-b border-border shrink-0">
            <SheetTitle className="text-sm font-semibold text-foreground">
              {t("filter.title")}
            </SheetTitle>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            {/* ── IDENTITY & ACCESS ── */}
            <SectionHeader>{t("filter.sections.identityAccess")}</SectionHeader>

            <FilterField label={t("filter.fields.role")}>
              <MultiSelectDropdown
                value={staged.role}
                onChange={roles => setStaged(s => ({ ...s, role: roles }))}
                options={[...USER_ROLES]}
                placeholder={t("filter.placeholders.select")}
                renderOption={role => <RoleBadge role={role} />}
                getLabel={role => t(`roles.${role}` as RolesKey)}
                getMultiLabel={count => t("filter.selectedCount", { count })}
                data-testid="filter-role-select"
              />
            </FilterField>

            <FilterField label={t("filter.fields.status")}>
              <MultiSelectDropdown
                value={staged.status}
                onChange={statuses =>
                  setStaged(s => ({ ...s, status: statuses }))
                }
                options={[...USER_STATUSES]}
                placeholder={t("filter.placeholders.select")}
                renderOption={status => <UserStatusBadge status={status} />}
                getLabel={status => t(`statuses.${status}` as StatusesKey)}
                getMultiLabel={count => t("filter.selectedCount", { count })}
                data-testid="filter-status-select"
              />
            </FilterField>

            {/* MFA filter: UI ready — backend does not support mfa_enabled filter yet */}
            {filterVis.mfa && (
              <FilterField label={t("filter.fields.mfaStatus")}>
                <TextToggle
                  options={[
                    { value: "enabled", label: t("filter.mfa.enabled") },
                    { value: "disabled", label: t("filter.mfa.disabled") },
                  ]}
                  value={staged.mfa_enabled}
                  onChange={v => setStaged(s => ({ ...s, mfa_enabled: v }))}
                  disabled
                />
              </FilterField>
            )}

            {filterVis.tenant && (
              <FilterField label={t("filter.fields.tenant")}>
                <SingleSelectDropdown
                  value={staged.tenant_id}
                  onChange={id => setStaged(s => ({ ...s, tenant_id: id }))}
                  options={tenantOptions}
                  placeholder={t("filter.placeholders.tenant")}
                  data-testid="filter-tenant-select"
                />
              </FilterField>
            )}

            {/* LG filter: UI ready — backend does not support lg_id filter yet */}
            {filterVis.lg && (
              <FilterField label={t("filter.fields.leasingCompany")}>
                <DisabledSelect
                  placeholder={t("filter.placeholders.leasingCompany")}
                />
              </FilterField>
            )}

            {/* ── ACTIVITY ── */}
            <SectionHeader>{t("filter.sections.activity")}</SectionHeader>

            {filterVis.lastLogin && (
              <FilterField label={t("filter.fields.lastLoginRange")}>
                <div className="flex gap-2">
                  <DatePicker
                    value={staged.last_login_from ?? undefined}
                    onChange={v =>
                      setStaged(s => {
                        const newFrom = parseISO(v)
                        const currentTo = s.last_login_to
                          ? parseISO(s.last_login_to)
                          : null
                        return {
                          ...s,
                          last_login_from: v,
                          last_login_to:
                            currentTo && currentTo < newFrom
                              ? null
                              : s.last_login_to,
                        }
                      })
                    }
                    placeholder={t("filter.placeholders.from")}
                    maxDate={new Date()}
                    captionLayout="dropdown"
                  />
                  <DatePicker
                    value={staged.last_login_to ?? undefined}
                    onChange={v => setStaged(s => ({ ...s, last_login_to: v }))}
                    placeholder={t("filter.placeholders.to")}
                    maxDate={new Date()}
                    minDate={
                      staged.last_login_from
                        ? parseISO(staged.last_login_from)
                        : undefined
                    }
                    captionLayout="dropdown"
                  />
                </div>
              </FilterField>
            )}
            {/* access_expiry_from/to, created_from/to — backend does not support yet */}

            <FilterField label={t("filter.fields.userCreationDate")}>
              <DisabledDateField
                placeholder={t("filter.placeholders.chooseDate")}
              />
            </FilterField>

            {filterVis.accessExpiry && (
              <FilterField label={t("filter.fields.accessExpiry")}>
                <DisabledDateField
                  placeholder={t("filter.placeholders.chooseDate")}
                />
              </FilterField>
            )}

            {/* ── GOVERNANCE & ACCOUNT ── */}
            <SectionHeader>
              {t("filter.sections.governanceAccount")}
            </SectionHeader>

            {/* Audit Engagement Status: system_admin + auditor only */}
            {filterVis.auditEngagementStatus && (
              <FilterField label={t("filter.fields.auditEngagementStatus")}>
                <DisabledSelect placeholder={t("filter.placeholders.select")} />
              </FilterField>
            )}

            {/* Last Role Change Date: system_admin + auditor only */}
            {filterVis.lastRoleChangeDate && (
              <FilterField label={t("filter.fields.lastRoleChangeDate")}>
                <DisabledDateField
                  placeholder={t("filter.placeholders.chooseDate")}
                />
              </FilterField>
            )}

            {/* Last Permission Change Date: system_admin + auditor only */}
            {filterVis.lastPermissionChangeDate && (
              <FilterField label={t("filter.fields.lastPermissionChangeDate")}>
                <DisabledDateField
                  placeholder={t("filter.placeholders.chooseDate")}
                />
              </FilterField>
            )}

            {/* Origin Type: system_admin + auditor + support_user */}
            {filterVis.originType && (
              <FilterField label={t("filter.fields.originType")}>
                <DisabledSelect placeholder={t("filter.placeholders.select")} />
              </FilterField>
            )}

            {/* System User Flag: system_admin + auditor only */}
            {filterVis.systemUserFlag && (
              <FilterField label={t("filter.fields.systemUserFlag")}>
                <TextToggle
                  options={[
                    { value: "human", label: t("filter.flags.humanUser") },
                    { value: "system", label: t("filter.flags.systemUser") },
                  ]}
                  value={null}
                  onChange={() => {}}
                  disabled
                />
              </FilterField>
            )}

            {/* Service Account Flag: system_admin + auditor only */}
            {filterVis.serviceAccountFlag && (
              <FilterField label={t("filter.fields.serviceAccountFlag")}>
                <TextToggle
                  options={[
                    { value: "enabled", label: t("filter.flags.enabled") },
                    { value: "disabled", label: t("filter.flags.disabled") },
                  ]}
                  value={null}
                  onChange={() => {}}
                  disabled
                />
              </FilterField>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-3 flex gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              data-testid="filter-cancel-button"
              onClick={onClose}
              className="flex-1"
            >
              {t("filter.actions.cancel")}
            </Button>
            <Button
              type="button"
              data-testid="filter-apply-button"
              onClick={handleApply}
              className="flex-1"
            >
              {t("filter.actions.apply")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { UserFilterPanel }
