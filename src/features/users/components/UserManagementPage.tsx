import { useState } from "react"
import {
  UserPlus,
  Search,
  Filter,
  FileDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InviteUserModal } from "@/features/users/components/InviteUserModal"
import { UserActionModal } from "@/features/users/components/UserActionModal"
import { UserDetailDrawer } from "@/features/users/components/UserDetailDrawer"
import { UserTable } from "@/features/users/components/UserTable"
import { UserFilterPanel } from "@/features/users/components/UserFilterPanel"
import { useUsers } from "@/features/users/hooks/useUsers"
import { useUserListParams } from "@/features/users/hooks/useUserListParams"
import type {
  UserResponse,
  UserStatus,
  UserListItem,
} from "@/features/users/api/schema"
import type { UserDetail } from "@/features/users/api/schema"
import type {
  UserRole,
  UserFilterState,
  UserActionType,
  UserModalActionType,
} from "@/features/users/types"
import type { UserSortKey } from "@/features/users/api/schema"
import { useTenants } from "@/features/tenants/hooks/useTenants"
import { useToastStore } from "@/store/toastStore"
import { useApproveUser } from "@/features/users/hooks/useApproveUser"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { READ_ONLY_VIEWER_ROLES } from "@/features/users/types"
import { ApiError } from "@/lib/api"

