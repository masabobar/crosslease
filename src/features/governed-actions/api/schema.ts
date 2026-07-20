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
  "partner_archive",
  "partner_confirm",
  "partner_role_assign",
  "partner_identity_change",
  "partner_merge",
  "product_template_activate",
  "product_template_deprecate",
])
export type GovernedActionType = z.infer<typeof GovernedActionTypeSchema>

// Actor snapshot shape is the same across all action types, so it's validated
// eagerly as part of the base schema (fields optional — real-world snapshots
// have been observed missing individual fields; a wrong *type* still fails
// parsing, which is the actual gap this schema closes).
const ActorSnapshotSchema = z.object({
  user_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.string().optional(),
  tenant_id: z.string().nullable().optional(),
})
export type ActorSnapshot = z.infer<typeof ActorSnapshotSchema>

export const GovernedActionSchema = z.object({
  id: z.string().uuid(),
  action_type: GovernedActionTypeSchema,
  subject_type: z.string(),
  subject_id: z.string().nullable(),
  tenant_id: z.string().nullable(),
  status: GovernedActionStatusSchema,
  initiator_id: z.string().uuid(),
  approver_id: z.string().nullable(),
  // Open record — shape varies per action_type; validated per-type at point
  // of use via the `*Snapshot()` accessors below.
  display_snapshot: z.record(z.string(), z.unknown()),
  initiator_snapshot: ActorSnapshotSchema,
  approver_snapshot: ActorSnapshotSchema.nullable(),
  execution_params: z.record(z.string(), z.unknown()),
  reason: z.string().nullable(),
  approver_comment: z.string().nullable(),
  expires_at: z.string().nullable(),
  resolved_at: z.string().nullable(),
  correlation_id: z.string().nullable(),
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

// Per-action-type display_snapshot shapes. Fields are optional: BE snapshots
// are observed to omit individual fields, and the UI already renders "—" for
// missing values — but a field present with the WRONG type now fails
// validation instead of silently flowing through an `as unknown as X` cast.

export const RoleChangeSnapshotSchema = z.object({
  user_id: z.string().optional(),
  affected_user_email: z.string().optional(),
  old_role: z.string().optional(),
  new_role: z.string().optional(),
})
export type RoleChangeSnapshot = z.infer<typeof RoleChangeSnapshotSchema>

export const PlatformInviteSnapshotSchema = z.object({
  email: z.string().optional(),
  full_name: z.string().optional(),
  role_label: z.string().optional(),
})
export type PlatformInviteSnapshot = z.infer<
  typeof PlatformInviteSnapshotSchema
>

export const EmailChangeSnapshotSchema = z.object({
  old_email: z.string().optional(),
  new_email: z.string().optional(),
})
export type EmailChangeSnapshot = z.infer<typeof EmailChangeSnapshotSchema>

export const TenantCreateSnapshotSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  country: z.string().optional(),
  legal_entity_name: z.string().optional(),
})
export type TenantCreateSnapshot = z.infer<typeof TenantCreateSnapshotSchema>

// tenant_suspend / tenant_reactivate / tenant_archive all snapshot only the
// tenant id (see handlers in ../refinext-api governed_actions module).
export const TenantIdSnapshotSchema = z.object({
  tenant_id: z.string().optional(),
})
export type TenantIdSnapshot = z.infer<typeof TenantIdSnapshotSchema>

export const ModuleActivateSnapshotSchema = z.object({
  tenant_id: z.string().optional(),
  module_key: z.string().optional(),
  action: z.string().optional(),
})
export type ModuleActivateSnapshot = z.infer<
  typeof ModuleActivateSnapshotSchema
>

export const AuditorPeriodUpdateSnapshotSchema = z.object({
  user_id: z.string().optional(),
  old_access_valid_until: z.string().nullable().optional(),
  new_access_valid_until: z.string().nullable().optional(),
})
export type AuditorPeriodUpdateSnapshot = z.infer<
  typeof AuditorPeriodUpdateSnapshotSchema
>

export const PartnerArchiveSnapshotSchema = z.object({
  partner_id: z.string().optional(),
  reason: z.string().nullable().optional(),
})
export type PartnerArchiveSnapshot = z.infer<
  typeof PartnerArchiveSnapshotSchema
>

