import { useState } from "react"
import {
  MoreHorizontal,
  UserCheck,
  Mail,
  Ban,
  RotateCcw,
  UserX,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import type {
  UserListItem,
  UserSortKey,
  UserSortOrder,
} from "@/features/users/api/schema"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge"
import { FOUR_EYES_ROLES } from "@/features/users/types"
import type { UserRole, UserActionType } from "@/features/users/types"
import { formatLastLogin, getInitials } from "@/features/users/utils"

type SortState = { key: UserSortKey | null; dir: UserSortOrder }

type UserTableProps = {
  users: UserListItem[]
  isLoading: boolean
  sort: SortState
  onSort: (key: UserSortKey) => void
  onAction?: (type: UserActionType, user: UserListItem) => void
  onRowClick?: (user: UserListItem) => void
  viewerRole?: UserRole
}

type SortableHeaderProps = {
  columnKey: UserSortKey
  sort: SortState
  onSort: (key: UserSortKey) => void
  children: React.ReactNode
}

function SortableHeader({
  columnKey,
  sort,
  onSort,
  children,
}: SortableHeaderProps) {
  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className="flex items-center gap-0.5 text-sm font-medium text-foreground hover:text-foreground/70 transition-colors"
    >
      {children}
      {sort.key !== columnKey ? (
        <ChevronsUpDown
          size={12}
          className="text-muted-foreground/40 shrink-0"
        />
      ) : sort.dir === "asc" ? (
        <ChevronUp size={12} className="shrink-0" />
      ) : (
        <ChevronDown size={12} className="shrink-0" />
      )}
    </button>
  )
}

type KebabMenuProps = {
  user: UserListItem
  viewerRole: UserRole | undefined
  onAction?: (type: UserActionType) => void
}

