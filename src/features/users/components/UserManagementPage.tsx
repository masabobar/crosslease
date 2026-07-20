import { useState } from "react"
import { UserPlus, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react"
import { PaginationEllipsis } from "@/components/ui/pagination"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useResetUserMfa } from "@/features/users/hooks/useUserActions"
import { InviteUserModal } from "@/features/users/components/InviteUserModal"
import { UserActionModal } from "@/features/users/components/UserActionModal"
import { UserDetailDrawer } from "@/features/users/components/UserDetailDrawer"
import { UserTable } from "@/features/users/components/UserTable"
import { UserFilterPanel } from "@/features/users/components/UserFilterPanel"
import { UserQuickFilters } from "@/features/users/components/UserQuickFilters"
import { useUsers } from "@/features/users/hooks/useUsers"
import {
  useUserListParams,
  PAGE_SIZES,
} from "@/features/users/hooks/useUserListParams"
import type { PageSize } from "@/features/users/hooks/useUserListParams"
import type { UserStatus } from "@/features/users/api/schema"
import type { UserSortKey } from "@/features/users/api/schema"
import type { UserRole, UserFilterState } from "@/features/users/types"
import { useTenants } from "@/features/tenants/hooks/useTenants"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useExportUsers } from "@/features/users/hooks/useExportUsers"
import {
  AUDITOR_ROLE,
  EMPTY_FILTER_STATE,
  SYSTEM_ADMIN_ROLE,
} from "@/features/users/types"
import { formatDate } from "@/lib/formatters"
import { buildPageNumbers } from "@/lib/pagination"
import { getUserFilterVisibility } from "@/features/users/utils"
import { useUserManagementHandlers } from "@/features/users/hooks/useUserManagementHandlers"
import { FilterPill } from "@/components/ui/filter-pill"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ApiError } from "@/lib/api"
import { toast } from "sonner"

