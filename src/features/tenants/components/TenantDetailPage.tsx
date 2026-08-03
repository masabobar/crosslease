import { useState, type ReactNode } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  SquareCode,
  Landmark,
  CirclePause,
  CirclePlay,
  Archive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { OverviewTab } from "@/features/tenants/components/tabs/OverviewTab"
import { ModulesConfigTab } from "@/features/tenants/components/tabs/ModulesConfigTab"
import { GovernanceHistoryTab } from "@/features/tenants/components/tabs/GovernanceHistoryTab"
import { SupportGrantsTab } from "@/features/tenants/components/tabs/SupportGrantsTab"
import { LicenceLimitsTab } from "@/features/tenants/components/tabs/LicenceLimitsTab"
import { SuspendTenantDialog } from "@/features/tenants/components/SuspendTenantDialog"
import { ReactivateTenantDialog } from "@/features/tenants/components/ReactivateTenantDialog"
import { ArchiveTenantDialog } from "@/features/tenants/components/ArchiveTenantDialog"
import { useTenantDetail } from "@/features/tenants/hooks/useTenantDetail"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { SYSTEM_ADMIN_ROLE, SUPPORT_USER_ROLE } from "@/features/users/types"
import { getTenantDetailTabVisibility } from "@/features/tenants/utils"
import type { TenantDetailTabKey } from "@/features/tenants/utils"
import type { TenantDetail } from "@/features/tenants/api/schema"
import {
  isFullTenantResponse,
  TenantStatusSchema,
} from "@/features/tenants/api/schema"
import { formatDateTime } from "@/lib/formatters"
import { countryName } from "@/lib/countries"

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function TenantHighlightInfo({
  tenant,
  isAdmin,
  onSuspendClick,
  onReactivateClick,
  onArchiveClick,
}: {
  tenant: TenantDetail
  isAdmin: boolean
  onSuspendClick: () => void
  onReactivateClick: () => void
  onArchiveClick: () => void
}) {
  const { t } = useTranslation("tenants")
  const canSuspend = isAdmin && tenant.status === TenantStatusSchema.enum.active
  const canReactivate =
    isAdmin && tenant.status === TenantStatusSchema.enum.suspended
  const canArchive =
    isAdmin && tenant.status === TenantStatusSchema.enum.suspended

  return (
    <div className="flex flex-col w-full" data-testid="tenant-highlight-info">
      <div className="bg-background border border-border rounded-t-[10px] flex items-center justify-between px-3 py-4">
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-semibold text-foreground"
            data-testid="tenant-name"
          >
            {tenant.name}
          </h1>
          <TenantStatusBadge status={tenant.status} />
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2.5">
            {canSuspend && (
              <Button
                variant="outline"
                className="h-auto gap-1.5 px-2.5 py-2 text-sm rounded-[12px]"
                onClick={onSuspendClick}
                data-testid="btn-suspend-tenant"
              >
                <CirclePause size={16} />
                {t("detail.suspendTenant")}
              </Button>
            )}
            {canReactivate && (
              <Button
                variant="outline"
                className="h-auto gap-1.5 px-2.5 py-2 text-sm rounded-[12px]"
                onClick={onReactivateClick}
                data-testid="btn-reactivate-tenant"
              >
                <CirclePlay size={16} />
                {t("detail.reactivateTenant")}
              </Button>
            )}
            {canArchive && (
              <Button
                variant="outline"
                className="h-auto gap-1.5 px-2.5 py-2 text-sm rounded-[12px]"
                onClick={onArchiveClick}
                data-testid="btn-archive-tenant"
              >
                <Archive size={16} />
                {t("detail.archiveTenant")}
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="bg-slate-100 border-l border-r border-b border-border rounded-b-[10px] flex items-center gap-6 px-3 py-3">
        <MetaItem
          icon={<SquareCode size={16} />}
          label={t("detail.meta.code")}
          value={tenant.code}
        />
        <MetaItem
          icon={<Landmark size={16} />}
          label={t("detail.meta.type")}
          value={t(`tenantTypes.${tenant.tenant_type}` as "tenantTypes.bank")}
        />
        <MetaItem
          icon={<SquareCode size={16} />}
          label={t("detail.meta.country")}
          value={countryName(tenant.country)}
        />
        <MetaItem
          icon={<SquareCode size={16} />}
          label={t("detail.meta.provisioned")}
          value={formatDateTime(tenant.created_at)}
        />
      </div>
    </div>
  )
}

type TabKey = TenantDetailTabKey

function TenantDetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="tenant-detail-loading">
      <div className="h-28 bg-muted rounded-[10px] animate-pulse" />
      <div className="flex gap-6">
        <div className="flex-1 h-48 bg-muted rounded-[10px] animate-pulse" />
        <div className="flex-1 h-48 bg-muted rounded-[10px] animate-pulse" />
      </div>
      <div className="h-64 bg-muted rounded-[10px] animate-pulse" />
    </div>
  )
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation("tenants")
  const { data: currentUser } = useCurrentUser()
  const { data: tenant, isLoading, isError } = useTenantDetail(id ?? null)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isReactivateOpen, setIsReactivateOpen] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)

  const isAdmin = currentUser?.role === SYSTEM_ADMIN_ROLE
  const isSupportUser = currentUser?.role === SUPPORT_USER_ROLE
  const tabVisibility = getTenantDetailTabVisibility(
    {
      role: currentUser?.role,
      tenantId: currentUser?.tenant_id ?? null,
      accessValidUntil: currentUser?.access_valid_until ?? null,
    },
    id
  )

  const tabs: { key: TabKey; labelKey: string; testId: string }[] = [
    {
      key: "overview",
      labelKey: "detail.tabs.overview",
      testId: "tab-overview",
    },
    { key: "modules", labelKey: "detail.tabs.modules", testId: "tab-modules" },
    {
      key: "governance",
      labelKey: "detail.tabs.governance",
      testId: "tab-governance",
    },
    { key: "grants", labelKey: "detail.tabs.grants", testId: "tab-grants" },
    {
      key: "licence_limits",
      labelKey: "detail.tabs.licenceLimits",
      testId: "tab-licence-limits",
    },
  ]

  const visibleTabs = tabs.filter(tab => tabVisibility[tab.key])
  const effectiveTab: TabKey = visibleTabs.some(t => t.key === activeTab)
    ? activeTab
    : (visibleTabs[0]?.key ?? "overview")

  return (
    <div className="flex flex-col h-full" data-testid="tenant-detail-page">
      {(isLoading || !currentUser) && (
        <div className="px-8 pb-8">
          <TenantDetailSkeleton />
        </div>
      )}

      {isError && !isLoading && currentUser && (
        <div
          data-testid="tenant-detail-error"
          className="flex items-center justify-center flex-1"
        >
          <p className="text-sm text-muted-foreground">{t("errors.generic")}</p>
        </div>
      )}

      {tenant && !isLoading && currentUser && (
        <>
          {isAdmin && (
            <SuspendTenantDialog
              open={isSuspendOpen}
              onOpenChange={setIsSuspendOpen}
              tenantId={id!}
              tenantName={tenant.name}
              tenantStatus={tenant.status}
            />
          )}
          {isAdmin && (
            <ReactivateTenantDialog
              open={isReactivateOpen}
              onOpenChange={setIsReactivateOpen}
              tenantId={id!}
              tenantName={tenant.name}
              tenantStatus={tenant.status}
            />
          )}
          {isAdmin && (
            <ArchiveTenantDialog
              open={isArchiveOpen}
              onOpenChange={setIsArchiveOpen}
              tenantId={id!}
              tenantName={tenant.name}
              tenantStatus={tenant.status}
              activeUserCount={
                isFullTenantResponse(tenant) ? tenant.bank_user_utilisation : 0
              }
              // A support-shaped response carries no utilisation figure, so the
              // count is unknown rather than zero — the dialog must still force
              // the active-user acknowledgement. (`isError` cannot be used here:
              // this branch only renders once `tenant` has loaded.)
              activeUserCountUnknown={!isFullTenantResponse(tenant)}
            />
          )}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Highlight info */}
            <div className="px-8 pt-5 pb-4">
              <TenantHighlightInfo
                tenant={tenant}
                isAdmin={isAdmin}
                onSuspendClick={() => setIsSuspendOpen(true)}
                onReactivateClick={() => setIsReactivateOpen(true)}
                onArchiveClick={() => setIsArchiveOpen(true)}
              />
            </div>

            {/* Tab bar */}
            <UnderlineTabBar
              tabs={visibleTabs.map(tab => ({
                key: tab.key,
                label: t(tab.labelKey as "detail.tabs.overview"),
                testId: tab.testId,
              }))}
              activeTab={effectiveTab}
              onChange={setActiveTab}
              className="px-8"
            />

            {/* Tab content */}
            <div className="flex-1 overflow-auto px-8 py-6">
              {effectiveTab === "overview" && (
                <OverviewTab tenant={tenant} tenantId={id!} isAdmin={isAdmin} />
              )}
              {effectiveTab === "modules" && (
                <ModulesConfigTab
                  tenantId={id!}
                  tenantName={tenant.name}
                  isAdmin={isAdmin}
                  canViewIntegrationBinding={isAdmin || isSupportUser}
                  tenantStatus={tenant.status}
                />
              )}
              {effectiveTab === "governance" && (
                <GovernanceHistoryTab tenantId={id!} />
              )}
              {effectiveTab === "grants" && isAdmin && (
                <SupportGrantsTab
                  tenantId={id!}
                  tenantName={tenant.name}
                  tenantStatus={tenant.status}
                  isAdmin={isAdmin}
                />
              )}
              {effectiveTab === "licence_limits" && isAdmin && (
                <LicenceLimitsTab tenant={tenant} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