function KebabMenu({ user, viewerRole, onAction }: KebabMenuProps) {
  const { t } = useTranslation("users")
  const [open, setOpen] = useState(false)

  const isAdmin = viewerRole === "system_admin"

  const approveVisible =
    isAdmin &&
    user.status === "pending_activation" &&
    FOUR_EYES_ROLES.includes(user.role as UserRole)
  const resendVisible = isAdmin && user.status === "invited"
  const suspendVisible = isAdmin && user.status === "active"
  const reactivateVisible = isAdmin && user.status === "suspended"
  const deactivateVisible =
    isAdmin && (user.status === "active" || user.status === "suspended")

  const hasActions =
    approveVisible ||
    resendVisible ||
    suspendVisible ||
    reactivateVisible ||
    deactivateVisible

  if (!hasActions) {
    return (
      <button
        type="button"
        className="text-muted-foreground/30 cursor-default"
        disabled
      >
        <MoreHorizontal size={16} />
      </button>
    )
  }

  function handleAction(type: UserActionType) {
    setOpen(false)
    onAction?.(type)
  }

  return (
    <div className="relative">
      <button
        type="button"
        data-testid={`user-row-menu-${user.id}`}
        onClick={() => setOpen(v => !v)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 w-48 rounded-xl border border-border bg-card shadow-md py-1">
            {approveVisible && (
              <button
                type="button"
                data-testid="user-action-approve"
                onClick={() => handleAction("approve")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <UserCheck size={14} className="text-muted-foreground" />
                {t("table.actions.approve")}
              </button>
            )}
            {resendVisible && (
              <button
                type="button"
                data-testid="user-action-resend-invitation"
                onClick={() => handleAction("resend-invitation")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Mail size={14} className="text-muted-foreground" />
                {t("actions.resend-invitation.label")}
              </button>
            )}
            {suspendVisible && (
              <button
                type="button"
                data-testid="user-action-suspend"
                onClick={() => handleAction("suspend")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Ban size={14} className="text-muted-foreground" />
                {t("actions.suspend.label")}
              </button>
            )}
            {reactivateVisible && (
              <button
                type="button"
                data-testid="user-action-reactivate"
                onClick={() => handleAction("reactivate")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw size={14} className="text-muted-foreground" />
                {t("actions.reactivate.label")}
              </button>
            )}
            {deactivateVisible && (
              <button
                type="button"
                data-testid="user-action-deactivate"
                onClick={() => handleAction("deactivate")}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <UserX size={14} className="text-destructive" />
                {t("actions.deactivate.label")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const SKELETON_ROWS = [0, 1, 2, 3, 4]

function UserTable({
  users,
  isLoading,
  sort,
  onSort,
  onAction,
  onRowClick,
  viewerRole,
}: UserTableProps) {
  return (
    <div className="w-full" data-testid="user-table">
      {/* Header row */}
      <div className="flex border-b border-border h-10 items-center">
        <div className="flex-1 min-w-0 px-2">
          <SortableHeader columnKey="name" sort={sort} onSort={onSort}>
            User
          </SortableHeader>
        </div>
        <div className="w-[200px] shrink-0 px-2">
          <SortableHeader columnKey="role" sort={sort} onSort={onSort}>
            Role
          </SortableHeader>
        </div>
        <div className="w-[200px] shrink-0 px-2">
          <SortableHeader columnKey="tenant_name" sort={sort} onSort={onSort}>
            Tenant
          </SortableHeader>
        </div>
        <div className="w-[136px] shrink-0 px-2 text-sm font-medium text-foreground">
          MFA
        </div>
        <div className="w-[136px] shrink-0 px-2">
          <SortableHeader columnKey="status" sort={sort} onSort={onSort}>
            Status
          </SortableHeader>
        </div>
        <div className="w-[136px] shrink-0 px-2">
          <SortableHeader columnKey="last_login" sort={sort} onSort={onSort}>
            Last login
          </SortableHeader>
        </div>
        <div className="shrink-0 w-8" />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-0" data-testid="user-table-loading">
          {SKELETON_ROWS.map(i => (
            <div
              key={i}
              className="flex border-b border-border h-[52px] items-center"
            >
              <div className="flex-1 min-w-0 p-2 flex items-center gap-2">
                <div className="bg-muted rounded-full size-8 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="bg-muted rounded h-3.5 animate-pulse w-32" />
                  <div className="bg-muted rounded h-3 animate-pulse w-44" />
                </div>
              </div>
              <div className="w-[200px] shrink-0 p-2">
                <div className="bg-muted rounded h-5 animate-pulse w-24" />
              </div>
              <div className="w-[200px] shrink-0 p-2">
                <div className="bg-muted rounded h-4 animate-pulse w-20" />
              </div>
              <div className="w-[136px] shrink-0 p-2">
                <div className="bg-muted rounded h-4 animate-pulse w-12" />
              </div>
              <div className="w-[136px] shrink-0 p-2">
                <div className="bg-muted rounded h-5 animate-pulse w-16" />
              </div>
              <div className="w-[136px] shrink-0 p-2">
                <div className="bg-muted rounded h-4 animate-pulse w-20" />
              </div>
              <div className="shrink-0 w-8" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && users.length === 0 && (
        <div
          className="flex justify-center items-center h-[52px]"
          data-testid="user-table-empty"
        >
          <span className="text-sm text-muted-foreground">No users found.</span>
        </div>
      )}

      {/* Data rows */}
      {!isLoading &&
        users.map(user => (
          <div
            key={user.id}
            data-testid={`user-row-${user.id}`}
            className="flex border-b border-border h-[52px] items-center hover:bg-muted transition-colors cursor-pointer"
            onClick={() => onRowClick?.(user)}
          >
            {/* User cell */}
            <div className="flex-1 min-w-0 p-2 flex items-center gap-2">
              <div className="size-8 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center overflow-hidden">
                <span className="text-sm text-muted-foreground text-center leading-none">
                  {getInitials(user.first_name, user.last_name)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate leading-5">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-4">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Role cell */}
            <div className="w-[200px] shrink-0 p-2">
              <RoleBadge role={user.role} />
            </div>

            {/* Tenant cell */}
            <div className="w-[200px] shrink-0 p-2">
              <span className="text-sm text-foreground">
                {user.tenant_name ?? "—"}
              </span>
            </div>

            {/* MFA cell */}
            <div className="w-[136px] shrink-0 p-2">
              {user.mfa_enabled === true ? (
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <span className="size-2 rounded-full bg-green-500 shrink-0" />
                  On
                </span>
              ) : user.mfa_enabled === false ? (
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <span className="size-2 rounded-full bg-red-500 shrink-0" />
                  Off
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>

            {/* Status cell */}
            <div className="w-[136px] shrink-0 p-2">
              <UserStatusBadge status={user.status} />
            </div>

            {/* Last login cell */}
            <div className="w-[136px] shrink-0 p-2">
              <span className="text-sm text-muted-foreground">
                {formatLastLogin(user.last_login)}
              </span>
            </div>

            {/* Actions cell */}
            <div
              className="shrink-0 p-2 flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <KebabMenu
                user={user}
                viewerRole={viewerRole}
                onAction={type => onAction?.(type, user)}
              />
            </div>
          </div>
        ))}
    </div>
  )
}

export { UserTable }
