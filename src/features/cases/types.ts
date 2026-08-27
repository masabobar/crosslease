import { BACK_OFFICE_ROLE, FRONT_OFFICE_ROLE } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import type { CaseDisplayStatus } from "@/features/cases/api/schema"

// PRD1042-1794 (DRC usability) — who reaches the bank-side Case list and detail. Front Office and
// Back Office are the operational case workers (they own the upload/review actions inside the
// Documents tab), and they are exactly the bank roles the backend's case-read allows
// (`_CASE_READ_ROLES` = front_office, back_office, leasing_company_user). Bank Power User is
// deliberately NOT here: it is the authoring role (catalogue + document types), not an operational
// case worker, and the backend 404s /cases for it — so offering the nav would only lead to a dead
// page. leasing_company_user is absent too: an LC has its own /lc/... screens and sees only its own
// obligations, never the bank's case list.
export const CASE_READ_ALLOWED_ROLES: readonly UserRole[] = [
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
]

// Who may START a case from the bank-side UI. Front Office and Back Office — the same two the
// backend's _CASE_WRITE_ROLES allows on this surface (leasing_company_user also writes, but through
// its own portal, never the bank case list). Bank Power User is excluded: the configurator holds no
// case rights (four-eyes — a role that fills cases cannot also author the rules that gate them).
export const CASE_WRITE_ALLOWED_ROLES: readonly UserRole[] = [
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
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
