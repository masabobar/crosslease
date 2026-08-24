import { useState } from "react"
import { Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { TenantInfoCard } from "@/features/tenants/components/TenantInfoCard"
import { ActivateModuleDialog } from "@/features/tenants/components/ActivateModuleDialog"
import { DeactivateModuleDialog } from "@/features/tenants/components/DeactivateModuleDialog"
import { IntegrationBindingSection } from "@/features/tenants/components/IntegrationBindingSection"
import { ModuleStatusBadge } from "@/features/tenants/components/ModuleStatusBadge"
import { useTenantModules } from "@/features/tenants/hooks/useTenantModules"
import { formatDate } from "@/lib/formatters"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import type {
  TenantModuleEntry,
  TenantStatus,
} from "@/features/tenants/api/schema"
import {
  TenantModuleStatusSchema,
  TenantStatusSchema,
} from "@/features/tenants/api/schema"

const MODULE_COLUMN_COUNT = 3

type ModulesConfigTabProps = {
  tenantId: string
  tenantName: string
  isAdmin: boolean
  // US 29.4 restricts the full integration binding to System Admin; Support User sees it
  // with the endpoint URL and credential scope redacted by the API. A Bank Admin is
  // granted the Integration Active Flag only, which the API does not yet expose
  // separately — so the whole section stays hidden for them rather than leaking the
  // unredacted binding. See Q-049 in input/open-questions.md.
  canViewIntegrationBinding: boolean
  tenantStatus: TenantStatus
}

function ModuleEntry({
  module,
  isFirst,
  isLast,
  canEdit,
  onActivate,
  onDeactivate,
}: {
  module: TenantModuleEntry
  isFirst: boolean
  isLast: boolean
  /** Admin *and* the tenant is in a state that allows module changes. */
  canEdit: boolean
  onActivate: (module: TenantModuleEntry) => void
  onDeactivate: (module: TenantModuleEntry) => void
}) {
  const { t } = useTranslation("tenants")

  const { enum: MS } = TenantModuleStatusSchema
  const showActivate =
    !module.always_on &&
    (module.status === MS.inactive || module.status === MS.pending_deactivation)
  const showDeactivate =
    !module.always_on &&
    (module.status === MS.active ||
      module.status === MS.pending_activation ||
      module.status === MS.pending_enforcement)
  const hasButton = canEdit && (showActivate || showDeactivate)

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
        {canEdit && showActivate && (
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
        {canEdit && showDeactivate && (
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
  canEdit,
  onActivate,
  onDeactivate,
}: {
  modules: TenantModuleEntry[]
  canEdit: boolean
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
          canEdit={canEdit}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      ))}
    </div>
  )
}

export function ModulesConfigTab({
  tenantId,
  tenantName,
  isAdmin,
  canViewIntegrationBinding,
  tenantStatus,
}: ModulesConfigTabProps) {
  const { t } = useTranslation("tenants")
  const {
    data: modulesData,
    isLoading,
    isError,
    error,
  } = useTenantModules(tenantId)
  const [activatingModule, setActivatingModule] =
    useState<TenantModuleEntry | null>(null)
  const [deactivatingModule, setDeactivatingModule] =
    useState<TenantModuleEntry | null>(null)
  const [isBindingDialogOpen, setIsBindingDialogOpen] = useState(false)

  const canEdit = isAdmin && tenantStatus === TenantStatusSchema.enum.active
  const modules = modulesData?.modules ?? []
  const colSize = Math.max(1, Math.ceil(modules.length / MODULE_COLUMN_COUNT))
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
            {resolveApiErrorMessage(error, t)}
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
              canEdit={canEdit}
              onActivate={setActivatingModule}
              onDeactivate={setDeactivatingModule}
            />
            {col2.length > 0 && (
              <>
                <div className="w-px bg-border shrink-0 mx-3" />
                <ModuleColumn
                  modules={col2}
                  canEdit={canEdit}
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
                  canEdit={canEdit}
                  onActivate={setActivatingModule}
                  onDeactivate={setDeactivatingModule}
                />
              </>
            )}
          </div>
        )}
      </TenantInfoCard>

      {/* INTEGRATION BINDING */}
      {canViewIntegrationBinding && (
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0 max-w-xl">
            <IntegrationBindingSection
              tenantId={tenantId}
              tenantName={tenantName}
              isAdmin={isAdmin}
              canEdit={canEdit}
              dialogOpen={isBindingDialogOpen}
              onDialogOpenChange={setIsBindingDialogOpen}
            />
          </div>
        </div>
      )}
    </div>
  )
}
