import { api } from "@/lib/api"
import { buildQueryString } from "@/lib/queryParams"
import { GovernedActionSchema, PaginatedGovernedActionsSchema } from "./schema"
import type {
  GovernedAction,
  GovernedActionStatus,
  PaginatedGovernedActions,
} from "./schema"

export const GOVERNED_ACTIONS_QUERY_KEYS = {
  lists: () => ["governed-actions", "list"] as const,
  list: (params: GovernedActionsQueryParams) =>
    ["governed-actions", "list", params] as const,
  detail: (id: string) => ["governed-actions", "detail", id] as const,
} as const

export type GovernedActionsQueryParams = {
  status?: GovernedActionStatus[]
  page?: number
  per_page?: number
}

export async function fetchGovernedActions(
  params: GovernedActionsQueryParams = {}
): Promise<PaginatedGovernedActions> {
  const data = await api.get(
    `/governed-actions${buildQueryString({
      status: params.status,
      page: params.page,
      per_page: params.per_page,
    })}`
  )
  return PaginatedGovernedActionsSchema.parse(data)
}

export async function fetchGovernedAction(id: string): Promise<GovernedAction> {
  const data = await api.get(`/governed-actions/${id}`)
  return GovernedActionSchema.parse(data)
}

export async function approveGovernedAction(
  id: string,
  comment?: string
): Promise<GovernedAction> {
  const data = await api.post(`/governed-actions/${id}/approve`, {
    comment: comment ?? null,
  })
  return GovernedActionSchema.parse(data)
}

export async function rejectGovernedAction(
  id: string,
  comment?: string
): Promise<GovernedAction> {
  const data = await api.post(`/governed-actions/${id}/reject`, {
    comment: comment ?? null,
  })
  return GovernedActionSchema.parse(data)
}

export async function withdrawGovernedAction(
  id: string
): Promise<GovernedAction> {
  const data = await api.post(`/governed-actions/${id}/withdraw`, {})
  return GovernedActionSchema.parse(data)
}

export async function reInitiateGovernedAction(
  id: string,
  reason?: string
): Promise<GovernedAction> {
  const data = await api.post(`/governed-actions/${id}/re-initiate`, {
    reason: reason ?? null,
  })
  return GovernedActionSchema.parse(data)
}
