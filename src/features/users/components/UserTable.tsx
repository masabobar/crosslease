import { type ReactNode } from "react"
import {
  MoreHorizontal,
  UserCheck,
  Mail,
  Ban,
  RotateCcw,
  UserX,
  ShieldOff,
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
import { Button } from "@/components/ui/button"
import { TableEmptyState } from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge"
import { USER_ACTION_TYPE } from "@/features/users/types"
import type { UserRole, UserActionType } from "@/features/users/types"
import { formatLastLogin, formatDate, getInitials } from "@/lib/formatters"
import {
  getUserActionVisibility,
  getUserListColumnVisibility,
} from "@/features/users/utils"

const COL_NAME = "w-[200px] shrink-0"
const COL_NARROW = "w-[136px] shrink-0"
const ROW_H = "h-[52px]"

type SortState = { key: UserSortKey | null; dir: UserSortOrder }

type UserTableProps = {
  users: UserListItem[]
  isLoading: boolean
  sort: SortState
  onSort: (key: UserSortKey) => void
  onAction?: (type: UserActionType, user: UserListItem) => void
  onRowClick?: (user: UserListItem) => void
  viewerRole?: UserRole
  currentUserId?: string
  hasActiveFilters?: boolean
}

type SortableHeaderProps = {
  columnKey: UserSortKey
  sort: SortState
  onSort: (key: UserSortKey) => void
  children: ReactNode
}

function SortableHeader({
  columnKey,
  sort,
  onSort,
  children,
}: SortableHeaderProps) {
  return (
    <Button
      variant="ghost"
      data-testid={`sort-${columnKey}`}
      onClick={() => onSort(columnKey)}
      className="h-auto gap-0.5 px-0 py-0 text-foreground hover:bg-transparent hover:text-foreground/70"
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
    </Button>
  )
}

type KebabMenuProps = {
  user: UserListItem
  viewerRole: UserRole | undefined
  onAction?: (type: UserActionType) => void
  isSelf: boolean
}

function KebabMenu({ user, viewerRole, onAction, isSelf }: KebabMenuProps) {
  const { t } = useTranslation("users")

  const {
    canApprove: approveVisible,
    canResendInvitation: resendVisible,
    canSuspend: suspendVisible,
    canReactivate: reactivateVisible,
    canDeactivate: deactivateVisible,
    canResetMfa: resetMfaVisible,
    hasAnyAction: hasActions,
  } = getUserActionVisibility(user.status, user.role, viewerRole)

  if (!hasActions || isSelf) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        disabled
        className="text-muted-foreground/30 disabled:opacity-100"
      >
        <MoreHorizontal size={16} />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid={`user-row-menu-${user.id}`}
        aria-label="Actions"
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreHorizontal size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {approveVisible && (
          <DropdownMenuItem
            data-testid="user-action-approve"
            onClick={() => onAction?.(USER_ACTION_TYPE.APPROVE)}
          >
            <UserCheck size={14} className="text-muted-foreground" />
            {t("table.actions.approve")}
          </DropdownMenuItem>
        )}
        {resendVisible && (
          <DropdownMenuItem
            data-testid="user-action-resend-invitation"
            onClick={() => onAction?.(USER_ACTION_TYPE.RESEND_INVITATION)}
          >
            <Mail size={14} className="text-muted-foreground" />
            {t("actions.resend-invitation.label")}
          </DropdownMenuItem>
        )}
        {suspendVisible && (
          <DropdownMenuItem
            data-testid="user-action-suspend"
            onClick={() => onAction?.(USER_ACTION_TYPE.SUSPEND)}
          >
            <Ban size={14} className="text-muted-foreground" />
            {t("actions.suspend.label")}
          </DropdownMenuItem>
        )}
        {reactivateVisible && (
          <DropdownMenuItem
            data-testid="user-action-reactivate"
            onClick={() => onAction?.(USER_ACTION_TYPE.REACTIVATE)}
          >
            <RotateCcw size={14} className="text-muted-foreground" />
            {t("actions.reactivate.label")}
          </DropdownMenuItem>
        )}
        {deactivateVisible && (
          <DropdownMenuItem
            data-testid="user-action-deactivate"
            onClick={() => onAction?.(USER_ACTION_TYPE.DEACTIVATE)}
            variant="destructive"
          >
            <UserX size={14} />
            {t("actions.deactivate.label")}
          </DropdownMenuItem>
        )}
        {resetMfaVisible && (
          <DropdownMenuItem
            data-testid="user-action-reset-mfa"
            onClick={() => onAction?.(USER_ACTION_TYPE.RESET_MFA)}
          >
            <ShieldOff size={14} className="text-muted-foreground" />
            {t("actions.resetMfa.label")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SKELETON_ROW_COUNT = 5
const SKELETON_ROWS = Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => i)

function UserTable({
  users,
  isLoading,
  sort,
  onSort,
  onAction,
  onRowClick,
  viewerRole,
  currentUserId,
  hasActiveFilters = false,
}: UserTableProps) {
  const { t } = useTranslation("users")
  const cols = getUserListColumnVisibility(viewerRole)

  return (
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="user-table"
    >
      {/* NOTE: raw flex div-grid instead of shadcn Table/TableRow/TableCell — this
          is a pre-existing, codebase-wide convention shared by every table component
          (TenantTable, PartnerTable, FrameworkAgreementTable, AuditTable), not
          something introduced here. Converting only this table would diverge from
          the established pattern; a full migration is a separate, cross-feature effort. */}
      {/* Header row */}
      <div className="flex border-b border-border h-10 items-center">
        <div className="flex-1 min-w-0 px-2">
          <SortableHeader columnKey="name" sort={sort} onSort={onSort}>
            {t("table.columns.user")}
          </SortableHeader>
        </div>
        <div className={`${COL_NAME} px-2`}>
          <SortableHeader columnKey="role" sort={sort} onSort={onSort}>
            {t("table.columns.role")}
          </SortableHeader>
        </div>
        {cols.tenant && (
          <div className={`${COL_NAME} px-2`}>
            <SortableHeader columnKey="tenant_name" sort={sort} onSort={onSort}>
              {t("table.columns.tenant")}
            </SortableHeader>
          </div>
        )}
        {cols.mfa && (
          <div
            className={`${COL_NARROW} px-2 text-sm font-medium text-foreground`}
          >
            {t("table.columns.mfa")}
          </div>
        )}
        <div className={`${COL_NARROW} px-2`}>
          <SortableHeader columnKey="status" sort={sort} onSort={onSort}>
            {t("table.columns.status")}
          </SortableHeader>
        </div>
        {cols.lastLogin && (
          <div className={`${COL_NARROW} px-2`}>
            <SortableHeader columnKey="last_login" sort={sort} onSort={onSort}>
              {t("table.columns.lastLogin")}
            </SortableHeader>
          </div>
        )}
        {cols.accessExpiry && (
          <div className={`${COL_NARROW} px-2`}>
            <SortableHeader
              columnKey="access_valid_until"
              sort={sort}
              onSort={onSort}
            >
              {t("table.columns.accessExpiry")}
            </SortableHeader>
          </div>
        )}
        <div className="shrink-0 w-8" />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-0" data-testid="user-table-loading">
          {SKELETON_ROWS.map(i => (
            <div
              key={i}
              className={`flex border-b border-border ${ROW_H} items-center`}
            >
              <div className="flex-1 min-w-0 p-2 flex items-center gap-2">
                <div className="bg-muted rounded-full size-8 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="bg-muted rounded h-3.5 animate-pulse w-32" />
                  <div className="bg-muted rounded h-3 animate-pulse w-44" />
                </div>
              </div>
              <div className={`${COL_NAME} p-2`}>
                <div className="bg-muted rounded h-5 animate-pulse w-24" />
              </div>
              {cols.tenant && (
                <div className={`${COL_NAME} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-20" />
                </div>
              )}
              {cols.mfa && (
                <div className={`${COL_NARROW} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-12" />
                </div>
              )}
              <div className={`${COL_NARROW} p-2`}>
                <div className="bg-muted rounded h-5 animate-pulse w-16" />
              </div>
              {cols.lastLogin && (
                <div className={`${COL_NARROW} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-20" />
                </div>
              )}
              {cols.accessExpiry && (
                <div className={`${COL_NARROW} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-20" />
                </div>
              )}
              <div className="shrink-0 w-8" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading &&
        users.length === 0 &&
        (hasActiveFilters ? (
          <TableEmptyState
            title={t("table.emptyFiltered.title")}
            description={t("table.emptyFiltered.description")}
          />
        ) : (
          <TableEmptyState
            title={t("table.emptyState.title")}
            description={t("table.emptyState.description")}
          />
        ))}

      {/* Data rows */}
      {!isLoading &&
        users.map(user => (
          <div
            key={user.id}
            data-testid={`user-row-${user.id}`}
            className={`flex border-b border-border ${ROW_H} items-center hover:bg-muted transition-colors cursor-pointer`}
            onClick={() => onRowClick?.(user)}
          >
            {/* User cell */}
            <div className="flex-1 min-w-0 p-2 flex items-center gap-2">
              <div className="size-8 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center overflow-hidden">
                {user.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground text-center leading-none">
                    {getInitials(user.first_name, user.last_name)}
                  </span>
                )}
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
            <div className={`${COL_NAME} p-2`}>
              <RoleBadge role={user.role} />
            </div>

            {/* Tenant cell */}
            {cols.tenant && (
              <div className={`${COL_NAME} p-2`}>
                <span className="text-sm text-foreground">
                  {user.tenant_name ?? "—"}
                </span>
              </div>
            )}

            {/* MFA cell */}
            {cols.mfa && (
              <div className={`${COL_NARROW} p-2`}>
                {user.mfa_enabled === true ? (
                  <span className="flex items-center gap-1.5 text-sm text-foreground">
                    <span className="size-2 rounded-full bg-green-500 shrink-0" />
                    {t("detail.page.values.on")}
                  </span>
                ) : user.mfa_enabled === false ? (
                  <span className="flex items-center gap-1.5 text-sm text-foreground">
                    <span className="size-2 rounded-full bg-red-500 shrink-0" />
                    {t("detail.page.values.off")}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            )}

            {/* Status cell */}
            <div className={`${COL_NARROW} p-2`}>
              <UserStatusBadge status={user.status} />
            </div>

            {/* Last login cell */}
            {cols.lastLogin && (
              <div className={`${COL_NARROW} p-2`}>
                <span className="text-sm text-muted-foreground">
                  {formatLastLogin(user.last_login, t)}
                </span>
              </div>
            )}

            {/* Access expiry cell */}
            {cols.accessExpiry && (
              <div className={`${COL_NARROW} p-2`}>
                <span className="text-sm text-muted-foreground">
                  {formatDate(user.access_valid_until)}
                </span>
              </div>
            )}

            {/* Actions cell */}
            <div
              className="shrink-0 p-2 flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <KebabMenu
                user={user}
                viewerRole={viewerRole}
                onAction={type => onAction?.(type, user)}
                isSelf={user.id === currentUserId}
              />
            </div>
          </div>
        ))}
    </div>
  )
}

export { UserTable }
