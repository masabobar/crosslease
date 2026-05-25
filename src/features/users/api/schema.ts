import { z } from "zod"
import { USER_ROLES } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"

export const UserStatusSchema = z.enum([
  "pending_activation",
  "invited",
  "active",
  "suspended",
  "deactivated",
  "expired",
])
export type UserStatus = z.infer<typeof UserStatusSchema>

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  tenant_id: z.string().uuid().nullable(),
  status: UserStatusSchema,
  access_valid_from: z.string().nullable(),
  access_valid_until: z.string().nullable(),
  invited_by: z.string().uuid().nullable(),
  invited_at: z.string().nullable(),
  activated_at: z.string().nullable(),
  last_login: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type UserResponse = z.infer<typeof UserResponseSchema>

export const InviteUserResponseSchema = z.object({
  user: UserResponseSchema,
})

export type InviteUserResponse = z.infer<typeof InviteUserResponseSchema>

export type InviteUserInput = {
  first_name: string
  last_name: string
  email: string
  role: (typeof USER_ROLES)[number]
  tenant_id?: string | null
  access_valid_from?: string | null
  access_valid_until?: string | null
}

export const UserListItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  tenant_id: z.string().uuid().nullable(),
  tenant_name: z.string().nullable(),
  mfa_enabled: z.boolean().nullable().optional(),
  status: UserStatusSchema,
  last_login: z.string().nullable(),
  access_valid_from: z.string().nullable(),
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

export type UsersQueryParams = {
  page?: number
  per_page?: number
  search?: string
  role?: UserRole[]
  status?: UserStatus[]
  tenant_id?: string
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

export type SuspendUserInput = {
  reason: SuspensionReason
  comment?: string
  effective_from: string
  effective_until?: string
}

export type ReactivateUserInput = {
  reason: ReactivationReason
  comment?: string
}

export type DeactivateUserInput = {
  reason: DeactivationReason
  comment?: string
  effective_from: string
}

export type ResendInvitationInput = {
  reason: ResendReason
}

export const UserDetailResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  status: UserStatusSchema,
  tenant_id: z.string().uuid().nullable(),
  tenant_name: z.string().nullable(),
  access_valid_from: z.string().nullable(),
  access_valid_until: z.string().nullable(),
  invited_by_user_id: z.string().nullable(),
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
