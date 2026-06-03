import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserPlus, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { InviteUserModal } from "@/features/users/components/InviteUserModal"
import { UserActionModal } from "@/features/users/components/UserActionModal"
import { UserDetailDrawer } from "@/features/users/components/UserDetailDrawer"
import { UserTable } from "@/features/users/components/UserTable"
import { UserFilterPanel } from "@/features/users/components/UserFilterPanel"
import { UserQuickFilters } from "@/features/users/components/UserQuickFilters"
import { useUsers } from "@/features/users/hooks/useUsers"
import { useUserListParams } from "@/features/users/hooks/useUserListParams"
import type {
  UserStatus,
  UserListItem,
  UserDetail,
} from "@/features/users/api/schema"
import type {
  UserRole,
  UserFilterState,
  UserActionType,
  UserModalActionType,
} from "@/features/users/types"
import type { UserSortKey } from "@/features/users/api/schema"
import { UserStatusSchema } from "@/features/users/api/schema"
import type { InviteSuccessResult } from "@/features/users/components/InviteUserModal"
import { useTenants } from "@/features/tenants/hooks/useTenants"
import { useToastStore } from "@/store/toastStore"
import { useApproveWithToast } from "@/features/users/hooks/useApproveWithToast"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { EMPTY_FILTER_STATE, SYSTEM_ADMIN_ROLE } from "@/features/users/types"
import {
  getUserFilterVisibility,
  formatDate,
  buildActionToastPayload,
} from "@/features/users/utils"
import { adminUserDetail } from "@/router/paths"

const USERS_PAGE_SIZE = 10
const MAX_VISIBLE_PAGE_NUMBERS = 5

function buildPageNumbers(
  currentPage: number,
  totalPages: number
): Array<number | "..."> {
  if (totalPages <= MAX_VISIBLE_PAGE_NUMBERS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, totalPages, currentPage])
  if (currentPage > 1) pages.add(currentPage - 1)
  if (currentPage < totalPages) pages.add(currentPage + 1)

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: Array<number | "..."> = []

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("...")
    }
    result.push(sorted[i])
  }

  return result
}

