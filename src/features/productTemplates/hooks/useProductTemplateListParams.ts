import { useSearchParams } from "react-router-dom"
import { TemplateStatusSchema } from "@/features/productTemplates/api/schema"
import type { TemplateStatus } from "@/features/productTemplates/api/schema"

export const PAGE_SIZES = [10, 25, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]

type ParamUpdate = Record<string, string | null>

export function useProductTemplateListParams() {
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
  const rawPerPage = Number(params.get("per_page") ?? "25")
  const perPage: PageSize = (PAGE_SIZES as readonly number[]).includes(
    rawPerPage
  )
    ? (rawPerPage as PageSize)
    : 25
  const search = params.get("q") ?? ""
  const rawStatus = params.get("status")
  const statusFilter: TemplateStatus | null =
    rawStatus &&
    TemplateStatusSchema.options.includes(rawStatus as TemplateStatus)
      ? (rawStatus as TemplateStatus)
      : null

  function setPage(p: number) {
    update({ page: p === 1 ? null : String(p) })
  }

  function setPerPage(size: PageSize) {
    update({ per_page: size === 25 ? null : String(size), page: null })
  }

  function setSearch(q: string) {
    update({ q: q || null, page: null })
  }

  function setStatusFilter(status: TemplateStatus | null) {
    update({ status, page: null })
  }

  function clearAllFilters() {
    update({ q: null, status: null, page: null })
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
    clearAllFilters,
  }
}