function buildPageNumbers(
  currentPage: number,
  totalPages: number
): Array<number | "..."> {
  if (totalPages <= 5) {
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

type FilterPillProps = {
  label: string
  onRemove: () => void
}

function FilterPill({ label, onRemove }: FilterPillProps) {
  return (
    <span className="inline-flex items-center gap-[3px] pl-[8px] pr-[6px] py-[3px] rounded-full bg-[#0284c7] text-[12px] font-medium text-white leading-none shrink-0">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="p-0 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
        aria-label={`Remove ${label} filter`}
      >
        <X size={11} strokeWidth={2.5} />
      </button>
    </span>
  )
}

export default function UserManagementPage() {
  const { t } = useTranslation("users")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<{
    type: UserModalActionType
    user: { id: string; first_name: string; last_name: string }
  } | null>(null)
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null)
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
  const { mutateAsync: approve } = useApproveUser()
  const { data: currentUser } = useCurrentUser()
  const isReadOnlyViewer = currentUser
    ? READ_ONLY_VIEWER_ROLES.includes(currentUser.role)
    : false

  const { data, isLoading } = useUsers({
    page,
    per_page: 10,
    search: search || undefined,
    role:
      appliedFilters.role.length > 0
        ? (appliedFilters.role as UserRole[])
        : undefined,
    status:
      appliedFilters.status.length > 0
        ? (appliedFilters.status as UserStatus[])
        : undefined,
    tenant_id: appliedFilters.tenant_id ?? undefined,
    sort_by: sortKey ?? undefined,
    sort_order: sortKey ? sortOrder : undefined,
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
      try {
        const result = await approve(user.id)
        const name = `${result.user.first_name} ${result.user.last_name}`
        showToast({
          variant: "success",
          title: t("approveSuccess.title"),
          message: t("approveSuccess.message", {
            name,
            email: result.user.email,
          }),
        })
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : t("approveSuccess.errorFallback")
        showToast({
          variant: "warning",
          title: t("approveSuccess.errorTitle"),
          message,
        })
      }
    } else {
      setActiveAction({
        type,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      })
    }
  }

  function handleDrawerAction(type: UserModalActionType, user: UserDetail) {
    setDrawerUserId(null)
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
    const toastMap: Record<
      UserModalActionType,
      { variant: "success" | "warning"; title: string; message: string }
    > = {
      suspend: {
        variant: "warning",
        title: t("actions.suspend.success.title"),
        message: t("actions.suspend.success.message", { name }),
      },
      reactivate: {
        variant: "success",
        title: t("actions.reactivate.success.title"),
        message: t("actions.reactivate.success.message", { name }),
      },
      deactivate: {
        variant: "warning",
        title: t("actions.deactivate.success.title"),
        message: t("actions.deactivate.success.message", { name }),
      },
      "resend-invitation": {
        variant: "success",
        title: t("actions.resend-invitation.success.title"),
        message: t("actions.resend-invitation.success.message", { name }),
      },
    }
    showToast(toastMap[activeAction.type])
    setActiveAction(null)
  }

  function handleInviteSuccess(user: UserResponse) {
    const name = `${user.first_name} ${user.last_name}`
    const isPendingApproval = user.status === "pending_activation"

    showToast({
      variant: isPendingApproval ? "warning" : "success",
      title: isPendingApproval
        ? t("inviteBanner.pendingApproval.title")
        : t("inviteBanner.invited.title"),
      message: isPendingApproval
        ? t("inviteBanner.pendingApproval.message", { name })
        : t("inviteBanner.invited.message", { name, email: user.email }),
      actionLabel: isPendingApproval
        ? t("inviteBanner.pendingApproval.viewProfile")
        : t("inviteBanner.invited.viewProfile"),
    })
    setIsModalOpen(false)
  }

  const activeFilterCount =
    appliedFilters.role.length +
    appliedFilters.status.length +
    (appliedFilters.tenant_id ? 1 : 0)
  const pageNumbers = data ? buildPageNumbers(page, data.total_pages) : []

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
        {!isReadOnlyViewer && (
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

      {/* Toolbar */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <Input
            data-testid="user-search-input"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-[288px]"
            endAction={
              <Search
                size={16}
                className="text-muted-foreground pointer-events-none"
              />
            }
          />

          {/* Filter button — red dot when active */}
          <button
            type="button"
            data-testid="filter-button"
            onClick={() => setIsFilterOpen(true)}
            className="relative flex items-center justify-center border border-border rounded-[12px] p-[10px] text-muted-foreground hover:bg-muted transition-colors"
            aria-label={t("filter.label")}
          >
            <Filter size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-red-500" />
            )}
          </button>
        </div>

        <button
          type="button"
          data-testid="export-button"
          className="shrink-0 flex items-center gap-1.5 border border-border rounded-[12px] bg-background px-[10px] h-9 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <FileDown size={16} />
          Export
        </button>
      </div>

      {/* Active filter pills — second row */}
      {activeFilterCount > 0 && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground shrink-0">
            Filters:
          </span>
          {appliedFilters.role.map((role: UserRole) => (
            <FilterPill
              key={`role-${role}`}
              label={`Role: ${t(`roles.${role}` as `roles.${UserRole}`)}`}
              onRemove={() => removeRoleFilter(role)}
            />
          ))}
          {appliedFilters.status.map((status: string) => (
            <FilterPill
              key={`status-${status}`}
              label={`Status: ${t(`statuses.${status}` as `statuses.${UserStatus}`)}`}
              onRemove={() => removeStatusFilter(status)}
            />
          ))}
          {appliedFilters.tenant_id && (
            <FilterPill
              key="tenant"
              label={`Tenant: ${tenantsData?.tenants.find(ten => ten.id === appliedFilters.tenant_id)?.name ?? appliedFilters.tenant_id}`}
              onRemove={() =>
                setAppliedFilters({ ...appliedFilters, tenant_id: null })
              }
            />
          )}
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
          onRowClick={user => setDrawerUserId(user.id)}
          viewerRole={currentUser?.role}
        />
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="mt-4 flex justify-end items-center gap-1">
          <button
            type="button"
            data-testid="pagination-prev-button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-xl px-3 h-8 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
            Previous
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
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {!isReadOnlyViewer && (
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
        />
      )}

      <UserDetailDrawer
        userId={drawerUserId}
        onClose={() => setDrawerUserId(null)}
        onAction={handleDrawerAction}
      />
    </div>
  )
}
