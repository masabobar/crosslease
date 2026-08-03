import { z } from "zod"
import { StageCategorizationSchema } from "@/features/workflowTaskCatalog/api/schema"

// Runtime half of the Workflow Task Catalog — the checklist that sits on a case, and the phase
// gates over it. Wire enums must match refinext-api
// src/app/modules/workflow_task_catalog/domain/enums.py exactly.
//
// StageCategorization is imported rather than redeclared: the six phases already have one source
// of truth in api/schema.ts, and the gate's `phase` is that same enum on the wire
// (routes/cases.py types the path param with it).

export const ChecklistItemStatusSchema = z.enum([
  "open",
  "checked",
  "not_applicable",
])
export type ChecklistItemStatus = z.infer<typeof ChecklistItemStatusSchema>

export const PhaseGateStatusSchema = z.enum([
  "open",
  "in_review",
  "approved",
  "rejected",
])
export type PhaseGateStatus = z.infer<typeof PhaseGateStatusSchema>

// GET/POST /cases/{business_object_id}/checklist — mirrors ChecklistItemResponse.
//
// All eleven keys are REQUIRED on the wire, most of them nullable, so `.nullable()` on a required
// key throughout and never `.optional()` — the same discipline the authoring schemas document.
//
// Two fields the CR asks for are deliberately absent because the backend does not send them:
// `responsible_role` and `display_order`. `materialize_checklist()` copies only task_code,
// task_name, is_mandatory and weight off the catalogue task (CR PRD1042-1790 B7), so a case item
// cannot say whose task it is and carries no order of its own — `runtime_repo.list_items()` sorts
// by created_at. Do not add either field here speculatively; it would parse as undefined and read
// as though the data existed. Tracked in open-questions.md Q-052.
export const ChecklistItemResponseSchema = z.object({
  id: z.string().uuid(),
  business_object_id: z.string().uuid(),
  source_catalog_task_id: z.string().uuid(),
  task_code: z.string().nullable(),
  task_name: z.string().nullable(),
  is_mandatory: z.boolean(),
  // Decimal on the BE, so it arrives as a string.
  weight: z.coerce.number().nullable(),
  status: ChecklistItemStatusSchema,
  note: z.string().nullable(),
  checked_by: z.string().uuid().nullable(),
  checked_at: z.string().nullable(),
})
export type ChecklistItemResponse = z.infer<typeof ChecklistItemResponseSchema>

export const ChecklistResponseSchema = z.array(ChecklistItemResponseSchema)
export type ChecklistResponse = z.infer<typeof ChecklistResponseSchema>

// PATCH /cases/{business_object_id}/checklist/items/{item_id} — mirrors SetItemStatusRequest.
//
// `status` is the only required key, and the service accepts only `checked` and `not_applicable`
// here: `set_item_status` rejects anything else — including a re-send of `open` — with
// WTC_CHECKLIST_ITEM_IMMUTABLE. So the settable set is narrower than ChecklistItemStatus, and is
// modelled as such rather than validated in the component.
export const SettableChecklistItemStatusSchema =
  ChecklistItemStatusSchema.exclude(["open"])
export type SettableChecklistItemStatus = z.infer<
  typeof SettableChecklistItemStatusSchema
>

export const SetItemStatusRequestSchema = z.object({
  status: SettableChecklistItemStatusSchema,
  note: z.string().nullable().optional(),
})
export type SetItemStatusRequest = z.infer<typeof SetItemStatusRequestSchema>

// GET /cases/{business_object_id}/checklist/required — mirrors RequiredProjectionResponse.
// This is the projection the gating engine is meant to consume (CR B6). It has no consumer
// server-side yet, so the screen is currently the only thing reading it: `all_required_done`
// drives the outstanding-tasks notice, which is CR item 7's "blocked submission has to explain
// itself". Note the projection filters on is_mandatory ALONE — it cannot filter by gating stage,
// because the case item carries neither the process contexts nor the stage (Q-052 / 1790 B2).
export const RequiredProjectionResponseSchema = z.object({
  business_object_id: z.string().uuid(),
  all_required_done: z.boolean(),
  required_items: z.array(ChecklistItemResponseSchema),
})
export type RequiredProjectionResponse = z.infer<
  typeof RequiredProjectionResponseSchema
>

// GET /cases/{business_object_id}/phase-gates — mirrors PhaseGateResponse.
// A gate row is created lazily, on the first decision (`set_phase_gate`), so this list contains
// only the phases somebody has already decided. A phase absent from it has NO gate — the screen
// must not render an `open` state for it.
export const PhaseGateResponseSchema = z.object({
  phase: StageCategorizationSchema,
  status: PhaseGateStatusSchema,
  gate_approver: z.string().uuid().nullable(),
  decided_at: z.string().nullable(),
  note: z.string().nullable(),
})
export type PhaseGateResponse = z.infer<typeof PhaseGateResponseSchema>

export const PhaseGatesResponseSchema = z.array(PhaseGateResponseSchema)
export type PhaseGatesResponse = z.infer<typeof PhaseGatesResponseSchema>

// PATCH /cases/{business_object_id}/phase-gates/{phase} — mirrors SetPhaseGateRequest.
// Every PhaseGateStatus is settable here, unlike the checklist item: the service's only transition
// rule is that APPROVED is terminal, and REJECTED may be reopened.
export const SetPhaseGateRequestSchema = z.object({
  status: PhaseGateStatusSchema,
  note: z.string().nullable().optional(),
})
export type SetPhaseGateRequest = z.infer<typeof SetPhaseGateRequestSchema>
