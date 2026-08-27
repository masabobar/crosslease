import {
  BACK_OFFICE_ROLE,
  BANK_POWER_USER_ROLE,
  FRONT_OFFICE_ROLE,
} from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import type { CaseDisplayStatus } from "@/features/cases/api/schema"

// PRD1042-1794 (DRC usability) — who reaches the bank-side Case list and detail. Front Office and
// Back Office are the operational case workers (they own the upload/review actions inside the
// Documents tab); Bank Power User is included for read so the bank's authoring role can see the
// operational surface its catalogue drives. leasing_company_user is absent by design: an LC has its
// own /lc/... screens and sees only its own obligations, never the bank's case list. system_admin
// and the platform roles have nothing operational here.
export const CASE_READ_ALLOWED_ROLES: readonly UserRole[] = [
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
  BANK_POWER_USER_ROLE,
]

// UI-only enum, never crosses the wire — a plain type guard is enough. The Documents tab ships now;
// checklist/parties/terms are the extension points the detail shell is structured for (US 16.22).
export type CaseDetailTab = "documents"

// display_status is a plain string on the wire (the backend widens it independently), so this is a
// lookup with a neutral fallback rather than an exhaustive Record: a status added there renders with
// the default variant instead of an undefined one.
export const CASE_DISPLAY_STATUS_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  open: "default",
  waiting: "secondary",
  done: "outline",
  cancelled: "destructive",
}

export function caseDisplayStatusBadgeVariant(
  status: CaseDisplayStatus
): "default" | "secondary" | "outline" | "destructive" {
  return CASE_DISPLAY_STATUS_BADGE_VARIANT[status] ?? "secondary"
}
