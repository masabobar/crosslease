import { useSearchParams } from "react-router-dom"
import {
  PartnerStatusSchema,
  PartnerRoleSchema,
  UboCompletenessStatusSchema,
} from "@/features/partners/api/schema"
import type {
  PartnerStatus,
  PartnerRole,
  UboCompletenessStatus,
} from "@/features/partners/api/schema"

export const PAGE_SIZES = [10, 25, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]

type ParamUpdate = Record<string, string | readonly string[] | null>

export function usePartnerListParams() {
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
  const rawPerPage = Number(params.get("per_page") ?? "10")
  const perPage: PageSize = (PAGE_SIZES as readonly number[]).includes(
    rawPerPage
  )
    ? (rawPerPage as PageSize)
    : 10
  const search = params.get("q") ?? ""
  const statusFilters = params
    .getAll("status")
    .filter((v): v is PartnerStatus =>
      PartnerStatusSchema.options.includes(v as PartnerStatus)
    )
  const roleFilters = params
    .getAll("role")
    .filter((v): v is PartnerRole =>
      PartnerRoleSchema.options.includes(v as PartnerRole)
    )
  const countryFilter = params.get("country")
  const uboFilters = params
    .getAll("ubo_status")
    .filter((v): v is UboCompletenessStatus =>
      UboCompletenessStatusSchema.options.includes(v as UboCompletenessStatus)
    )

  function setPage(p: number) {
    update({ page: p === 1 ? null : String(p) })
  }

  function setPerPage(size: PageSize) {
    update({ per_page: size === 10 ? null : String(size), page: null })
  }

  function setSearch(q: string) {
    update({ q: q || null, page: null })
  }

  function setStatusFilters(statuses: PartnerStatus[]) {
    update({ status: statuses, page: null })
  }

  function setRoleFilters(roles: PartnerRole[]) {
    update({ role: roles, page: null })
  }

  function setCountryFilter(country: string | null) {
    update({ country, page: null })
  }

  function setUboFilters(statuses: UboCompletenessStatus[]) {
    update({ ubo_status: statuses, page: null })
  }

  function clearAllFilters() {
    update({
      q: null,
      status: [] as readonly string[],
      role: [] as readonly string[],
      country: null,
      ubo_status: [] as readonly string[],
      page: null,
    })
  }

  return {
    page,
    perPage,
    search,
    statusFilters,
    roleFilters,
    countryFilter,
    uboFilters,
    setPage,
    setPerPage,
    setSearch,
    setStatusFilters,
    setRoleFilters,
    setCountryFilter,
    setUboFilters,
    clearAllFilters,
  }
}
