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

/**
 * `display_status` is a **display string** on the wire, not an enum — the backend sends
 * `"Missing information"`, `"Submitted"`, `"Ready for setup"`: Title Case, with spaces.
 *
 * ── WHY THIS SLUG EXISTS ───────────────────────────────────────────────────────────────────────
 * The tone map and the i18n catalogue are both keyed `lowercase_snake`, and before this they were
 * looked up with the raw wire value. Every lookup therefore missed, which produced two live
 * defects: every status badge fell through to the neutral variant (so the list was a column of
 * identical grey pills instead of the design's colours), and every label fell through to `t()`'s
 * `defaultValue` — meaning the **German locale silently rendered the English wire string**.
 *
 * Normalising here fixes both at once, and keeps the key format stable if the backend adjusts its
 * capitalisation or spacing.
 */
export function caseDisplayStatusSlug(status: CaseDisplayStatus): string {
  return status.trim().toLowerCase().replace(/\s+/g, "_")
}

type CaseStatusTone =
  | "info"
  | "success"
  | "warning"
  | "pending"
  | "accent"
  | "neutral"
  | "destructive"

/**
 * Status → badge tone, keyed by the slug above. Colours are read off the Figma frame
 * (`CREATE NEW.pdf` frame 1): blue in flight, green good, orange needs-you, amber waiting,
 * purple finished, red refused, grey inert.
 *
 * A lookup with a neutral fallback rather than an exhaustive `Record`, deliberately: the backend
 * widens this set independently, and a status it adds must render as a plain grey pill rather than
 * crash on an undefined variant.
 */
export const CASE_DISPLAY_STATUS_BADGE_VARIANT: Record<string, CaseStatusTone> =
  {
    // Not yet acted on, nothing wrong — the same blue as `submitted`.
    open: "info",
    submitted: "info",
    // A refinancing request derives its display from request_status: it starts "draft" and flips to
    // "submitted" once its mandatory documents are complete (PRD1042-1794, interim). Grey → blue
    // reads as forward progress.
    draft: "neutral",
    // Waiting on the next step rather than on the reader.
    waiting: "pending",
    ready_for_setup: "pending",
    // Something is missing and someone has to supply it — the design's orange, distinct from amber
    // on purpose, because these two demand different people's attention.
    missing_information: "warning",
    rework: "warning",
    // Good outcomes. `live` is the design's label for an active financing.
    approved: "success",
    committed: "success",
    live: "success",
    // Finished, in the design's purple.
    done: "accent",
    // Negative terminal.
    rejected: "destructive",
    // Inert terminal — ended without a verdict, so neither green nor red.
    cancelled: "neutral",
  }

export function caseDisplayStatusBadgeVariant(
  status: CaseDisplayStatus
): CaseStatusTone {
  return (
    CASE_DISPLAY_STATUS_BADGE_VARIANT[caseDisplayStatusSlug(status)] ??
    "neutral"
  )
}
