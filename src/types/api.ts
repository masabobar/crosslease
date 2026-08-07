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

// One field's before/after on any versioned entity's diff response. The backend declares this
// once and reuses it across every diff endpoint (see `FieldDiffItem` in src/generated/api.ts,
// referenced by five response shapes), so it lives here rather than being redefined per
// feature — it was independently declared, identically, in audit, frameworkAgreements and
// productTemplates before this. Each feature re-exports it from its own `api/schema.ts` so
// existing import paths keep working.
export const FieldDiffItemSchema = z.object({
  field: z.string(),
  old_value: z.unknown().nullable(),
  new_value: z.unknown().nullable(),
})

export type FieldDiffItem = z.infer<typeof FieldDiffItemSchema>
