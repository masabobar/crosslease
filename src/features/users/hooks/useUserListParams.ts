import { useSearchParams } from "react-router-dom"
import { USER_ROLES } from "@/features/users/types"
import type { UserRole, UserFilterState } from "@/features/users/types"
import { USER_STATUSES } from "@/features/users/api/schema"
import type {
  UserStatus,
  UserSortKey,
  UserSortOrder,
} from "@/features/users/api/schema"

const VALID_SORT_KEYS: readonly string[] = [
  "name",
  "role",
  "tenant_name",
  "status",
  "last_login",
  "access_valid_until",
]

const VALID_STATUSES: readonly string[] = USER_STATUSES

type ParamUpdate = Record<string, string | readonly string[] | null>

export type UserListParams = {
  page: number
  search: string
  appliedFilters: UserFilterState
  sortKey: UserSortKey | null
  sortOrder: UserSortOrder
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setAppliedFilters: (filters: UserFilterState) => void
  setSort: (key: UserSortKey, order: UserSortOrder) => void
  clearSort: () => void
}

export function useUserListParams(): UserListParams {
  const [params, setParams] = useSearchParams()

  function update(changes: ParamUpdate) {
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          next.delete(key)
          if (Array.isArray(value)) {
            ;(value as string[]).forEach(v => next.append(key, v))
          } else if (value !== null && value !== "") {
            next.set(key, value as string)
          }
        }
        return next
      },
      { replace: true }
    )
  }

  const page = Math.max(1, Number(params.get("page") ?? "1") || 1)
  const search = params.get("q") ?? ""

  const rawRoles = params.getAll("role")
  const rawStatuses = params.getAll("status")
  const rawMfa = params.get("mfa_enabled")
  const appliedFilters: UserFilterState = {
    role: rawRoles.filter((v): v is UserRole =>
      USER_ROLES.includes(v as UserRole)
    ),
    status: rawStatuses.filter((v): v is UserStatus =>
      VALID_STATUSES.includes(v as UserStatus)
    ),
    tenant_id: params.get("tenant_id"),
    // UI ready — not sent to API; persisted in URL for session continuity
    mfa_enabled: rawMfa === "enabled" || rawMfa === "disabled" ? rawMfa : null,
    lg_id: params.get("lg_id"),
    last_login_from: params.get("last_login_from"),
    last_login_to: params.get("last_login_to"),
  }

  const rawSortKey = params.get("sort_by")
  const sortKey: UserSortKey | null =
    rawSortKey !== null && VALID_SORT_KEYS.includes(rawSortKey)
      ? (rawSortKey as UserSortKey)
      : null
  const sortOrder: UserSortOrder =
    params.get("sort_order") === "desc" ? "desc" : "asc"

  function setPage(p: number) {
    update({ page: p === 1 ? null : String(p) })
  }

  function setSearch(q: string) {
    update({ q: q || null, page: null })
  }

  function setAppliedFilters(filters: UserFilterState) {
    update({
      role: filters.role,
      status: filters.status,
      tenant_id: filters.tenant_id,
      mfa_enabled: filters.mfa_enabled,
      lg_id: filters.lg_id,
      last_login_from: filters.last_login_from,
      last_login_to: filters.last_login_to,
      page: null,
    })
  }

  function setSort(key: UserSortKey, order: UserSortOrder) {
    update({
      sort_by: key,
      sort_order: order === "asc" ? null : order,
      page: null,
    })
  }

  function clearSort() {
    update({ sort_by: null, sort_order: null })
  }

  return {
    page,
    search,
    appliedFilters,
    sortKey,
    sortOrder,
    setPage,
    setSearch,
    setAppliedFilters,
    setSort,
    clearSort,
  }
}