export default function UserManagementPage() {
  const navigate = useNavigate()
  const { t } = useTranslation("users")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<{
    type: UserModalActionType
    user: { id: string; first_name: string; last_name: string }
  } | null>(null)
  const {
    page,
    search,
    appliedFilters,
    sortKey,
    sortOrder,
    setPage,
    setSearch,
    setAppliedFilters,
    setSort,
  } = useUserListParams()
  const showToast = useToastStore(s => s.showToast)
  const { data: tenantsData } = useTenants()
  const { handleApprove } = useApproveWithToast()
  const { data: currentUser } = useCurrentUser()
  const canInvite = currentUser?.role === SYSTEM_ADMIN_ROLE

  const { data, isLoading } = useUsers({
    page,
    per_page: USERS_PAGE_SIZE,
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

  async function handleAction(type: UserActionType, user: UserListItem) {
    if (type === "approve") {
      await handleApprove(user.id)
      return
    }
    setActiveAction({
      type,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    })
  }

  async function handleDrawerAction(type: UserActionType, user: UserDetail) {
    setSelectedUserId(null)
    if (type === "approve") {
      await handleApprove(user.id)
      return
    }
    setActiveAction({
      type,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    })
  }

  function handleActionSuccess() {
    if (!activeAction) return
    const name = `${activeAction.user.first_name} ${activeAction.user.last_name}`
    showToast(buildActionToastPayload(activeAction.type, name, t))
    setActiveAction(null)
  }

  function handleInviteSuccess(result: InviteSuccessResult) {
    if (result.type === UserStatusSchema.enum.pending_approval) {
      const name = `${result.firstName} ${result.lastName}`
      showToast({
        variant: "warning",
        title: t("inviteBanner.pendingApproval.title"),
        message: t("inviteBanner.pendingApproval.message", { name }),
        actionLabel: result.subjectId
          ? t("inviteBanner.pendingApproval.viewProfile")
          : undefined,
        onAction: result.subjectId
          ? () => navigate(adminUserDetail(result.subjectId!))
          : undefined,
      })
    } else {
      const name = `${result.user.first_name} ${result.user.last_name}`
      showToast({
        variant: "success",
        title: t("inviteBanner.invited.title"),
        message: t("inviteBanner.invited.message", {
          name,
          email: result.user.email,
        }),
        actionLabel: t("inviteBanner.invited.viewProfile"),
        onAction: () => navigate(adminUserDetail(result.user.id)),
      })
    }
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
      />

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground shrink-0">
            {t("page.filters.label")}
          </span>

          {appliedFilters.role.map((role: UserRole) => (
            <span
              key={`role-${role}`}
              className="inline-flex items-center gap-0.5 h-[18px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium leading-none shrink-0"
            >
              {t("page.filters.rolePill", {
                value: t(`roles.${role}` as `roles.${UserRole}`),
              })}
              <button
                type="button"
                data-testid={`filter-pill-remove-role-${role}`}
                onClick={() => removeRoleFilter(role)}
                className="ml-0.5 flex items-center opacity-80 hover:opacity-100 transition-opacity"
                aria-label={`Remove role ${role} filter`}
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </span>
          ))}

          {filterVis.tenant && appliedFilters.tenant_id && (
            <span className="inline-flex items-center gap-0.5 h-[18px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium leading-none shrink-0">
              {t("page.filters.tenantPill", {
                value:
                  tenantsData?.tenants.find(
                    ten => ten.id === appliedFilters.tenant_id
                  )?.name ?? appliedFilters.tenant_id,
              })}
              <button
                type="button"
                data-testid="filter-pill-remove-tenant"
                onClick={() =>
                  setAppliedFilters({ ...appliedFilters, tenant_id: null })
                }
                className="ml-0.5 flex items-center opacity-80 hover:opacity-100 transition-opacity"
                aria-label="Remove tenant filter"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </span>
          )}

          {filterVis.mfa && appliedFilters.mfa_enabled && (
            <span className="inline-flex items-center gap-0.5 h-[18px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium leading-none shrink-0">
              {t("page.filters.mfaPill", {
                value: t(
                  `filter.mfa.${appliedFilters.mfa_enabled}` as
                    | "filter.mfa.enabled"
                    | "filter.mfa.disabled"
                ),
              })}
              <button
                type="button"
                data-testid="filter-pill-remove-mfa"
                onClick={() =>
                  setAppliedFilters({ ...appliedFilters, mfa_enabled: null })
                }
                className="ml-0.5 flex items-center opacity-80 hover:opacity-100 transition-opacity"
                aria-label="Remove MFA filter"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </span>
          )}

          {appliedFilters.status.map(status => (
            <span
              key={`status-${status}`}
              className="inline-flex items-center gap-0.5 h-[18px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium leading-none shrink-0"
            >
              {t("page.filters.statusPill", {
                value: t(`statuses.${status}` as `statuses.${UserStatus}`),
              })}
              <button
                type="button"
                data-testid={`filter-pill-remove-status-${status}`}
                onClick={() => removeStatusFilter(status)}
                className="ml-0.5 flex items-center opacity-80 hover:opacity-100 transition-opacity"
                aria-label={`Remove status ${status} filter`}
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </span>
          ))}

          {filterVis.lastLogin &&
            (appliedFilters.last_login_from ||
              appliedFilters.last_login_to) && (
              <span className="inline-flex items-center gap-0.5 h-[18px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium leading-none shrink-0">
                {t("page.filters.lastLoginRangePill", {
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
                <button
                  type="button"
                  data-testid="filter-pill-remove-last-login"
                  onClick={() =>
                    setAppliedFilters({
                      ...appliedFilters,
                      last_login_from: null,
                      last_login_to: null,
                    })
                  }
                  className="ml-0.5 flex items-center opacity-80 hover:opacity-100 transition-opacity"
                  aria-label="Remove last login filter"
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              </span>
            )}

          <button
            type="button"
            data-testid="filters-clear-all"
            onClick={() => setAppliedFilters(EMPTY_FILTER_STATE)}
            className="px-2 text-xs font-medium text-destructive hover:opacity-80 transition-opacity"
          >
            {t("page.filters.clearAll")}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="mt-4">
        <UserTable
          users={data?.users ?? []}
          isLoading={isLoading}
          sort={{ key: sortKey, dir: sortOrder }}
          onSort={handleSort}
          onAction={handleAction}
          onRowClick={user => setSelectedUserId(user.id)}
          viewerRole={currentUser?.role}
        />
      </div>

      {/* Pagination — always visible when data is present */}
      {data && (
        <div className="mt-4 flex justify-end items-center gap-1">
          <button
            type="button"
            data-testid="pagination-prev-button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-xl px-3 h-8 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
            {t("page.pagination.previous")}
          </button>

          {pageNumbers.map((item, idx) =>
            item === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-sm text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                data-testid={`pagination-page-${item}`}
                onClick={() => setPage(item)}
                className={
                  item === page
                    ? "border border-border rounded-xl w-8 h-8 text-sm font-medium"
                    : "rounded-xl px-3 h-8 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                }
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            data-testid="pagination-next-button"
            onClick={() => setPage(Math.min(data.total_pages, page + 1))}
            disabled={page === data.total_pages}
            className="rounded-xl px-3 h-8 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("page.pagination.next")}
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <UserDetailDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onAction={(type, user) => void handleDrawerAction(type, user)}
        viewerRole={currentUser?.role}
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
