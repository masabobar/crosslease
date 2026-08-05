import { useSearchParams } from "react-router-dom"
import { DocumentRequirementCatalogTypeSchema } from "@/features/documentRequirements/api/schema"
import type { DocumentRequirementCatalogFilterState } from "@/features/documentRequirements/constants"

export const PAGE_SIZES = [10, 25, 50] as const
export type PageSize = (typeof PAGE_SIZES)[number]
export const DEFAULT_PAGE_SIZE: PageSize = 25

// Same guard as the Workflow Task Catalog's list — short prefixes against an ILIKE scan are not
// worth a round trip.
export const MIN_SEARCH_LENGTH = 3

type ParamUpdate = Record<string, string | null>

function readEnum<T extends string>(
  value: string | null,
  allowed: readonly T[]
): T | null {
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null
}

export function useDocumentRequirementCatalogListParams() {
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

  const filters: DocumentRequirementCatalogFilterState = {
    catalogType: readEnum(
      params.get("catalog_type"),
      DocumentRequirementCatalogTypeSchema.options
    ),
    // Free-form on the wire (no backend enum), so nothing to validate against here.
    processContext: params.get("process_context"),
  }

  const hasActiveFilters =
    Boolean(search.trim()) ||
    filters.catalogType !== null ||
    filters.processContext !== null

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

  function setFilters(changes: Partial<DocumentRequirementCatalogFilterState>) {
    update({
      ...("catalogType" in changes && {
        catalog_type: changes.catalogType ?? null,
      }),
      ...("processContext" in changes && {
        process_context: changes.processContext ?? null,
      }),
      page: null,
    })
  }

  return {
    page,
    perPage,
    search,
    filters,
    hasActiveFilters,
    setPage,
    setPerPage,
    setSearch,
    setFilters,
  }
}
