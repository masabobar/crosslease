import { useState } from "react"
import { Building2, MoreHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { TableEmptyState } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { SuspendTenantDialog } from "@/features/tenants/components/SuspendTenantDialog"
import { ReactivateTenantDialog } from "@/features/tenants/components/ReactivateTenantDialog"
import { ArchiveTenantDialog } from "@/features/tenants/components/ArchiveTenantDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type {
  TenantListItem,
  TenantStatus,
} from "@/features/tenants/api/schema"
import { TenantStatusSchema } from "@/features/tenants/api/schema"

const COL_TENANT = "flex-1 min-w-[180px]"
const COL_CODE = "flex-1 min-w-[140px]"
const COL_TYPE = "flex-1 min-w-[120px]"
const COL_MODULES = "flex-1 min-w-[120px]"
const COL_STATUS = "flex-1 min-w-[120px]"
const COL_CREATED = "flex-1 min-w-[120px]"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

const MUTED_STATUSES: TenantStatus[] = [
  "suspended",
  "archived",
  "rejected",
  "expired",
]

function isMuted(status: TenantStatus): boolean {
  return MUTED_STATUSES.includes(status)
}

type TenantTableProps = {
  tenants: TenantListItem[]
  isLoading: boolean
  hasActiveFilters: boolean
  isAdmin: boolean
  onCreateTenant?: () => void
  onRowClick?: (tenant: TenantListItem) => void
}

