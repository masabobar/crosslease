import { useState } from "react"
import { Lock, SquarePen, ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { TenantInfoCard } from "@/features/tenants/components/TenantInfoCard"
import { ActivateModuleDialog } from "@/features/tenants/components/ActivateModuleDialog"
import { DeactivateModuleDialog } from "@/features/tenants/components/DeactivateModuleDialog"
import { IntegrationBindingSection } from "@/features/tenants/components/IntegrationBindingSection"
import { useTenantModules } from "@/features/tenants/hooks/useTenantModules"
import type { TenantModuleEntry } from "@/features/tenants/api/schema"

type ModulesConfigTabProps = {
  tenantId: string
  tenantName: string
  isAdmin: boolean
  isArchived?: boolean
}

type ModuleStatusKey =
  | "active"
  | "inactive"
  | "pending_activation"
  | "pending_enforcement"
  | "pending_deactivation"

type StatusConfig = { container: string; dot: string; text: string }

const MODULE_STATUS_CONFIG: Record<ModuleStatusKey, StatusConfig> = {
  active: {
    container: "bg-[#d0fae5]",
    dot: "bg-[#22c55e]",
    text: "text-[#166534]",
  },
  inactive: {
    container: "bg-[#f1f5f9]",
    dot: "bg-[#94a3b8]",
    text: "text-[#374151]",
  },
  pending_activation: {
    container: "bg-[#dbeafe]",
    dot: "bg-[#3b82f6]",
    text: "text-[#1d4ed8]",
  },
  pending_enforcement: {
    container: "bg-[#ffedd4]",
    dot: "bg-[#f97316]",
    text: "text-[#9a3412]",
  },
  pending_deactivation: {
    container: "bg-[#ffedd4]",
    dot: "bg-[#f97316]",
    text: "text-[#9a3412]",
  },
}

function isKnownModuleStatus(status: string): status is ModuleStatusKey {
  return status in MODULE_STATUS_CONFIG
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function ModuleStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("tenants")
  const config: StatusConfig = isKnownModuleStatus(status)
    ? MODULE_STATUS_CONFIG[status]
    : MODULE_STATUS_CONFIG.inactive

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${config.container} ${config.text}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${config.dot}`} />
      {t(`detail.modules.status.${status}` as "detail.modules.status.active", {
        defaultValue: status,
      })}
    </span>
  )
}

function ModuleEntry({
  module,
  isFirst,
  isLast,
  isAdmin,
  onActivate,
  onDeactivate,
}: {
  module: TenantModuleEntry
  isFirst: boolean
  isLast: boolean
  isAdmin: boolean
  onActivate: (module: TenantModuleEntry) => void
  onDeactivate: (module: TenantModuleEntry) => void
}) {
  const { t } = useTranslation("tenants")

  const showActivate =
    !module.always_on &&
    (module.status === "inactive" || module.status === "pending_deactivation")
  const showDeactivate =
    !module.always_on &&
    (module.status === "active" ||
      module.status === "pending_activation" ||
      module.status === "pending_enforcement")
  const hasButton = isAdmin && (showActivate || showDeactivate)

  const description = t(
    `wizard.modules.descriptions.${module.key}` as "wizard.modules.descriptions.identity_access",
    { defaultValue: "" }
  )

  return (
    <div
      className={`flex items-start ${
        isLast
          ? "pt-1 pb-3"
          : isFirst
            ? "pt-3 pb-5 border-b border-border"
            : "pt-1 pb-5 border-b border-border"
      }`}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground leading-5">
            {module.display_name}
          </span>
          {module.always_on && (
            <Lock size={13} className="text-muted-foreground shrink-0" />
          )}
        </div>
        {description ? (
          <span className="text-xs text-muted-foreground leading-4">
            {description}
          </span>
        ) : null}
        {module.activated_at ? (
          <span className="text-xs text-muted-foreground leading-4">
            {t("detail.modules.activatedFrom", {
              date: formatDate(module.activated_at),
            })}
          </span>
        ) : null}
      </div>
      <div
        className={`flex flex-col items-end shrink-0 ml-2 min-h-[60px] ${
          hasButton ? "justify-between" : ""
        }`}
      >
        <ModuleStatusBadge status={module.status} />
        {isAdmin && showActivate && (
          <Button
            variant="outline"
            size="sm"
            className="h-auto px-2.5 py-1 text-sm rounded-[10px]"
            onClick={() => onActivate(module)}
            data-testid={`activate-module-${module.key}`}
          >
            {t("detail.modules.activate")}
          </Button>
        )}
        {isAdmin && showDeactivate && (
          <Button
            variant="outline"
            size="sm"
            className="h-auto px-2.5 py-1 text-sm rounded-[10px]"
            onClick={() => onDeactivate(module)}
            data-testid={`deactivate-module-${module.key}`}
          >
            {t("detail.modules.deactivate")}
          </Button>
        )}
      </div>
    </div>
  )
}

function ModuleColumn({
  modules,
  isAdmin,
  onActivate,
  onDeactivate,
}: {
  modules: TenantModuleEntry[]
  isAdmin: boolean
  onActivate: (module: TenantModuleEntry) => void
  onDeactivate: (module: TenantModuleEntry) => void
}) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3">
      {modules.map((module, i) => (
        <ModuleEntry
          key={module.key}
          module={module}
          isFirst={i === 0}
          isLast={i === modules.length - 1}
          isAdmin={isAdmin}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      ))}
    </div>
  )
}

type OverrideBadgeVariant = "override" | "default"

function OverrideBadge({ variant }: { variant: OverrideBadgeVariant }) {
  const { t } = useTranslation("tenants")
  if (variant === "override") {
    return (
      <span className="inline-flex items-center h-[18px] px-1.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(57,129,246,0.1)] text-primary">
        {t("detail.modules.configOverride.override")}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center h-[18px] px-1.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(244,244,245,0.6)] text-foreground">
      {t("detail.modules.configOverride.default")}
    </span>
  )
}

type ConfigItemKey =
  | "productTemplate"
  | "rateTable"
  | "workflowDefinition"
  | "documentPolicySet"

type ConfigItem = {
  key: ConfigItemKey
  variant: OverrideBadgeVariant
  value: string
  warning?: string
  lastModifiedBy?: string
  action: "edit" | "addOverride"
}

function ConfigOverrideRow({
  item,
  isLast,
  isAdmin,
}: {
  item: ConfigItem
  isLast: boolean
  isAdmin: boolean
}) {
  const { t } = useTranslation("tenants")
  return (
    <div
      className={`flex items-start pt-1 ${
        isLast ? "pb-3" : "pb-5 border-b border-border"
      }`}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground leading-5">
            {t(
              `detail.modules.configOverride.${item.key}` as "detail.modules.configOverride.productTemplate"
            )}
          </span>
          <OverrideBadge variant={item.variant} />
        </div>
        <span className="text-xs text-muted-foreground leading-4">
          {item.value}
        </span>
        {item.warning && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-[rgba(227,146,25,0.1)]">
            <ShieldAlert size={16} className="text-amber-600 shrink-0" />
            <span className="flex-1 text-xs text-amber-600 leading-4">
              {item.warning}
            </span>
          </div>
        )}
        {item.lastModifiedBy && (
          <span className="text-xs text-muted-foreground leading-4">
            {item.lastModifiedBy}
          </span>
        )}
      </div>
      {isAdmin && (
        <div className="flex flex-col items-end justify-center self-stretch shrink-0 ml-2">
          <Button
            variant="outline"
            className="h-auto gap-1 rounded-[10px] px-[10px] py-[4px] text-sm"
          >
            {item.action === "edit" && <SquarePen size={14} />}
            {item.action === "edit"
              ? t("detail.modules.edit")
              : t("detail.modules.configOverride.addOverride")}
          </Button>
        </div>
      )}
    </div>
  )
}

function ConfigOverrideCard({ isAdmin }: { isAdmin: boolean }) {
  const { t } = useTranslation("tenants")

  const items: ConfigItem[] = [
    {
      key: "productTemplate",
      variant: "override",
      value: "—",
      action: "edit",
    },
    {
      key: "rateTable",
      variant: "override",
      value: "—",
      action: "edit",
    },
    {
      key: "workflowDefinition",
      variant: "default",
      value: "—",
      action: "addOverride",
    },
    {
      key: "documentPolicySet",
      variant: "default",
      value: "—",
      action: "addOverride",
    },
  ]

  return (
    <TenantInfoCard title={t("detail.modules.sections.configurationOverride")}>
      {items.map((item, i) => (
        <ConfigOverrideRow
          key={item.key}
          item={item}
          isLast={i === items.length - 1}
          isAdmin={isAdmin}
        />
      ))}
    </TenantInfoCard>
  )
}

export function ModulesConfigTab({
  tenantId,
  tenantName,
  isAdmin,
  isArchived = false,
}: ModulesConfigTabProps) {
  const { t } = useTranslation("tenants")
  const { data: modulesData, isLoading, isError } = useTenantModules(tenantId)
  const [activatingModule, setActivatingModule] =
    useState<TenantModuleEntry | null>(null)
  const [deactivatingModule, setDeactivatingModule] =
    useState<TenantModuleEntry | null>(null)
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false)

  const canEdit = isAdmin && !isArchived
  const modules = modulesData?.modules ?? []
  const colSize = Math.max(1, Math.ceil(modules.length / 3))
  const col1 = modules.slice(0, colSize)
  const col2 = modules.slice(colSize, colSize * 2)
  const col3 = modules.slice(colSize * 2)

  return (
    <div className="flex flex-col gap-6" data-testid="tab-content-modules">
      {activatingModule && (
        <ActivateModuleDialog
          open={activatingModule !== null}
          onOpenChange={open => {
            if (!open) setActivatingModule(null)
          }}
          tenantId={tenantId}
          module={activatingModule}
        />
      )}
      {deactivatingModule && (
        <DeactivateModuleDialog
          open={deactivatingModule !== null}
          onOpenChange={open => {
            if (!open) setDeactivatingModule(null)
          }}
          tenantId={tenantId}
          module={deactivatingModule}
        />
      )}

      {/* MODULE PROFILE */}
      <TenantInfoCard title={t("detail.modules.sections.moduleProfile")}>
        {isLoading && <div className="h-32 animate-pulse bg-muted rounded" />}
        {isError && !isLoading && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("errors.generic")}
          </p>
        )}
        {!isLoading && !isError && modules.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t("wizard.modules.noModules")}
          </p>
        )}
        {!isLoading && !isError && modules.length > 0 && (
          <div className="flex items-start">
            <ModuleColumn
              modules={col1}
              isAdmin={canEdit}
              onActivate={setActivatingModule}
              onDeactivate={setDeactivatingModule}
            />
            {col2.length > 0 && (
              <>
                <div className="w-px bg-border shrink-0 mx-3" />
                <ModuleColumn
                  modules={col2}
                  isAdmin={canEdit}
                  onActivate={setActivatingModule}
                  onDeactivate={setDeactivatingModule}
                />
              </>
            )}
            {col3.length > 0 && (
              <>
                <div className="w-px bg-border shrink-0 mx-3" />
                <ModuleColumn
                  modules={col3}
                  isAdmin={canEdit}
                  onActivate={setActivatingModule}
                  onDeactivate={setDeactivatingModule}
                />
              </>
            )}
          </div>
        )}
      </TenantInfoCard>

      {/* CONFIGURATION OVERRIDE + INTEGRATION BINDING */}
      <div className="flex gap-6 items-start">
        {isAdmin && (
          <div className="flex-1 min-w-0">
            <ConfigOverrideCard isAdmin={canEdit} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <IntegrationBindingSection
            tenantId={tenantId}
            tenantName={tenantName}
            isAdmin={isAdmin}
            isArchived={isArchived}
            dialogOpen={bindingDialogOpen}
            onDialogOpenChange={setBindingDialogOpen}
          />
        </div>
      </div>
    </div>
  )
}