type ResetMfaConfirmDialogProps = {
  user: { id: string; first_name: string; last_name: string }
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

function ResetMfaConfirmDialog({
  user,
  isPending,
  onClose,
  onConfirm,
}: ResetMfaConfirmDialogProps) {
  const { t } = useTranslation("users")
  const name = `${user.first_name} ${user.last_name}`

  return (
    <Dialog
      open
      onOpenChange={o => {
        if (!o) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[420px] gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle>{t("actions.resetMfa.title", { name })}</DialogTitle>
        </DialogHeader>
        <div className="px-4 py-4">
          <div className="flex items-start gap-2 rounded-[10px] border border-amber-600 bg-amber-500/10 px-[10px] py-2">
            <ShieldAlert size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <span className="text-sm text-amber-600/80">
              {t("actions.resetMfa.description", { name })}
            </span>
          </div>
        </div>
        <DialogFooter className="mx-0 mb-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-testid="mfa-reset-cancel"
          >
            {t("modal.actions.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="mfa-reset-confirm"
          >
            {t("actions.resetMfa.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function UserManagementPage() {
  const { t } = useTranslation("users")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const {
    selectedUserId,
    setSelectedUserId,
    activeAction,
    setActiveAction,
    resetMfaUser,
    setResetMfaUser,
    handleAction,
    handleDrawerAction,
    handleActionSuccess,
    handleResetMfaSuccess,
    handleInviteSuccess,
  } = useUserManagementHandlers()
  const resetMfaMutation = useResetUserMfa()
  const {
    page,
    perPage,
    search,
    appliedFilters,
    sortKey,
    sortOrder,
    setPage,
    setPerPage,
    setSearch,
    setAppliedFilters,
    setSort,
  } = useUserListParams()
  const { data: currentUser, isError: isCurrentUserError } = useCurrentUser()
  const { data: tenantsData } = useTenants(
    getUserFilterVisibility(currentUser?.role).tenant
  )
  const canInvite = currentUser?.role === SYSTEM_ADMIN_ROLE
  const canExport =
    currentUser?.role === SYSTEM_ADMIN_ROLE ||
    currentUser?.role === AUDITOR_ROLE
  const { startExport, isExporting } = useExportUsers()

  const { data, isLoading, isError } = useUsers({
    page,
    per_page: perPage,
    search: search || undefined,
    role: appliedFilters.role.length > 0 ? appliedFilters.role : undefined,
    status:
      appliedFilters.status.length > 0 ? appliedFilters.status : undefined,
    tenant_id: appliedFilters.tenant_id ?? undefined,
    sort_by: sortKey ?? undefined,
    sort_order: sortKey ? sortOrder : undefined,
    last_login_from: appliedFilters.last_login_from ?? undefined,
    last_login_to: appliedFilters.last_login_to ?? undefined,
  })

  function handleSort(key: UserSortKey) {
    if (sortKey === key) {
      setSort(key, sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSort(key, "asc")
    }
  }

  function handleApplyFilters(filters: UserFilterState) {
    setAppliedFilters(filters)
  }

  function removeRoleFilter(role: UserRole) {
    setAppliedFilters({
      ...appliedFilters,
      role: appliedFilters.role.filter((r: UserRole) => r !== role),
    })
  }

  function removeStatusFilter(status: string) {
    setAppliedFilters({
      ...appliedFilters,
      status: appliedFilters.status.filter((s: string) => s !== status),
    })
  }

  const filterVis = getUserFilterVisibility(currentUser?.role)
  const pageNumbers = data ? buildPageNumbers(page, data.total_pages) : []
  const activeFilterCount =
    appliedFilters.role.length +
    appliedFilters.status.length +
    (filterVis.tenant && appliedFilters.tenant_id ? 1 : 0) +
    (filterVis.mfa && appliedFilters.mfa_enabled ? 1 : 0) +
    (filterVis.lastLogin &&
    (appliedFilters.last_login_from || appliedFilters.last_login_to)
      ? 1
      : 0)

  return (
    <div className="p-8" data-testid="user-management-page">
      {isCurrentUserError && (
        <Alert
          variant="destructive"
          className="mb-4"
          data-testid="current-user-error-banner"
        >
          <AlertDescription>{t("page.currentUserLoadError")}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("page.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("page.subtitle")}
          </p>
        </div>
        {canInvite && (
          <Button
            size="lg"
            data-testid="invite-user-button"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={16} />
            {t("page.inviteButton")}
          </Button>
        )}
      </div>

      {/* Quick filter row */}
      <UserQuickFilters
        className="mt-6"
        search={search}
        onSearchChange={setSearch}
        appliedFilters={appliedFilters}
        filterVisibility={filterVis}
        onFilterChange={update =>
          setAppliedFilters({ ...appliedFilters, ...update })
        }
        onOpenAdvanced={() => setIsFilterOpen(true)}
        onExport={
          canExport
            ? format =>
                void startExport({
                  format,
                  search: search || undefined,
                  role:
                    appliedFilters.role.length > 0
                      ? appliedFilters.role
                      : undefined,
                  status:
                    appliedFilters.status.length > 0
                      ? appliedFilters.status
                      : undefined,
                  tenant_id: appliedFilters.tenant_id ?? undefined,
                  last_login_from: appliedFilters.last_login_from,
                  last_login_to: appliedFilters.last_login_to,
                })
            : undefined
        }
        isExporting={isExporting}
      />

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground shrink-0">
            {t("page.filters.label")}
          </span>

          {appliedFilters.role.map((role: UserRole) => (
            <FilterPill
              key={`role-${role}`}
              label={t("page.filters.rolePill", {
                value: t(`roles.${role}` as `roles.${UserRole}`),
              })}
              onRemove={() => removeRoleFilter(role)}
              data-testid={`filter-pill-remove-role-${role}`}
            />
          ))}

          {filterVis.tenant && appliedFilters.tenant_id && (
            <FilterPill
              label={t("page.filters.tenantPill", {
                value:
                  tenantsData?.tenants.find(
                    ten => ten.id === appliedFilters.tenant_id
                  )?.name ?? appliedFilters.tenant_id,
              })}
              onRemove={() =>
                setAppliedFilters({ ...appliedFilters, tenant_id: null })
              }
              data-testid="filter-pill-remove-tenant"
            />
          )}

          {filterVis.mfa && appliedFilters.mfa_enabled && (
            <FilterPill
              label={t("page.filters.mfaPill", {
                value: t(
                  `filter.mfa.${appliedFilters.mfa_enabled}` as
                    | "filter.mfa.enabled"
                    | "filter.mfa.disabled"
                ),
              })}
              onRemove={() =>
                setAppliedFilters({ ...appliedFilters, mfa_enabled: null })
              }
              data-testid="filter-pill-remove-mfa"
            />
          )}

          {appliedFilters.status.map(status => (
            <FilterPill
              key={`status-${status}`}
              label={t("page.filters.statusPill", {
                value: t(`statuses.${status}` as `statuses.${UserStatus}`),
              })}
              onRemove={() => removeStatusFilter(status)}
              data-testid={`filter-pill-remove-status-${status}`}
            />
          ))}

          {filterVis.lastLogin &&
            (appliedFilters.last_login_from ||
              appliedFilters.last_login_to) && (
              <FilterPill
                label={t("page.filters.lastLoginRangePill", {
                  range: [
                    appliedFilters.last_login_from
                      ? formatDate(appliedFilters.last_login_from)
                      : null,
                    appliedFilters.last_login_from &&
                    appliedFilters.last_login_to
                      ? "–"
                      : null,
                    appliedFilters.last_login_to
                      ? formatDate(appliedFilters.last_login_to)
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" "),
                })}
                onRemove={() =>
                  setAppliedFilters({
                    ...appliedFilters,
                    last_login_from: null,
                    last_login_to: null,
                  })
                }
                data-testid="filter-pill-remove-last-login"
              />
            )}

          <Button
            type="button"
            variant="ghost"
            data-testid="filters-clear-all"
            onClick={() => setAppliedFilters(EMPTY_FILTER_STATE)}
            className="h-auto px-2 py-0 text-xs font-normal text-destructive hover:text-destructive hover:bg-transparent hover:opacity-80 transition-opacity"
          >
            {t("page.filters.clearAll")}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4">
        {isError && !isLoading && (
          <p
            className="py-12 text-center text-sm text-muted-foreground"
            data-testid="users-load-error"
          >
            {t("page.loadError")}
          </p>
        )}
        {!isError && (
          <UserTable
            users={data?.users ?? []}
            isLoading={isLoading}
            sort={{ key: sortKey, dir: sortOrder }}
            onSort={handleSort}
            onAction={handleAction}
            onRowClick={user => setSelectedUserId(user.id)}
            viewerRole={currentUser?.role}
            currentUserId={currentUser?.id}
            hasActiveFilters={
              search.length > 0 ||
              appliedFilters.role.length > 0 ||
              appliedFilters.status.length > 0 ||
              !!appliedFilters.tenant_id ||
              !!appliedFilters.last_login_from ||
              !!appliedFilters.last_login_to
            }
          />
        )}
      </div>

      {/* Pagination — always visible when data is present */}
      {data && (
        <div className="mt-4 flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("page.pagination.rowsPerPage")}
            </span>
            <Select
              value={String(perPage)}
              onValueChange={v => setPerPage(Number(v) as PageSize)}
            >
              <SelectTrigger
                data-testid="pagination-page-size-select"
                className="h-8 rounded-xl px-2 text-xs w-auto gap-1"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              data-testid="pagination-prev-button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-8 gap-1.5 rounded-xl pl-1.5 pr-2.5 text-sm"
            >
              <ChevronLeft size={16} />
              {t("page.pagination.previous")}
            </Button>

            {pageNumbers.map((item, idx) =>
              item === "..." ? (
                <PaginationEllipsis key={`ellipsis-${idx}`} />
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "outline" : "ghost"}
                  data-testid={`pagination-page-${item}`}
                  onClick={() => setPage(item)}
                  className="size-8 rounded-xl p-0 text-sm"
                >
                  {item}
                </Button>
              )
            )}

            <Button
              variant="ghost"
              data-testid="pagination-next-button"
              onClick={() => setPage(Math.min(data.total_pages, page + 1))}
              disabled={page === data.total_pages}
              className="h-8 gap-1.5 rounded-xl pl-2.5 pr-1.5 text-sm"
            >
              {t("page.pagination.next")}
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      <UserDetailDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onAction={(type, user) => void handleDrawerAction(type, user)}
        viewerRole={currentUser?.role}
        currentUserId={currentUser?.id}
      />

      {canInvite && (
        <InviteUserModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      {activeAction && (
        <UserActionModal
          action={activeAction.type}
          user={activeAction.user}
          onClose={() => setActiveAction(null)}
          onSuccess={handleActionSuccess}
        />
      )}

      {resetMfaUser && (
        <ResetMfaConfirmDialog
          user={resetMfaUser}
          isPending={resetMfaMutation.isPending}
          onClose={() => setResetMfaUser(null)}
          onConfirm={() => {
            resetMfaMutation.mutate(resetMfaUser.id, {
              onSuccess: handleResetMfaSuccess,
              onError: (err: unknown) => {
                toast.error(
                  err instanceof ApiError
                    ? t(`errors.${err.code}`, {
                        defaultValue: t("errors.generic"),
                      })
                    : t("errors.generic")
                )
              },
            })
          }}
        />
      )}

      {isFilterOpen && (
        <UserFilterPanel
          onClose={() => setIsFilterOpen(false)}
          appliedFilters={appliedFilters}
          onApply={handleApplyFilters}
          viewerRole={currentUser?.role}
        />
      )}
    </div>
  )
}
