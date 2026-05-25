import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  LayoutDashboard,
  Cog,
  SlidersHorizontal,
  ShieldCheck,
  Users,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PATHS } from "@/router/paths"
import { useLogout } from "@/features/auth/hooks/useLogout"

export function Sidebar() {
  const { t } = useTranslation("common")
  const location = useLocation()
  const { mutate: doLogout, isPending: isLoggingOut } = useLogout()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMainExpanded, setIsMainExpanded] = useState(false)

  const isMainActive = location.pathname === PATHS.DASHBOARD
  const isPlatformAdminActive = location.pathname.startsWith(
    "/platform-administration"
  )
  const isUserManagementActive = location.pathname === PATHS.USER_MANAGEMENT

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
          <Settings size={16} className="text-white" />
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
            <LayoutDashboard
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
                      isMainActive ? "text-[#1d41a8]" : "text-muted-foreground"
                    )}
                  />
                ) : (
                  <ChevronRight
                    size={16}
                    className={cn(
                      "shrink-0",
                      isMainActive ? "text-[#1d41a8]" : "text-muted-foreground"
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

        {/* Flat items */}
        {[
          { key: "operations", label: t("nav.operations"), icon: Cog },
          {
            key: "businessConfigurations",
            label: t("nav.businessConfigurations"),
            icon: SlidersHorizontal,
          },
          { key: "rulesSetup", label: t("nav.rulesSetup"), icon: ShieldCheck },
        ].map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center gap-2 px-2 py-2 rounded-[10px] cursor-default"
          >
            <Icon size={16} className="text-muted-foreground shrink-0" />
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

        {/* Platform administration group */}
        <div className="flex flex-col gap-2">
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-2 rounded-[10px]",
              isPlatformAdminActive ? "bg-[#dbe9fc]" : ""
            )}
          >
            <Users
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
                    "flex-1 text-sm min-w-0 truncate",
                    isPlatformAdminActive ? "text-[#1d41a8]" : "text-foreground"
                  )}
                >
                  {t("nav.platformAdministration")}
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "shrink-0",
                    isPlatformAdminActive
                      ? "text-[#1d41a8]"
                      : "text-muted-foreground"
                  )}
                />
              </>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col gap-3 pl-8 pr-2">
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
