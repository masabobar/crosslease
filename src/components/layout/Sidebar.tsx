import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  Home,
  SquareTerminal,
  LogOut,
  FileText,
  BarChart2,
  FolderOpen,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PATHS } from "@/router/paths"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import {
  USER_MANAGEMENT_ALLOWED_ROLES,
  LC_ONLY_ROLES,
} from "@/features/users/types"

export function Sidebar() {
  const { t } = useTranslation("common")
  const location = useLocation()
  const { mutate: doLogout, isPending: isLoggingOut } = useLogout()
  const { data: currentUser } = useCurrentUser()
  const canAccessUserManagement =
    !!currentUser && USER_MANAGEMENT_ALLOWED_ROLES.includes(currentUser.role)
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

  return (
    <aside
      data-testid="app-sidebar"
      className={cn(
        "flex flex-col h-full bg-white border-r border-border shrink-0 transition-all duration-200",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      {/* Brand header */}
      <div className="flex items-center gap-2 p-2 shrink-0">
        <button
          onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-[10px] bg-[#2d62ef] shrink-0",
            isCollapsed && "cursor-pointer hover:opacity-90 transition-opacity"
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
        </button>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-sm font-medium text-foreground truncate">
              {t("nav.leasingPlatform")}
            </span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <ChevronsLeft size={14} />
            </button>
          </>
        )}
      </div>

      {/* Nav content */}
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
            {/* Main group */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsMainExpanded(prev => !prev)}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-2 rounded-[10px]",
                  isMainActive ? "bg-[#dbe9fc]" : "hover:bg-muted"
                )}
              >
                <Home
                  size={16}
                  className={cn(
                    "shrink-0",
                    isMainActive ? "text-[#1d41a8]" : "text-muted-foreground"
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span
                      className={cn(
                        "flex-1 text-left text-sm min-w-0 truncate",
                        isMainActive ? "text-[#1d41a8]" : "text-foreground"
                      )}
                    >
                      {t("nav.main")}
                    </span>
                    {isMainExpanded ? (
                      <ChevronDown
                        size={16}
                        className={cn(
                          "shrink-0",
                          isMainActive
                            ? "text-[#1d41a8]"
                            : "text-muted-foreground"
                        )}
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        className={cn(
                          "shrink-0",
                          isMainActive
                            ? "text-[#1d41a8]"
                            : "text-muted-foreground"
                        )}
                      />
                    )}
                  </>
                )}
              </button>
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

            {/* Flat items — no sub-navigation */}
            {[
              { key: "operations", label: t("nav.operations") },
              {
                key: "businessConfigurations",
                label: t("nav.businessConfigurations"),
              },
              {
                key: "rulesSetup",
                label: t("nav.rulesSetup"),
              },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center gap-2 px-2 py-2 rounded-[10px] cursor-default"
              >
                <SquareTerminal
                  size={16}
                  className="text-muted-foreground shrink-0"
                />
                {!isCollapsed && (
                  <span className="flex-1 text-sm text-foreground min-w-0 truncate">
                    {label}
                  </span>
                )}
              </div>
            ))}

            {/* Platform administration group */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsPlatformAdminExpanded(prev => !prev)}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-2 rounded-[10px]",
                  isPlatformAdminActive ? "bg-[#dbe9fc]" : "hover:bg-muted"
                )}
              >
                <SquareTerminal
                  size={16}
                  className={cn(
                    "shrink-0",
                    isPlatformAdminActive
                      ? "text-[#1d41a8]"
                      : "text-muted-foreground"
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span
                      className={cn(
                        "flex-1 text-left text-sm min-w-0 truncate",
                        isPlatformAdminActive
                          ? "text-[#1d41a8]"
                          : "text-foreground"
                      )}
                    >
                      {t("nav.platformAdministration")}
                    </span>
                    {isPlatformAdminExpanded ? (
                      <ChevronDown
                        size={16}
                        className={cn(
                          "shrink-0",
                          isPlatformAdminActive
                            ? "text-[#1d41a8]"
                            : "text-muted-foreground"
                        )}
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        className={cn(
                          "shrink-0",
                          isPlatformAdminActive
                            ? "text-[#1d41a8]"
                            : "text-muted-foreground"
                        )}
                      />
                    )}
                  </>
                )}
              </button>
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
                  {[
                    t("nav.partnerManagement"),
                    t("nav.tenantManagement"),
                    t("nav.coreBankingIntegration"),
                    t("nav.auditTrail"),
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
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-2 shrink-0 border-t border-border">
        <button
          data-testid="sidebar-logout-button"
          onClick={() => doLogout()}
          disabled={isLoggingOut}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-2 rounded-[10px] text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && t("nav.logout")}
        </button>
      </div>
    </aside>
  )
}
