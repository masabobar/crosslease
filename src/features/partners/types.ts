import type { UserRole } from "@/features/users/types"

// system_admin and support_user are platform-level roles with no tenant_id.
// Partner visibility is always tenant-scoped (epic: "operational visibility must remain tenant-scoped").
export const PARTNER_VIEW_ALLOWED_ROLES: readonly UserRole[] = [
  "auditor",
  "front_office",
  "back_office",
]

// Only tenant-scoped users with write permissions can submit/confirm/reject partners.
export const PARTNER_SUBMIT_ALLOWED_ROLES: readonly UserRole[] = [
  "front_office",
]

export type PartnerActionType = "confirm" | "reject" | "archive"