export const PartnerRoleAssignSnapshotSchema = z.object({
  partner_id: z.string().optional(),
  role: z.string().optional(),
})
export type PartnerRoleAssignSnapshot = z.infer<
  typeof PartnerRoleAssignSnapshotSchema
>

export const PartnerIdentityChangeSnapshotSchema = z.object({
  partner_id: z.string().optional(),
  target_anchors: z.array(z.string()).optional(),
  change_reason: z.string().optional(),
  is_high_risk: z.boolean().optional(),
})
export type PartnerIdentityChangeSnapshot = z.infer<
  typeof PartnerIdentityChangeSnapshotSchema
>

export const PartnerMergeSnapshotSchema = z.object({
  source_partner_id: z.string().optional(),
  target_partner_id: z.string().optional(),
  merge_reason_code: z.string().optional(),
  note: z.string().nullable().optional(),
})
export type PartnerMergeSnapshot = z.infer<typeof PartnerMergeSnapshotSchema>

export const ProductTemplateActivateSnapshotSchema = z.object({
  version_id: z.string().optional(),
  template_name: z.string().optional(),
  version_number: z.string().optional(),
})
export type ProductTemplateActivateSnapshot = z.infer<
  typeof ProductTemplateActivateSnapshotSchema
>

export const ProductTemplateDeprecateSnapshotSchema =
  ProductTemplateActivateSnapshotSchema.extend({
    justification: z.string().optional(),
  })
export type ProductTemplateDeprecateSnapshot = z.infer<
  typeof ProductTemplateDeprecateSnapshotSchema
>

// Shared minimal shapes for the generic "just need this one field" lookups
// (e.g. partner_* / product_template_* rows that only display an id/name).
export const PartnerIdSnapshotSchema = z.object({
  partner_id: z.string().optional(),
})
export type PartnerIdSnapshot = z.infer<typeof PartnerIdSnapshotSchema>

export const TemplateNameSnapshotSchema = z.object({
  template_name: z.string().optional(),
})
export type TemplateNameSnapshot = z.infer<typeof TemplateNameSnapshotSchema>

// Typed accessors — display_snapshot is an open record on the base schema
// because its shape varies per action_type. These helpers validate it
// against the shape for the caller's known action_type via `safeParse`,
// falling back to an empty (all-fields-absent) object on mismatch instead of
// trusting an unchecked cast. Callers already render "—" for absent fields.
export function roleChangeSnapshot(action: GovernedAction): RoleChangeSnapshot {
  return displaySnapshot(action, RoleChangeSnapshotSchema)
}
export function platformInviteSnapshot(
  action: GovernedAction
): PlatformInviteSnapshot {
  return displaySnapshot(action, PlatformInviteSnapshotSchema)
}
export function emailChangeSnapshot(
  action: GovernedAction
): EmailChangeSnapshot {
  return displaySnapshot(action, EmailChangeSnapshotSchema)
}
export function displaySnapshot<T>(
  action: GovernedAction,
  schema: z.ZodType<T>
): T {
  const result = schema.safeParse(action.display_snapshot)
  // Safe by construction: every snapshot schema above has all-optional
  // fields, so `{}` is itself a valid (fully-absent) instance of T.
  return result.success ? result.data : ({} as T)
}
export function initiatorSnapshot(action: GovernedAction): ActorSnapshot {
  return action.initiator_snapshot
}
export function approverSnapshot(action: GovernedAction): ActorSnapshot | null {
  return action.approver_snapshot
}

// Review comment field (approve/reject dialog). Comment is optional for
// approval but required for rejection — that asymmetry can't be expressed in
// a single resolver schema, so this schema only enforces the shared
// min-length-if-non-empty rule; the reject-only "required" check is applied
// by the caller via `setError`. Message values are i18n key suffixes looked
// up under `modal.<message>` by the component, not display text themselves.
export const REVIEW_COMMENT_MIN_LENGTH = 10

export const ReviewCommentFormSchema = z.object({
  comment: z
    .string()
    .refine(
      value =>
        value.trim().length === 0 ||
        value.trim().length >= REVIEW_COMMENT_MIN_LENGTH,
      { message: "justificationTooShort" }
    ),
})
export type ReviewCommentForm = z.infer<typeof ReviewCommentFormSchema>
