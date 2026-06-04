import { api } from "@/lib/api"
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
  const qs = new URLSearchParams()
  params.status?.forEach(s => qs.append("status", s))
  if (params.page) qs.set("page", String(params.page))
  if (params.per_page) qs.set("per_page", String(params.per_page))
  const query = qs.toString()
  const data = await api.get(`/governed-actions${query ? `?${query}` : ""}`)
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
