import { z } from "zod"
import { USER_ROLES } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"

export const UserStatusSchema = z.enum([
  "pending_approval",
  "invited",
  "active",
  "suspended",
  "deactivated",
  "expired",
  "rejected",
])
export type UserStatus = z.infer<typeof UserStatusSchema>

export const USER_STATUSES = UserStatusSchema.options

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  permissions: z.array(z.string()).default([]),
  tenant_id: z.string().nullable(),
  status: UserStatusSchema,
  phone_number: z.string().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
  access_valid_until: z.string().nullable(),
  invited_by: z.string().uuid().nullable(),
  invited_at: z.string().nullable(),
  activated_at: z.string().nullable(),
  last_login: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type UserResponse = z.infer<typeof UserResponseSchema>

// Direct user action response: { user: UserResponse } — approve, suspend, deactivate, etc.
export const UserActionResponseSchema = z.object({
  user: UserResponseSchema,
})
export type UserActionResponse = z.infer<typeof UserActionResponseSchema>

// Four-eyes path: API returns GovernedActionResponse instead of user data
const GovernedActionInviteResponseSchema = z.object({
  id: z.string().uuid(),
  action_type: z.string(),
  subject_id: z.string().uuid().nullable(),
  status: z.string(),
})

// Invite can return either shape depending on whether the role requires 4-eye approval
export const InviteUserResponseSchema = z.union([
  UserActionResponseSchema,
  GovernedActionInviteResponseSchema,
])
export type InviteUserResponse = z.infer<typeof InviteUserResponseSchema>

export const InviteUserInputSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  tenant_id: z.string().nullable().optional(),
  access_valid_until: z.string().nullable().optional(),
})
export type InviteUserInput = z.infer<typeof InviteUserInputSchema>

export const UserListItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  tenant_id: z.string().nullable(),
  tenant_name: z.string().nullable(),
  profile_picture_url: z.string().nullable().optional(),
  mfa_enabled: z.boolean().nullable().optional(),
  status: UserStatusSchema,
  last_login: z.string().nullable(),
  access_valid_until: z.string().nullable(),
})
export type UserListItem = z.infer<typeof UserListItemSchema>

export const PaginatedUsersResponseSchema = z.object({
  users: z.array(UserListItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
})
export type PaginatedUsersResponse = z.infer<
  typeof PaginatedUsersResponseSchema
>

export type UserSortKey =
  | "name"
  | "role"
  | "tenant_name"
  | "status"
  | "last_login"
  | "access_valid_until"

export type UserSortOrder = "asc" | "desc"

export type UsersQueryParams = {
  page?: number
  per_page?: number
  search?: string
  role?: UserRole[]
  status?: UserStatus[]
  tenant_id?: string
  sort_by?: UserSortKey
  sort_order?: UserSortOrder
  // UI ready — backend GET /api/v1/users does not support these filter params yet;
  // params are defined here for type-completeness but are NOT sent to the API
  mfa_enabled?: boolean | null
  lg_id?: string | null
  last_login_from?: string | null
  last_login_to?: string | null
  // Not yet supported by backend:
  access_expiry_from?: string | null
  access_expiry_to?: string | null
  created_from?: string | null
  created_to?: string | null
}

export const SUSPENSION_REASONS = [
  "temporary_access_restriction",
  "security_concern",
  "organizational_change",
  "compliance_review",
  "administrative_decision",
  "other",
] as const
export type SuspensionReason = (typeof SUSPENSION_REASONS)[number]

export const REACTIVATION_REASONS = [
  "suspension_period_ended",
  "administrative_decision",
  "compliance_clearance",
  "security_clearance",
  "other",
] as const
export type ReactivationReason = (typeof REACTIVATION_REASONS)[number]

export const DEACTIVATION_REASONS = [
  "offboarding",
  "organizational_change",
  "compliance_restriction",
  "security_restriction",
  "administrative_decision",
  "other",
] as const
export type DeactivationReason = (typeof DEACTIVATION_REASONS)[number]

export const RESEND_REASONS = [
  "invitation_expired",
  "not_received",
  "user_request",
  "administrative_action",
] as const
export type ResendReason = (typeof RESEND_REASONS)[number]

export const SuspendUserInputSchema = z.object({
  reason: z.enum(SUSPENSION_REASONS),
  comment: z.string().optional(),
  effective_from: z.string(),
  effective_until: z.string().optional(),
})
export type SuspendUserInput = z.infer<typeof SuspendUserInputSchema>

export const ReactivateUserInputSchema = z.object({
  reason: z.enum(REACTIVATION_REASONS),
  comment: z.string().optional(),
})
export type ReactivateUserInput = z.infer<typeof ReactivateUserInputSchema>

export const DeactivateUserInputSchema = z.object({
  reason: z.enum(DEACTIVATION_REASONS),
  comment: z.string().optional(),
  effective_from: z.string(),
})
export type DeactivateUserInput = z.infer<typeof DeactivateUserInputSchema>

export const ResendInvitationInputSchema = z.object({
  reason: z.enum(RESEND_REASONS),
})
export type ResendInvitationInput = z.infer<typeof ResendInvitationInputSchema>

export const UserDetailResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  status: UserStatusSchema,
  tenant_id: z.string().nullable(),
  tenant_name: z.string().nullable(),
  phone_number: z.string().nullable(),
  profile_picture_url: z.string().nullable().optional(),
  pending_email: z.string().nullable(),
  access_valid_until: z.string().nullable(),
  invited_by: z.object({ id: z.string(), name: z.string() }).nullable(),
  approved_by: z.object({ id: z.string(), name: z.string() }).nullable(),
  invited_at: z.string().nullable(),
  activated_at: z.string().nullable(),
  last_login: z.string().nullable(),
  last_activity: z.string().nullable().optional(),
  last_suspension_reason: z.string().nullable().optional(),
  last_deactivation_reason: z.string().nullable().optional(),
  is_service_account: z.boolean().optional(),
  created_at: z.string(),
})

