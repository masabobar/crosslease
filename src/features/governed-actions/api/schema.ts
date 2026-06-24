import { z } from "zod"

export const GovernedActionStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "withdrawn",
  "expired",
])
export type GovernedActionStatus = z.infer<typeof GovernedActionStatusSchema>

export const GovernedActionTypeSchema = z.enum([
  "tenant_create",
  "tenant_suspend",
  "tenant_reactivate",
  "tenant_archive",
  "user_platform_invite",
  "user_role_change",
  "user_auditor_period_update",
  "user_email_change",
  "module_activate",
])
export type GovernedActionType = z.infer<typeof GovernedActionTypeSchema>

// Open record — shape varies per action_type; typed at point of use
const ActorSnapshotSchema = z.record(z.string(), z.unknown())

export const GovernedActionSchema = z.object({
  id: z.string().uuid(),
  action_type: GovernedActionTypeSchema,
  subject_type: z.string(),
  subject_id: z.string().uuid().nullable(),
  tenant_id: z.string().uuid().nullable(),
  status: GovernedActionStatusSchema,
  initiator_id: z.string().uuid(),
  approver_id: z.string().uuid().nullable(),
  display_snapshot: z.record(z.string(), z.unknown()),
  initiator_snapshot: ActorSnapshotSchema,
  approver_snapshot: ActorSnapshotSchema.nullable(),
  execution_params: z.record(z.string(), z.unknown()),
  reason: z.string().nullable(),
  approver_comment: z.string().nullable(),
  expires_at: z.string().nullable(),
  resolved_at: z.string().nullable(),
  correlation_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type GovernedAction = z.infer<typeof GovernedActionSchema>

export const PaginatedGovernedActionsSchema = z.object({
  actions: z.array(GovernedActionSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
})
export type PaginatedGovernedActions = z.infer<
  typeof PaginatedGovernedActionsSchema
>

// Typed helpers for action-specific display_snapshot shapes

export type RoleChangeSnapshot = {
  user_id: string
  affected_user_email: string
  old_role: string
  new_role: string
}

export type PlatformInviteSnapshot = {
  email: string
  full_name: string
  role_label: string
}

export type EmailChangeSnapshot = {
  old_email: string
  new_email: string
}

export type ActorSnapshot = {
  user_id: string
  first_name: string
  last_name: string
  role: string
  tenant_id: string | null
}

// Typed accessors — snapshot fields are open records in the Zod schema because
// shape varies per action_type. These helpers centralise the cast so call sites
// don't repeat `as unknown as XxxSnapshot`.
export function roleChangeSnapshot(action: GovernedAction): RoleChangeSnapshot {
  return action.display_snapshot as unknown as RoleChangeSnapshot
}
export function platformInviteSnapshot(
  action: GovernedAction
): PlatformInviteSnapshot {
  return action.display_snapshot as unknown as PlatformInviteSnapshot
}
export function emailChangeSnapshot(
  action: GovernedAction
): EmailChangeSnapshot {
  return action.display_snapshot as unknown as EmailChangeSnapshot
}
export function initiatorSnapshot(action: GovernedAction): ActorSnapshot {
  return action.initiator_snapshot as unknown as ActorSnapshot
}
export function approverSnapshot(action: GovernedAction): ActorSnapshot | null {
  return action.approver_snapshot as unknown as ActorSnapshot | null
}
