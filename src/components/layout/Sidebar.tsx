import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  Home,
  SquareTerminal,
  Shield,
  FileText,
  BarChart2,
  FolderOpen,
  Send,
  Landmark,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  PATHS,
  PLATFORM_ADMINISTRATION_PREFIX,
  BUSINESS_CONFIGURATION_PREFIX,
} from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useCurrentUserPermissions } from "@/features/users/hooks/useCurrentUserPermissions"
import {
  USER_MANAGEMENT_ALLOWED_ROLES,
  LC_ONLY_ROLES,
} from "@/features/users/types"
import { canAccessAuditTrail as hasAuditTrailAccess } from "@/features/audit/types"
import { GOVERNED_ACTION_LIST_ALLOWED_ROLES } from "@/features/governed-actions/constants"
import { NOTIFICATION_CONFIG_ALLOWED_ROLES } from "@/features/notifications/types"
import { TENANT_LIST_ALLOWED_ROLES } from "@/features/tenants/types"
import { PARTNER_VIEW_ALLOWED_ROLES } from "@/features/partners/types"
import { PRODUCT_TEMPLATE_READ_ALLOWED_ROLES } from "@/features/productTemplates/types"
import { FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES } from "@/features/frameworkAgreements/types"
import { FRAMEWORK_AGREEMENT_MODULE_KEY } from "@/features/frameworkAgreements/constants"
import { WORKFLOW_TASK_CATALOG_READ_ALLOWED_ROLES } from "@/features/workflowTaskCatalog/types"
import crossleaseLogo from "@/assets/crosslease.png"

type SidebarNavLinkProps = {
  to: string
  label: string
  testid: string
  isActive: boolean
  indent?: boolean
}

function SidebarNavLink({
  to,
  label,
  testid,
  isActive,
  indent,
}: SidebarNavLinkProps) {
  return (
    <Link
      to={to}
      data-testid={testid}
      className={cn(
        "flex items-center justify-between text-sm whitespace-nowrap",
        indent && "pl-3",
        isActive
          ? "font-medium text-sidebar-primary-foreground"
          : "text-foreground hover:text-sidebar-primary-foreground"
      )}
    >
      {label}
      {isActive && (
        <span className="size-1.5 rounded-full bg-sidebar-primary-foreground shrink-0" />
      )}
    </Link>
  )
}

