import { useSearchParams } from "react-router-dom"

export const PAGE_SIZES = [10, 25, 50] as const
export type PageSize = (typeof PAGE_SIZES)[number]
export const DEFAULT_PAGE_SIZE: PageSize = 25

// Same guard as the Workflow Task Catalog's list — short prefixes against an ILIKE scan are not
// worth a round trip.
export const MIN_SEARCH_LENGTH = 3

type ParamUpdate = Record<string, string | null>

type DocumentRequirementCatalogListParams = {
  page: number
  perPage: PageSize
  search: string
  hasActiveFilters: boolean
  setPage: (p: number) => void
  setPerPage: (size: PageSize) => void
  setSearch: (q: string) => void
}

export function useDocumentRequirementCatalogListParams(): DocumentRequirementCatalogListParams {
  const [params, setParams] = useSearchParams()

  function update(changes: ParamUpdate) {
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === "") {
            next.delete(key)
          } else {
            next.set(key, value)
          }
        }
        return next
      },
      { replace: true }
    )
  }

  const page = Math.max(1, Number(params.get("page") ?? "1") || 1)
  const rawPerPage = Number(params.get("per_page") ?? String(DEFAULT_PAGE_SIZE))
  const perPage: PageSize = (PAGE_SIZES as readonly number[]).includes(
    rawPerPage
  )
    ? (rawPerPage as PageSize)
    : DEFAULT_PAGE_SIZE
  const search = params.get("q") ?? ""

  // Search is the only filter now — CR-1794 removed the product layer and the DRC usability change
  // retired the catalog's process-context axis, so there is nothing else to narrow the list by.
  const hasActiveFilters = Boolean(search.trim())

  function setPage(p: number) {
    update({ page: p === 1 ? null : String(p) })
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

  return {
    page,
    perPage,
    search,
    hasActiveFilters,
    setPage,
    setPerPage,
    setSearch,
  }
}
