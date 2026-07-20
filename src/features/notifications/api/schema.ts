import { z } from "zod"

export const NotificationConfigSchema = z.object({
  event_types: z.array(z.string()),
  categories: z.array(z.string()),
  priorities: z.array(z.string()),
})
export type NotificationConfig = z.infer<typeof NotificationConfigSchema>
