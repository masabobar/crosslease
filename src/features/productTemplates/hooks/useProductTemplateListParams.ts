import { useSearchParams } from "react-router-dom"
import { TemplateStatusSchema } from "@/features/productTemplates/api/schema"
import type { TemplateStatus } from "@/features/productTemplates/api/schema"
import { PRODUCT_STATUS_DEACTIVATED } from "@/features/productTemplates/constants"
import type { ProductTemplateStatusFilter } from "@/features/productTemplates/types"

export const PAGE_SIZES = [10, 25, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]
export const DEFAULT_PAGE_SIZE: PageSize = 25

type ParamUpdate = Record<string, string | null>

type ProductTemplateListParams = {
  page: number
  perPage: PageSize
  search: string
  statusFilter: ProductTemplateStatusFilter | null
  setPage: (p: number) => void
  setPerPage: (size: PageSize) => void
  setSearch: (q: string) => void
  setStatusFilter: (status: ProductTemplateStatusFilter | null) => void
}

export function useProductTemplateListParams(): ProductTemplateListParams {
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
  const rawStatus = params.get("status")
  const statusFilter: ProductTemplateStatusFilter | null =
    rawStatus &&
    (TemplateStatusSchema.options.includes(rawStatus as TemplateStatus) ||
      rawStatus === PRODUCT_STATUS_DEACTIVATED)
      ? (rawStatus as ProductTemplateStatusFilter)
      : null

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

  function setStatusFilter(status: ProductTemplateStatusFilter | null) {
    update({ status, page: null })
  }

  return {
    page,
    perPage,
    search,
    statusFilter,
    setPage,
    setPerPage,
    setSearch,
    setStatusFilter,
  }
}
