import { z } from "zod"

export const ApiErrorDetailSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  field: z.string().optional(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
        input: z.unknown(),
      })
    )
    .optional(),
})

export type ApiErrorDetail = z.infer<typeof ApiErrorDetailSchema>
