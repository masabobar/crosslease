import { api } from "@/lib/api"
import { NotificationConfigSchema } from "./schema"
import type { NotificationConfig } from "./schema"

export const NOTIFICATION_QUERY_KEYS = {
  config: () => ["notifications", "config"] as const,
} as const

export async function fetchNotificationConfig(): Promise<NotificationConfig> {
  const data = await api.get("/notification-config")
  return NotificationConfigSchema.parse(data)
}
