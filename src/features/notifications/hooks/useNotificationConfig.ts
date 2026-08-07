import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import {
  fetchNotificationConfig,
  NOTIFICATION_QUERY_KEYS,
} from "@/features/notifications/api/notificationsApi"
import type { NotificationConfig } from "@/features/notifications/api/schema"
import { FIVE_MINUTES_MS } from "@/lib/constants"

export function useNotificationConfig(): UseQueryResult<
  NotificationConfig,
  Error
> {
  return useQuery<NotificationConfig>({
    queryKey: NOTIFICATION_QUERY_KEYS.config(),
    queryFn: fetchNotificationConfig,
    staleTime: FIVE_MINUTES_MS,
  })
}
