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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PATHS } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import {
  USER_MANAGEMENT_ALLOWED_ROLES,
  LC_ONLY_ROLES,
} from "@/features/users/types"
import { AUDIT_TRAIL_ALLOWED_ROLES } from "@/features/audit/types"
import { TENANT_LIST_ALLOWED_ROLES } from "@/features/tenants/types"
import crossleaseLogo from "@/assets/crosslease.png"

export function Sidebar() {
  const { t } = useTranslation("common")
  const location = useLocation()
  const { data: currentUser } = useCurrentUser()
  const canAccessUserManagement =
    !!currentUser && USER_MANAGEMENT_ALLOWED_ROLES.includes(currentUser.role)
  const canAccessAuditTrail =
    !!currentUser && AUDIT_TRAIL_ALLOWED_ROLES.includes(currentUser.role)
  const canAccessTenantManagement =
    !!currentUser && TENANT_LIST_ALLOWED_ROLES.includes(currentUser.role)
  const isLcUser = !!currentUser && LC_ONLY_ROLES.includes(currentUser.role)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMainExpanded, setIsMainExpanded] = useState(false)
  const [isPlatformAdminExpanded, setIsPlatformAdminExpanded] = useState(() =>
    location.pathname.startsWith("/platform-administration")
  )

  const isMainActive = location.pathname === PATHS.DASHBOARD
  const isPlatformAdminActive = location.pathname.startsWith(
    "/platform-administration"
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
            ].map(({ key, label, icon: Icon, path }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={key}
                  to={path}
                  data-testid={`nav-lc-${key}`}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-[10px]",
                    isActive ? "bg-[#dbe9fc]" : "hover:bg-muted"
                  )}
                >
                  <Icon
                    size={16}
                    className={cn(
                      "shrink-0",
                      isActive ? "text-[#1d41a8]" : "text-muted-foreground"
                    )}
                  />
                  {!isCollapsed && (
                    <span
                      className={cn(
                        "flex-1 text-sm min-w-0 truncate",
                        isActive ? "text-[#1d41a8]" : "text-foreground"
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
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsMainExpanded(prev => !prev)}
                className={cn(
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
              </Button>
              {!isCollapsed && isMainExpanded && (
                <div className="flex flex-col gap-3 pl-8 pr-2">
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
                </div>
              )}
            </div>

            {/* ── Flat items with right chevron ── */}
            {[
              { key: "operations", label: t("nav.operations") },
              {
                key: "businessConfigurations",
                label: t("nav.businessConfigurations"),
              },
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

            {/* ── Platform administration group (expandable) ── */}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPlatformAdminExpanded(prev => !prev)}
                className={cn(
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
              </Button>
              {!isCollapsed && isPlatformAdminExpanded && (
                <div className="flex flex-col gap-3 pl-8 pr-2">
                  {canAccessUserManagement && (
                    <Link
                      to={PATHS.USER_MANAGEMENT}
                      data-testid="nav-user-management"
                      className={cn(
                        "flex items-center justify-between text-sm whitespace-nowrap",
                        isUserManagementActive
                          ? "font-medium text-[#1d41a8]"
                          : "text-foreground hover:text-[#1d41a8]"
                      )}
                    >
                      {t("nav.userManagement")}
                      {isUserManagementActive && (
                        <span className="size-1.5 rounded-full bg-[#1d41a8] shrink-0" />
                      )}
                    </Link>
                  )}
                  {canAccessUserManagement && (
                    <Link
                      to={PATHS.PENDING_APPROVALS}
                      data-testid="nav-pending-approvals"
                      className={cn(
                        "flex items-center justify-between text-sm whitespace-nowrap",
                        isPendingApprovalsActive
                          ? "font-medium text-[#1d41a8]"
                          : "text-foreground hover:text-[#1d41a8]"
                      )}
                    >
                      {t("nav.pendingApprovals")}
                      {isPendingApprovalsActive && (
                        <span className="size-1.5 rounded-full bg-[#1d41a8] shrink-0" />
                      )}
                    </Link>
                  )}
                  {canAccessAuditTrail && (
                    <Link
                      to={PATHS.AUDIT_TRAIL}
                      data-testid="nav-audit-trail"
                      className={cn(
                        "flex items-center justify-between text-sm whitespace-nowrap",
                        isAuditTrailActive
                          ? "font-medium text-[#1d41a8]"
                          : "text-foreground hover:text-[#1d41a8]"
                      )}
                    >
                      {t("nav.auditTrail")}
                      {isAuditTrailActive && (
                        <span className="size-1.5 rounded-full bg-[#1d41a8] shrink-0" />
                      )}
                    </Link>
                  )}
                  {[
                    t("nav.partnerManagement"),
                    t("nav.coreBankingIntegration"),
                  ].map(label => (
                    <span
                      key={label}
                      className="text-sm text-foreground whitespace-nowrap cursor-default"
                    >
                      {label}
                    </span>
                  ))}
                  {canAccessTenantManagement && (
                    <Link
                      to={PATHS.TENANT_MANAGEMENT}
                      data-testid="nav-tenant-management"
                      className={cn(
                        "flex items-center justify-between text-sm whitespace-nowrap",
                        isTenantManagementActive
                          ? "font-medium text-[#1d41a8]"
                          : "text-foreground hover:text-[#1d41a8]"
                      )}
                    >
                      {t("nav.tenantManagement")}
                      {isTenantManagementActive && (
                        <span className="size-1.5 rounded-full bg-[#1d41a8] shrink-0" />
                      )}
                    </Link>
                  )}
                </div>
              )}
            </div>
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
