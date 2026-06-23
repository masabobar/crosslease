import { useState, type ReactNode } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TenantStatusBadge } from "@/features/tenants/components/TenantStatusBadge"
import { useTenantDetail } from "@/features/tenants/hooks/useTenantDetail"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { isFullTenantResponse } from "@/features/tenants/api/schema"
import { PATHS } from "@/router/paths"

type TabKey = "overview" | "modules" | "governance" | "grants"

function TabButton({
  active,
  onClick,
  children,
  "data-testid": testId,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  "data-testid"?: string
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      data-testid={testId}
      className={`h-auto px-3 py-2 rounded-none border-none text-sm font-medium hover:bg-transparent focus-visible:ring-0 border-b-2 ${
        active
          ? "text-foreground border-foreground"
          : "text-muted-foreground hover:text-foreground border-transparent"
      }`}
    >
      {children}
    </Button>
  )
}

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
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const { data: tenant, isLoading, isError } = useTenantDetail(id ?? null)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  const isAdmin = currentUser?.role === "system_admin"

  const tabs: {
    key: TabKey
    labelKey: string
    testId: string
    adminOnly?: boolean
  }[] = [
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
    {
      key: "grants",
      labelKey: "detail.tabs.grants",
      testId: "tab-grants",
      adminOnly: true,
    },
  ]

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin)

  return (
    <div className="flex flex-col h-full" data-testid="tenant-detail-page">
      {/* Back navigation */}
      <div className="px-8 pt-5 pb-2">
        <Button
          variant="ghost"
          onClick={() => navigate(PATHS.TENANT_MANAGEMENT)}
          className="h-auto p-0 gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-transparent"
          data-testid="back-to-tenants"
        >
          <ChevronLeft size={16} />
          {t("detail.backToList")}
        </Button>
      </div>

      {isLoading && (
        <div className="px-8 pb-8">
          <TenantDetailSkeleton />
        </div>
      )}

      {isError && !isLoading && (
        <div
          data-testid="tenant-detail-error"
          className="flex items-center justify-center flex-1"
        >
          <p className="text-sm text-muted-foreground">{t("errors.generic")}</p>
        </div>
      )}

      {tenant && !isLoading && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Hero header */}
          <div className="px-8 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <h1
                    className="text-2xl font-semibold text-foreground"
                    data-testid="tenant-name"
                  >
                    {tenant.name}
                  </h1>
                  <TenantStatusBadge status={tenant.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span data-testid="tenant-code" className="font-mono">
                    {tenant.code}
                  </span>
                  <span>·</span>
                  <span data-testid="tenant-type">
                    {t(
                      `tenantTypes.${tenant.tenant_type}` as "tenantTypes.bank"
                    )}
                  </span>
                  {isFullTenantResponse(tenant) && tenant.activated_at && (
                    <>
                      <span>·</span>
                      <span>
                        {t("detail.activatedAt", {
                          date: new Date(
                            tenant.activated_at
                          ).toLocaleDateString(),
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="border-b border-border px-8">
            <div className="flex items-center gap-1 -mb-px">
              {visibleTabs.map(tab => (
                <TabButton
                  key={tab.key}
                  active={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  data-testid={tab.testId}
                >
                  {t(tab.labelKey as "detail.tabs.overview")}
                </TabButton>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto px-8 py-6">
            {activeTab === "overview" && (
              <div
                data-testid="tab-content-overview"
                className="text-sm text-muted-foreground"
              >
                {/* OverviewTab — pending Figma design */}
                <p>{t("detail.tabs.overview")}</p>
              </div>
            )}
            {activeTab === "modules" && (
              <div
                data-testid="tab-content-modules"
                className="text-sm text-muted-foreground"
              >
                {/* ModuleProfileTab — pending Figma design */}
                <p>{t("detail.tabs.modules")}</p>
              </div>
            )}
            {activeTab === "governance" && (
              <div
                data-testid="tab-content-governance"
                className="text-sm text-muted-foreground"
              >
                {/* GovernanceHistoryTab — pending Figma design */}
                <p>{t("detail.tabs.governance")}</p>
              </div>
            )}
            {activeTab === "grants" && isAdmin && (
              <div
                data-testid="tab-content-grants"
                className="text-sm text-muted-foreground"
              >
                {/* SupportGrantsTab — pending Figma design */}
                <p>{t("detail.tabs.grants")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
