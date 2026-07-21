import { api } from "@/lib/api"
import { buildQueryString } from "@/lib/queryParams"
import {
  AuditEventSchema,
  AuditFilterOptionsSchema,
  PaginatedAuditEventsSchema,
} from "./schema"
import type {
  AuditEvent,
  AuditFilterOptions,
  AuditQueryParams,
  PaginatedAuditEvents,
} from "./schema"

export const AUDIT_QUERY_KEYS = {
  lists: () => ["audit", "list"] as const,
  list: (params: AuditQueryParams) => ["audit", "list", params] as const,
  detail: (id: string) => ["audit", "detail", id] as const,
  filterOptions: () => ["audit", "filter-options"] as const,
  entityList: (
    entityType: string,
    entityId: string,
    params: { page: number; per_page: number }
  ) => ["audit", "entity", entityType, entityId, params] as const,
} as const

export async function fetchAuditEvents(
  params: AuditQueryParams = {}
): Promise<PaginatedAuditEvents> {
  const data = await api.get(
    `/audit/events${buildQueryString({
      page: params.page,
      per_page: params.per_page,
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

export async function fetchAuditFilterOptions(): Promise<AuditFilterOptions> {
  const data = await api.get("/audit/filters/options")
  return AuditFilterOptionsSchema.parse(data)
}

export async function fetchEntityAuditEvents(
  entityType: string,
  entityId: string,
  params: { page?: number; per_page?: number } = {}
): Promise<PaginatedAuditEvents> {
  const data = await api.get(
    `/audit/events/entity/${entityType}/${entityId}${buildQueryString({
      page: params.page,
      per_page: params.per_page,
    })}`
  )
  return PaginatedAuditEventsSchema.parse(data)
}
