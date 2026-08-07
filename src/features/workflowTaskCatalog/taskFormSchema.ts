import { z } from "zod"
import {
  LayerActionSchema,
  TaskProcessContextSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type { LayerAction } from "@/features/workflowTaskCatalog/api/schema"

// The authoring form's shape and cross-field rules for TaskDefinitionSheet. Separate from the
// component so the form's fieldsets (see components/TaskDocumentLinkageFields.tsx) can type their
// `control` prop against it without importing the component itself.

// Identity fields belong to the task itself for `defined` and `supplement`; for `override` and
// `deactivated` they come from the Global Default parent, so the form requires a parent instead.
export const PARENT_BACKED_ACTIONS: readonly LayerAction[] = [
  LayerActionSchema.enum.override,
  LayerActionSchema.enum.deactivated,
]

// Mirrors AddTaskRequest.validate_action_constraints: a defined/supplement task must carry all
// of these. `openapi.json` marks them optional — the requirement lives in the Pydantic model
// validator, not the schema, so the FE has to encode it or every submit 422s.
const REQUIRED_FOR_OWN_TASK = [
  "task_name",
  "task_description",
  "category",
  "responsible_role",
  "is_mandatory",
  "display_order",
  "stage_categorization",
] as const

export const taskFormSchema = z
  .object({
    layer_action: LayerActionSchema,
    parent_task_id: z.string(),
    task_code: z.string(),
    task_name: z.string(),
    task_description: z.string(),
    category: z.string(),
    responsible_role: z.string(),
    weight: z.string(),
    display_order: z.string(),
    is_mandatory: z.string(),
    stage_categorization: z.string(),
    applicable_process_contexts: z.array(TaskProcessContextSchema),
    is_active: z.boolean(),
    treasury_threshold_trigger: z.boolean(),
    doc_requirement_ref: z.string(),
    doc_requirement_pin_mode: z.string(),
  })
  .superRefine((data, ctx) => {
    // US 15.7 field spec: Ref is optional (O), Pinning Behavior is conditional (C) — "mandatory
    // when a Ref is present". The BE enforces the same symmetry: (ref is None) != (pin is None)
    // is rejected. No default pin mode is chosen here because OQ-03 leaves it to tenant policy.
    if (data.doc_requirement_ref && !data.doc_requirement_pin_mode) {
      ctx.addIssue({
        code: "custom",
        path: ["doc_requirement_pin_mode"],
        message: "required",
      })
    }

    // Override and deactivate carry nothing but their parent — the values are inherited.
    if (PARENT_BACKED_ACTIONS.includes(data.layer_action)) {
      if (!data.parent_task_id) {
        ctx.addIssue({
          code: "custom",
          path: ["parent_task_id"],
          message: "required",
        })
      }
      return
    }

    if (!data.task_code.trim()) {
      ctx.addIssue({ code: "custom", path: ["task_code"], message: "required" })
    }
    for (const field of REQUIRED_FOR_OWN_TASK) {
      if (!data[field].trim()) {
        ctx.addIssue({ code: "custom", path: [field], message: "required" })
      }
    }
    // Required by the BE too, and easy to miss because it is a multi-select rather than a field.
    if (data.applicable_process_contexts.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["applicable_process_contexts"],
        message: "required",
      })
    }
  })

export type TaskFormValues = z.infer<typeof taskFormSchema>