function TenantTable({
  tenants,
  isLoading,
  hasActiveFilters,
  isAdmin,
  onCreateTenant,
  onRowClick,
}: TenantTableProps) {
  const { t } = useTranslation("tenants")
  const [selectedTenant, setSelectedTenant] = useState<TenantListItem | null>(
    null
  )
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  function openSuspend(tenant: TenantListItem) {
    setSelectedTenant(tenant)
    setSuspendOpen(true)
  }

  function openReactivate(tenant: TenantListItem) {
    setSelectedTenant(tenant)
    setReactivateOpen(true)
  }

  function openArchive(tenant: TenantListItem) {
    setSelectedTenant(tenant)
    setArchiveOpen(true)
  }

  return (
    <>
      <div
        className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
        data-testid="tenant-table"
      >
        {/* Header */}
        <div className="flex border-b border-border h-10 items-center">
          <div
            className={`${COL_TENANT} text-sm font-medium text-foreground px-2`}
          >
            {t("list.table.columns.tenant")}
          </div>
          <div
            className={`${COL_CODE} text-sm font-medium text-foreground px-2`}
          >
            {t("list.table.columns.code")}
          </div>
          <div
            className={`${COL_TYPE} text-sm font-medium text-foreground px-2`}
          >
            {t("list.table.columns.type")}
          </div>
          <div
            className={`${COL_MODULES} text-sm font-medium text-foreground px-2`}
          >
            {t("list.table.columns.activeModule")}
          </div>
          <div
            className={`${COL_STATUS} text-sm font-medium text-foreground px-2`}
          >
            {t("list.table.columns.status")}
          </div>
          <div
            className={`${COL_CREATED} text-sm font-medium text-foreground px-2`}
          >
            {t("list.table.columns.createdAt")}
          </div>
          <div className="shrink-0 w-11" />
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div data-testid="tenant-table-loading">
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <div
                key={i}
                className={`flex border-b border-border ${ROW_H} items-center`}
              >
                <div className={`${COL_TENANT} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-40" />
                </div>
                <div className={`${COL_CODE} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-28 font-mono" />
                </div>
                <div className={`${COL_TYPE} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-24" />
                </div>
                <div className={`${COL_MODULES} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-16" />
                </div>
                <div className={`${COL_STATUS} p-2`}>
                  <div className="bg-muted rounded-full h-5 animate-pulse w-16" />
                </div>
                <div className={`${COL_CREATED} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-20" />
                </div>
                <div className="shrink-0 w-11" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading &&
          tenants.length === 0 &&
          (hasActiveFilters ? (
            <TableEmptyState
              title={t("list.emptyFiltered.title")}
              description={t("list.emptyFiltered.description")}
            />
          ) : (
            <TableEmptyState
              title={t("list.emptyState.title")}
              description={t("list.emptyState.description")}
              action={
                onCreateTenant && (
                  <Button
                    onClick={onCreateTenant}
                    className="h-9 rounded-xl px-4 gap-1.5"
                  >
                    <Building2 size={16} />
                    {t("list.createButton")}
                  </Button>
                )
              }
            />
          ))}

        {/* Data rows */}
        {!isLoading &&
          tenants.map(tenant => {
            const muted = isMuted(tenant.status)
            const textClass = muted
              ? "text-muted-foreground"
              : "text-foreground"

            return (
              <div
                key={tenant.id}
                data-testid={`tenant-row-${tenant.id}`}
                onClick={() => onRowClick?.(tenant)}
                className={`flex border-b border-border ${ROW_H} items-center hover:bg-muted/40 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              >
                <div className={`${COL_TENANT} p-2`}>
                  <p className={`text-sm font-medium truncate ${textClass}`}>
                    {tenant.name}
                  </p>
                </div>

                <div className={`${COL_CODE} p-2 overflow-hidden`}>
                  <span
                    className={`text-sm font-mono block truncate ${muted ? "text-muted-foreground" : "text-foreground"}`}
                  >
                    {tenant.code}
                  </span>
                </div>

                <div className={`${COL_TYPE} p-2`}>
                  <span className={`text-sm ${textClass}`}>
                    {t(`tenantTypes.${tenant.tenant_type}`)}
                  </span>
                </div>

                <div className={`${COL_MODULES} p-2`}>
                  <span className={`text-sm font-semibold ${textClass}`}>
                    {t("list.table.modules", {
                      count: tenant.active_module_count,
                    })}
                  </span>
                </div>

                <div className={`${COL_STATUS} p-2`}>
                  <TenantStatusBadge status={tenant.status} />
                </div>

                {/* Created at — not returned by list API, shown as placeholder */}
                <div className={`${COL_CREATED} p-2`}>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>

                <div
                  className="shrink-0 p-2 flex items-center justify-center"
                  onClick={e => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      data-testid={`tenant-row-menu-${tenant.id}`}
                      aria-label="Tenant actions"
                      className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {isAdmin &&
                        tenant.status === TenantStatusSchema.enum.active && (
                          <DropdownMenuItem
                            data-testid={`tenant-row-menu-suspend-${tenant.id}`}
                            onClick={() => openSuspend(tenant)}
                          >
                            {t("list.actions.suspend")}
                          </DropdownMenuItem>
                        )}
                      {isAdmin &&
                        tenant.status === TenantStatusSchema.enum.suspended && (
                          <>
                            <DropdownMenuItem
                              data-testid={`tenant-row-menu-reactivate-${tenant.id}`}
                              onClick={() => openReactivate(tenant)}
                            >
                              {t("list.actions.reactivate")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              data-testid={`tenant-row-menu-archive-${tenant.id}`}
                              className="text-destructive focus:text-destructive"
                              onClick={() => openArchive(tenant)}
                            >
                              {t("list.actions.archive")}
                            </DropdownMenuItem>
                          </>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
      </div>

      {selectedTenant && (
        <>
          <SuspendTenantDialog
            open={suspendOpen}
            onOpenChange={setSuspendOpen}
            tenantId={selectedTenant.id}
            tenantName={selectedTenant.name}
            tenantStatus={selectedTenant.status}
          />
          <ReactivateTenantDialog
            open={reactivateOpen}
            onOpenChange={setReactivateOpen}
            tenantId={selectedTenant.id}
            tenantName={selectedTenant.name}
            tenantStatus={selectedTenant.status}
          />
          <ArchiveTenantDialog
            open={archiveOpen}
            onOpenChange={setArchiveOpen}
            tenantId={selectedTenant.id}
            tenantName={selectedTenant.name}
            tenantStatus={selectedTenant.status}
            activeUserCount={0}
          />
        </>
      )}
    </>
  )
}

export { TenantTable }
