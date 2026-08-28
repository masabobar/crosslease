import { useSearchParams } from "react-router-dom"
import {
  CaseTypeSchema,
  CatalogLayerSchema,
  CatalogStateSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type { WorkflowTaskCatalogFilterState } from "@/features/workflowTaskCatalog/constants"

// Capped at 50 by US 15.22's non-functional requirement ("max 50 rows per page"), even though
// the endpoint itself allows per_page up to 100.
export const PAGE_SIZES = [10, 25, 50] as const
export type PageSize = (typeof PAGE_SIZES)[number]
export const DEFAULT_PAGE_SIZE: PageSize = 25

// The BE resolves `search` with an ILIKE on the catalog's own name, OR'd with a subquery over its
// task codes and names (catalog name added for PRD1042-2138). It notes it has no pg_trgm index yet
// — so short prefixes are not worth a round trip. Same guard as useProductTemplateList.
export const MIN_SEARCH_LENGTH = 3

type ParamUpdate = Record<string, string | string[] | null>

// Filter values are validated against the wire enums on read: a hand-edited URL must not
// put an unknown value into a request param.
function readEnumList<T extends string>(
  values: string[],
  allowed: readonly T[]
): T[] {
  return values.filter((v): v is T =>
    (allowed as readonly string[]).includes(v)
  )
}

type WorkflowTaskCatalogListParams = {
  page: number
  perPage: PageSize
  search: string
  filters: WorkflowTaskCatalogFilterState
  hasActiveFilters: boolean
  setPage: (p: number) => void
  setPerPage: (size: PageSize) => void
  setSearch: (q: string) => void
  setFilters: (changes: Partial<WorkflowTaskCatalogFilterState>) => void
}

export function useWorkflowTaskCatalogListParams(): WorkflowTaskCatalogListParams {
  const [params, setParams] = useSearchParams()

  function update(changes: ParamUpdate) {
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          next.delete(key)
          if (Array.isArray(value)) {
            for (const item of value) next.append(key, item)
          } else if (value !== null && value !== "") {
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

  const filters: WorkflowTaskCatalogFilterState = {
    catalogLayer: readEnumList(
      params.getAll("catalog_layer"),
      CatalogLayerSchema.options
    ),
    caseType: readEnumList(params.getAll("case_type"), CaseTypeSchema.options),
    // Free-form UUIDs rather than a closed enum, so there is nothing to validate against here;
    // an unknown id simply matches no catalog server-side.
    productTemplate: params.getAll("product_template_id"),
    catalogState: readEnumList(
      params.getAll("catalog_state"),
      CatalogStateSchema.options
    ),
  }

  const hasActiveFilters =
    Boolean(search.trim()) || Object.values(filters).some(l => l.length > 0)

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

  function setFilters(changes: Partial<WorkflowTaskCatalogFilterState>) {
    update({
      ...(changes.catalogLayer && { catalog_layer: changes.catalogLayer }),
      ...(changes.caseType && { case_type: changes.caseType }),
      ...(changes.productTemplate && {
        product_template_id: changes.productTemplate,
      }),
      ...(changes.catalogState && { catalog_state: changes.catalogState }),
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