export type UserDetail = z.infer<typeof UserDetailResponseSchema>

export const phoneNumberSchema = z
  .string()
  .regex(/^\+?[0-9\s\-() ]{7,30}$/, "Invalid phone number")

export const EditUserRequestSchema = z.object({
  first_name: z.string().min(1).max(100).nullable().optional(),
  last_name: z.string().min(1).max(100).nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
})
export type EditUserInput = z.infer<typeof EditUserRequestSchema>

export const UpdateSelfInputSchema = z.object({
  first_name: z.string().min(1).max(100).nullable().optional(),
  last_name: z.string().min(1).max(100).nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
})
export type UpdateSelfInput = z.infer<typeof UpdateSelfInputSchema>

export const ChangeEmailRequestSchema = z.object({
  new_email: z.string().email(),
})
export type ChangeEmailInput = z.infer<typeof ChangeEmailRequestSchema>

export const ChangeRoleRequestSchema = z.object({
  new_role: z.enum(USER_ROLES),
  reason: z.string().min(10).nullable().optional(),
})
export type ChangeRoleInput = z.infer<typeof ChangeRoleRequestSchema>

export const AUDITOR_PERIOD_UPDATE_REASONS = [
  "regulatory_audit",
  "internal_audit",
  "compliance_review",
  "investigation",
  "temporary_review_access",
  "other",
] as const
export type AuditorPeriodUpdateReason =
  (typeof AUDITOR_PERIOD_UPDATE_REASONS)[number]

export const UpdateAccessPeriodRequestSchema = z.object({
  new_access_valid_until: z.string().min(1),
  reason: z.enum(AUDITOR_PERIOD_UPDATE_REASONS),
})
export type UpdateAccessPeriodInput = z.infer<
  typeof UpdateAccessPeriodRequestSchema
>

export const ExportFormatSchema = z.enum(["csv", "xlsx"])
export type ExportFormat = z.infer<typeof ExportFormatSchema>

export const ExportJobSchema = z.object({
  job_id: z.string(),
  status: z.string(),
  poll_url: z.string().optional(),
  download_url: z.string().optional(),
})
export type ExportJob = z.infer<typeof ExportJobSchema>

export const ExportJobStatusSchema = z.object({
  job_id: z.string(),
  status: z.enum(["processing", "ready", "failed"]),
  row_count: z.number().optional(),
  error_code: z.string().optional(),
})
export type ExportJobStatus = z.infer<typeof ExportJobStatusSchema>

export type ExportParams = {
  format: ExportFormat
  search?: string
  role?: UserRole[]
  status?: UserStatus[]
  tenant_id?: string
  last_login_from?: string | null
  last_login_to?: string | null
}
