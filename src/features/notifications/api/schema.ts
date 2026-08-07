import { z } from "zod"

// All three arrays stay required even though the screen renders only `event_types`.
// GET /notification-config returns the whole registered catalogue in one shape
// (../refinext-api src/app/modules/notifications/domain/enums.py), so parsing it whole
// keeps the contract documented rather than narrowing the schema to today's UI.
export const NotificationConfigSchema = z.object({
  event_types: z.array(z.string()),
  categories: z.array(z.string()),
  priorities: z.array(z.string()),
})
export type NotificationConfig = z.infer<typeof NotificationConfigSchema>