export function Sidebar() {
  const { t } = useTranslation("common")
  const location = useLocation()
  const { data: currentUser } = useCurrentUser()
  const { data: permissions } = useCurrentUserPermissions()
  const canAccessPendingApprovals =
    !!currentUser &&
    GOVERNED_ACTION_LIST_ALLOWED_ROLES.includes(currentUser.role)

  const canAccessUserManagement =
    !!currentUser && USER_MANAGEMENT_ALLOWED_ROLES.includes(currentUser.role)
  const canAccessAuditTrail = hasAuditTrailAccess(currentUser?.role)
  const canAccessNotificationConfig =
    !!currentUser &&
    NOTIFICATION_CONFIG_ALLOWED_ROLES.includes(currentUser.role)
  const canAccessTenantManagement =
    !!currentUser && TENANT_LIST_ALLOWED_ROLES.includes(currentUser.role)
  const canAccessPartnerRegistry =
    !!currentUser && PARTNER_VIEW_ALLOWED_ROLES.includes(currentUser.role)
  // Not gated on module activation — a tenant with the module inactive still sees the
  // link and lands on an explanatory state rather than the link disappearing outright.
  const canAccessProductTemplates =
    !!currentUser &&
    PRODUCT_TEMPLATE_READ_ALLOWED_ROLES.includes(currentUser.role)
  // Users without a home tenant (auditor is the only such role left with FA read)
  // aren't gated on module activation here — /me/permissions only reflects always-on
  // modules for them, since module activation is per-tenant and they operate across
  // tenants. Enforcement for a specific tenant still happens at the API layer once
  // one is selected.
  const canAccessFrameworkAgreements =
    !!currentUser &&
    FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES.includes(currentUser.role) &&
    (!currentUser.tenant_id ||
      !!permissions?.active_modules.includes(FRAMEWORK_AGREEMENT_MODULE_KEY))
  // Not gated on module activation — mirrors Product Templates: no live API to detect
  // module-inactive state in this static shell (Epic 15 has no backend yet).
  const canAccessWorkflowTaskCatalog =
    !!currentUser &&
    WORKFLOW_TASK_CATALOG_READ_ALLOWED_ROLES.includes(currentUser.role)
  const isLcUser = !!currentUser && LC_ONLY_ROLES.includes(currentUser.role)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMainExpanded, setIsMainExpanded] = useState(false)
  const [isPlatformAdminExpanded, setIsPlatformAdminExpanded] = useState(() =>
    location.pathname.startsWith(PLATFORM_ADMINISTRATION_PREFIX)
  )
  const [isBusinessConfigExpanded, setIsBusinessConfigExpanded] = useState(() =>
    location.pathname.startsWith(BUSINESS_CONFIGURATION_PREFIX)
  )

  const isMainActive = location.pathname === PATHS.DASHBOARD
  const isPlatformAdminActive = location.pathname.startsWith(
    PLATFORM_ADMINISTRATION_PREFIX
  )
  const isUserManagementActive =
    location.pathname === PATHS.USER_MANAGEMENT ||
    location.pathname.startsWith(PATHS.USER_MANAGEMENT + "/")
  const isPendingApprovalsActive = location.pathname === PATHS.PENDING_APPROVALS
  const isTenantManagementActive =
    location.pathname === PATHS.TENANT_MANAGEMENT ||
    location.pathname.startsWith(PATHS.TENANT_MANAGEMENT + "/")
  const isAuditTrailActive =
    location.pathname === PATHS.AUDIT_TRAIL ||
    location.pathname.startsWith(PATHS.AUDIT_TRAIL + "/")
  const isNotificationConfigActive =
    location.pathname === PATHS.NOTIFICATION_CONFIGURATION
  const isPartnerRegistryActive =
    location.pathname === PATHS.PARTNER_REGISTRY ||
    (location.pathname.startsWith(PATHS.PARTNER_REGISTRY + "/") &&
      !location.pathname.startsWith(PATHS.PARTNER_DUPLICATES))
  const isPartnerDuplicatesActive = location.pathname.startsWith(
    PATHS.PARTNER_DUPLICATES
  )
  const isBusinessConfigActive = location.pathname.startsWith(
    BUSINESS_CONFIGURATION_PREFIX
  )
  const isProductTemplateListActive = location.pathname.startsWith(
    PATHS.PRODUCT_TEMPLATE_LIST
  )
  const isFrameworkAgreementListActive = location.pathname.startsWith(
    PATHS.FRAMEWORK_AGREEMENT_LIST
  )
  const isWorkflowTaskCatalogListActive = location.pathname.startsWith(
    PATHS.WORKFLOW_TASK_CATALOG_LIST
  )

  return (
    <aside
      data-testid="app-sidebar"
      className={cn(
        "flex flex-col h-full bg-white border-r border-border shrink-0 transition-all duration-200",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      {/* ── Brand header ── */}
      <div className="flex items-center gap-2 p-2 shrink-0">
        <Button
          size="icon"
          onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
          className={cn(
            "rounded-[10px] shrink-0",
            !isCollapsed && "pointer-events-none"
          )}
        >
          <svg
            viewBox="0 0 13.5 14.8333"
            fill="none"
            className="size-4 text-white"
            aria-hidden="true"
          >
            <path
              d="M3.41667 0.75H10.0833M2.08333 3.41667H11.4167M2.08333 6.08333H11.4167C12.153 6.08333 12.75 6.68029 12.75 7.41667V12.75C12.75 13.4864 12.153 14.0833 11.4167 14.0833H2.08333C1.34695 14.0833 0.75 13.4864 0.75 12.75V7.41667C0.75 6.68029 1.34695 6.08333 2.08333 6.08333Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {t("nav.leasingPlatform")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="size-6 shrink-0 rounded-md text-muted-foreground"
            >
              <ChevronsLeft size={14} />
            </Button>
          </>
        )}
      </div>

      {/* ── Nav content ── */}
      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto p-2 min-h-0">
        {/* LC user navigation — shown only for leasing company users */}
        {isLcUser && (
          <>
            {[
              {
                key: "requests",
                label: t("nav.lcRequests"),
                icon: FileText,
                path: PATHS.LC_REQUESTS,
              },
              {
                key: "status",
                label: t("nav.lcStatus"),
                icon: BarChart2,
                path: PATHS.LC_STATUS,
              },
              {
                key: "documents",
                label: t("nav.lcDocuments"),
                icon: FolderOpen,
                path: PATHS.LC_DOCUMENTS,
              },
              {
                key: "proposals",
                label: t("nav.lcProposals"),
                icon: Send,
                path: PATHS.LC_PROPOSALS,
              },
              {
                key: "frameworkAgreements",
                label: t("nav.lcFrameworkAgreements"),
                icon: Landmark,
                path: PATHS.LC_FRAMEWORK_AGREEMENTS,
              },
            ].map(({ key, label, icon: Icon, path }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={key}
                  to={path}
                  data-testid={`nav-lc-${key}`}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-[10px]",
                    isActive ? "bg-sidebar-primary" : "hover:bg-muted"
                  )}
                >
                  <Icon
                    size={16}
                    className={cn(
                      "shrink-0",
                      isActive
                        ? "text-sidebar-primary-foreground"
                        : "text-muted-foreground"
                    )}
                  />
                  {!isCollapsed && (
                    <span
                      className={cn(
                        "flex-1 text-sm min-w-0 truncate",
                        isActive
                          ? "text-sidebar-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {label}
                    </span>
                  )}
                </Link>
              )
            })}
          </>
        )}

        {/* Internal-only navigation — completely hidden for LC users */}
        {!isLcUser && (
          <>
            {/* ── Main group (expandable) ── */}
            <Collapsible
              open={isMainExpanded}
              onOpenChange={setIsMainExpanded}
              className="flex flex-col gap-2"
            >
              <CollapsibleTrigger
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full justify-start gap-2 px-2 h-auto py-2 rounded-[10px] font-normal",
                  isMainActive &&
                    "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                )}
              >
                <Home
                  size={16}
                  className={cn(
                    "shrink-0",
                    !isMainActive && "text-muted-foreground"
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm min-w-0 truncate">
                      {t("nav.main")}
                    </span>
                    {isMainExpanded ? (
                      <ChevronDown
                        size={16}
                        className={cn(
                          "shrink-0",
                          !isMainActive && "text-muted-foreground"
                        )}
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        className={cn(
                          "shrink-0",
                          !isMainActive && "text-muted-foreground"
                        )}
                      />
                    )}
                  </>
                )}
              </CollapsibleTrigger>
              {!isCollapsed && (
                <CollapsibleContent className="flex flex-col gap-3 pl-8 pr-2">
                  {[
                    t("nav.dashboard"),
                    t("nav.refinancingRequests"),
                    t("nav.contracts"),
                    t("nav.financing"),
                  ].map(label => (
                    <span
                      key={label}
                      className="text-sm text-foreground whitespace-nowrap cursor-default"
                    >
                      {label}
                    </span>
                  ))}
                </CollapsibleContent>
              )}
            </Collapsible>

            {/* ── Flat items with right chevron ── */}
            {[
              { key: "operations", label: t("nav.operations") },
              { key: "rulesSetup", label: t("nav.rulesSetup") },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center gap-2 px-2 py-2 rounded-[10px] cursor-default hover:bg-muted"
              >
                <SquareTerminal
                  size={16}
                  className="text-muted-foreground shrink-0"
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-sm text-foreground min-w-0 truncate">
                      {label}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-muted-foreground shrink-0"
                    />
                  </>
                )}
              </div>
            ))}

            {/* ── Business configuration group (expandable) ── */}
            <Collapsible
              open={isBusinessConfigExpanded}
              onOpenChange={setIsBusinessConfigExpanded}
              className="flex flex-col gap-2"
            >
              <CollapsibleTrigger
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full justify-start gap-2 px-2 h-auto py-2 rounded-[10px] font-normal",
                  isBusinessConfigActive &&
                    "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                )}
              >
                <SquareTerminal
                  size={16}
                  className={cn(
                    "shrink-0",
                    !isBusinessConfigActive && "text-muted-foreground"
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm min-w-0 truncate">
                      {t("nav.businessConfigurations")}
                    </span>
                    {isBusinessConfigExpanded ? (
                      <ChevronDown
                        size={16}
                        className={cn(
                          "shrink-0",
                          !isBusinessConfigActive && "text-muted-foreground"
                        )}
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        className={cn(
                          "shrink-0",
                          !isBusinessConfigActive && "text-muted-foreground"
                        )}
                      />
                    )}
                  </>
                )}
              </CollapsibleTrigger>
              {!isCollapsed && (
                <CollapsibleContent className="flex flex-col gap-3 pl-8 pr-2">
                  {canAccessProductTemplates && (
                    <SidebarNavLink
                      to={PATHS.PRODUCT_TEMPLATE_LIST}
                      label={t("nav.productTemplates")}
                      testid="nav-product-templates"
                      isActive={isProductTemplateListActive}
                    />
                  )}
                  {canAccessFrameworkAgreements && (
                    <SidebarNavLink
                      to={PATHS.FRAMEWORK_AGREEMENT_LIST}
                      label={t("nav.frameworkAgreements")}
                      testid="nav-framework-agreements"
                      isActive={isFrameworkAgreementListActive}
                    />
                  )}
                  {canAccessWorkflowTaskCatalog && (
                    <SidebarNavLink
                      to={PATHS.WORKFLOW_TASK_CATALOG_LIST}
                      label={t("nav.workflowTaskCatalogs")}
                      testid="nav-workflow-task-catalogs"
                      isActive={isWorkflowTaskCatalogListActive}
                    />
                  )}
                </CollapsibleContent>
              )}
            </Collapsible>

            {/* ── Platform administration group (expandable) ── */}
            <Collapsible
              open={isPlatformAdminExpanded}
              onOpenChange={setIsPlatformAdminExpanded}
              className="flex flex-col gap-2"
            >
              <CollapsibleTrigger
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full justify-start gap-2 px-2 h-auto py-2 rounded-[10px] font-normal",
                  isPlatformAdminActive &&
                    "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                )}
              >
                <Shield
                  size={16}
                  className={cn(
                    "shrink-0",
                    !isPlatformAdminActive && "text-muted-foreground"
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm min-w-0 truncate">
                      {t("nav.platformAdministration")}
                    </span>
                    {isPlatformAdminExpanded ? (
                      <ChevronDown
                        size={16}
                        className={cn(
                          "shrink-0",
                          !isPlatformAdminActive && "text-muted-foreground"
                        )}
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        className={cn(
                          "shrink-0",
                          !isPlatformAdminActive && "text-muted-foreground"
                        )}
                      />
                    )}
                  </>
                )}
              </CollapsibleTrigger>
              {!isCollapsed && (
                <CollapsibleContent className="flex flex-col gap-3 pl-8 pr-2">
                  {canAccessUserManagement && (
                    <SidebarNavLink
                      to={PATHS.USER_MANAGEMENT}
                      label={t("nav.userManagement")}
                      testid="nav-user-management"
                      isActive={isUserManagementActive}
                    />
                  )}
                  {canAccessPendingApprovals && (
                    <SidebarNavLink
                      to={PATHS.PENDING_APPROVALS}
                      label={t("nav.pendingApprovals")}
                      testid="nav-pending-approvals"
                      isActive={isPendingApprovalsActive}
                    />
                  )}
                  {canAccessAuditTrail && (
                    <SidebarNavLink
                      to={PATHS.AUDIT_TRAIL}
                      label={t("nav.auditTrail")}
                      testid="nav-audit-trail"
                      isActive={isAuditTrailActive}
                    />
                  )}
                  {canAccessNotificationConfig && (
                    <SidebarNavLink
                      to={PATHS.NOTIFICATION_CONFIGURATION}
                      label={t("nav.notificationConfiguration")}
                      testid="nav-notification-configuration"
                      isActive={isNotificationConfigActive}
                    />
                  )}
                  {canAccessPartnerRegistry && (
                    <SidebarNavLink
                      to={PATHS.PARTNER_REGISTRY}
                      label={t("nav.partnerManagement")}
                      testid="nav-partner-registry"
                      isActive={isPartnerRegistryActive}
                    />
                  )}
                  {canAccessPartnerRegistry && (
                    <SidebarNavLink
                      to={PATHS.PARTNER_DUPLICATES}
                      label={t("nav.partnerDuplicates")}
                      testid="nav-partner-duplicates"
                      isActive={isPartnerDuplicatesActive}
                      indent
                    />
                  )}
                  <span className="text-sm text-foreground whitespace-nowrap cursor-default">
                    {t("nav.coreBankingIntegration")}
                  </span>
                  {canAccessTenantManagement && (
                    <SidebarNavLink
                      to={PATHS.TENANT_MANAGEMENT}
                      label={t("nav.tenantManagement")}
                      testid="nav-tenant-management"
                      isActive={isTenantManagementActive}
                    />
                  )}
                </CollapsibleContent>
              )}
            </Collapsible>
          </>
        )}
      </nav>

      {/* ── Powered by CrossLease ── */}
      {!isCollapsed && (
        <div className="px-2 py-2 shrink-0">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("nav.poweredBy")}
            </p>
            <img
              src={crossleaseLogo}
              alt="CrossLease"
              className="h-2 w-auto object-contain object-left"
            />
          </div>
        </div>
      )}
    </aside>
  )
}
