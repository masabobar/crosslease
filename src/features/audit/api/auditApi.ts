import { api } from "@/lib/api"
import { AuditEventSchema, PaginatedAuditEventsSchema } from "./schema"
import type {
  AuditEvent,
  AuditQueryParams,
  PaginatedAuditEvents,
} from "./schema"

export const AUDIT_QUERY_KEYS = {
  lists: () => ["audit", "list"] as const,
  list: (params: AuditQueryParams) => ["audit", "list", params] as const,
  detail: (id: string) => ["audit", "detail", id] as const,
} as const

export async function fetchAuditEvents(
  params: AuditQueryParams = {}
): Promise<PaginatedAuditEvents> {
  const qs = new URLSearchParams()
  if (params.page) qs.set("page", String(params.page))
  if (params.per_page) qs.set("per_page", String(params.per_page))
  if (params.search) qs.set("search", params.search)
  if (params.event_type?.length) {
    params.event_type.forEach(et => qs.append("event_type", et))
  }
  if (params.entity_type) qs.set("entity_type", params.entity_type)
  if (params.entity_id) qs.set("entity_id", params.entity_id)
  if (params.actor_id) qs.set("actor_id", params.actor_id)
  if (params.action_type) qs.set("action_type", params.action_type)
  if (params.trigger_source) qs.set("trigger_source", params.trigger_source)
  if (params.sensitive !== undefined && params.sensitive !== null)
    qs.set("sensitive", String(params.sensitive))
  if (params.result) qs.set("result", params.result)
  if (params.tenant_id) qs.set("tenant_id", params.tenant_id)
  if (params.from_dt) qs.set("from_dt", params.from_dt)
  if (params.to_dt) qs.set("to_dt", params.to_dt)
  const query = qs.toString()
  const data = await api.get(`/audit/events${query ? `?${query}` : ""}`)
  return PaginatedAuditEventsSchema.parse(data)
}

export async function fetchAuditEvent(eventId: string): Promise<AuditEvent> {
  const data = await api.get(`/audit/events/${eventId}`)
  return AuditEventSchema.parse(data)
}
