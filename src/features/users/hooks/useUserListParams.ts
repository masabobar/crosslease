import { useSearchParams } from "react-router-dom"
import { USER_ROLES } from "@/features/users/types"
import type { UserRole, UserFilterState } from "@/features/users/types"
import { USER_STATUSES, USER_SORT_KEYS } from "@/features/users/api/schema"
import type {
  UserStatus,
  UserSortKey,
  UserSortOrder,
} from "@/features/users/api/schema"

const VALID_SORT_KEYS: readonly string[] = USER_SORT_KEYS

const VALID_STATUSES: readonly string[] = USER_STATUSES

export const PAGE_SIZES = [10, 25, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]

const DEFAULT_PAGE_SIZE: PageSize = PAGE_SIZES[0]
const DEFAULT_PAGE = 1
const DESCENDING: UserSortOrder = "desc"
const ASCENDING: UserSortOrder = "asc"

type ParamUpdate = Record<string, string | readonly string[] | null>

export type UserListParams = {
  page: number
  perPage: PageSize
  search: string
  appliedFilters: UserFilterState
  sortKey: UserSortKey | null
  sortOrder: UserSortOrder
  setPage: (page: number) => void
  setPerPage: (size: PageSize) => void
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

  const page = Math.max(
    DEFAULT_PAGE,
    Number(params.get("page") ?? String(DEFAULT_PAGE)) || DEFAULT_PAGE
  )
  const rawPerPage = Number(params.get("per_page") ?? String(DEFAULT_PAGE_SIZE))
  const perPage: PageSize = (PAGE_SIZES as readonly number[]).includes(
    rawPerPage
  )
    ? (rawPerPage as PageSize)
    : DEFAULT_PAGE_SIZE
  const search = params.get("q") ?? ""

  const rawRoles = params.getAll("role")
  const rawStatuses = params.getAll("status")
  const appliedFilters: UserFilterState = {
    role: rawRoles.filter((v): v is UserRole =>
      USER_ROLES.includes(v as UserRole)
    ),
    status: rawStatuses.filter((v): v is UserStatus =>
      VALID_STATUSES.includes(v as UserStatus)
    ),
    tenant_id: params.get("tenant_id"),
    last_login_from: params.get("last_login_from"),
    last_login_to: params.get("last_login_to"),
  }

  const rawSortKey = params.get("sort_by")
  const sortKey: UserSortKey | null =
    rawSortKey !== null && VALID_SORT_KEYS.includes(rawSortKey)
      ? (rawSortKey as UserSortKey)
      : null
  const sortOrder: UserSortOrder =
    params.get("sort_order") === DESCENDING ? DESCENDING : ASCENDING

  function setPage(p: number) {
    update({ page: p === DEFAULT_PAGE ? null : String(p) })
  }

  function setPerPage(size: PageSize) {
    update({
      per_page: size === DEFAULT_PAGE_SIZE ? null : String(size),
      page: null,
    })
  }

  function setSearch(q: string) {
    update({ q: q || null, page: null })
  }

  function setAppliedFilters(filters: UserFilterState) {
    update({
      role: filters.role,
      status: filters.status,
      tenant_id: filters.tenant_id,
      last_login_from: filters.last_login_from,
      last_login_to: filters.last_login_to,
      page: null,
    })
  }

  function setSort(key: UserSortKey, order: UserSortOrder) {
    update({
      sort_by: key,
      sort_order: order === ASCENDING ? null : order,
      page: null,
    })
  }

  function clearSort() {
    update({ sort_by: null, sort_order: null })
  }

  return {
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
    clearSort,
  }
}
