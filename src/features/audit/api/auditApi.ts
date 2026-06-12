import { api } from "@/lib/api"
import { buildQueryString } from "@/lib/queryParams"
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
  const data = await api.get(
    `/audit/events${buildQueryString({
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      event_type: params.event_type?.length ? params.event_type : undefined,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      actor_id: params.actor_id,
      action_type: params.action_type,
      trigger_source: params.trigger_source,
      sensitive:
        params.sensitive !== undefined && params.sensitive !== null
          ? params.sensitive
          : undefined,
      result: params.result,
      tenant_id: params.tenant_id,
      from_dt: params.from_dt,
      to_dt: params.to_dt,
    })}`
  )
  return PaginatedAuditEventsSchema.parse(data)
}

export async function fetchAuditEvent(eventId: string): Promise<AuditEvent> {
  const data = await api.get(`/audit/events/${eventId}`)
  return AuditEventSchema.parse(data)
}
