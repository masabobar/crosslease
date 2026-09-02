/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * A case set shaped from the PRD1042-11 spec and the delivered Figma frames, so the list exercises the
 * real variation rather than seven identical rows:
 *
 *  - all seven case types (spec §2.1), because the list's Case type filter is only meaningful with them
 *  - `RR-` references while a case is a refinancing request, `FIN-` once approved — the prefix switch
 *    the spec makes a rule and the design shows on both screens
 *  - a portal case with `owner_user_id: null`, because "unassigned is a legitimate state" (spec §2.3)
 *    and the Front Office work list is where it lands
 *  - one `routing_exception: true` row, so the marker for a case type with no routing row is visible
 *  - `display_status` values taken from the design's badges (`Submitted`, `Live`) and the spec's
 *    request statuses — it is a derived display value, deliberately typed as a plain string
 *
 * Company names are the design mockups' own placeholders. No real person's name appears here.
 */
import type { Case } from "@/features/cases/api/schema"

const FRONT_OFFICE_USER = "00000000-0000-4000-8000-000000000005"
const LC_PARTNER = "00000000-0000-4000-8000-00000000a001"

export const mockCases: Case[] = [
  {
    id: "00000000-0000-4000-8000-00000000c001",
    case_reference: "RR-2026-104",
    case_type: "refinancing_request",
    case_status: "open",
    display_status: "Submitted",
    origin: "wizard",
    owner_user_id: FRONT_OFFICE_USER,
    lc_partner_id: LC_PARTNER,
    routing_exception: false,
    created_by: "Front Office",
    created_at: "2026-08-12T09:14:00Z",
  },
  {
    id: "00000000-0000-4000-8000-00000000c002",
    case_reference: "RR-2026-118",
    case_type: "refinancing_request",
    case_status: "open",
    display_status: "Draft",
    origin: "wizard",
    owner_user_id: FRONT_OFFICE_USER,
    lc_partner_id: LC_PARTNER,
    routing_exception: false,
    created_by: "Front Office",
    created_at: "2026-08-28T14:02:00Z",
  },
  // Arrived through the portal, so nobody has picked it up — the case the spec says lands unassigned
  // in the Front Office work list with an origin mark.
  {
    id: "00000000-0000-4000-8000-00000000c003",
    case_reference: "RR-2026-121",
    case_type: "refinancing_request",
    case_status: "open",
    display_status: "Submitted",
    origin: "portal",
    owner_user_id: null,
    lc_partner_id: LC_PARTNER,
    routing_exception: false,
    created_by: "Leasing Company",
    created_at: "2026-09-01T07:41:00Z",
  },
  {
    id: "00000000-0000-4000-8000-00000000c004",
    case_reference: "RR-2026-097",
    case_type: "refinancing_request",
    case_status: "waiting",
    display_status: "Missing information",
    origin: "wizard",
    owner_user_id: FRONT_OFFICE_USER,
    lc_partner_id: LC_PARTNER,
    routing_exception: false,
    created_by: "Front Office",
    created_at: "2026-07-30T11:20:00Z",
  },
  {
    id: "00000000-0000-4000-8000-00000000c005",
    case_reference: "FIN-2026-066",
    case_type: "refinancing_request",
    case_status: "open",
    display_status: "Live",
    origin: "wizard",
    owner_user_id: FRONT_OFFICE_USER,
    lc_partner_id: LC_PARTNER,
    routing_exception: false,
    created_by: "Front Office",
    created_at: "2026-06-02T08:05:00Z",
  },
  {
    id: "00000000-0000-4000-8000-00000000c006",
    case_reference: "PR-2026-012",
    case_type: "package_redemption",
    case_status: "open",
    display_status: "Open",
    origin: "wizard",
    owner_user_id: FRONT_OFFICE_USER,
    lc_partner_id: LC_PARTNER,
    routing_exception: false,
    created_by: "Front Office",
    created_at: "2026-08-19T13:33:00Z",
  },
  {
    id: "00000000-0000-4000-8000-00000000c007",
    case_reference: "SR-2026-044",
    case_type: "single_redemption",
    case_status: "done",
    display_status: "Done",
    origin: "wizard",
    owner_user_id: FRONT_OFFICE_USER,
    lc_partner_id: LC_PARTNER,
    routing_exception: false,
    created_by: "Back Office",
    created_at: "2026-05-14T10:02:00Z",
  },
  {
    id: "00000000-0000-4000-8000-00000000c008",
    case_reference: "LC-2026-007",
    case_type: "lessee_change",
    case_status: "open",
    display_status: "Open",
    origin: "wizard",
    owner_user_id: null,
    lc_partner_id: LC_PARTNER,
    routing_exception: false,
    created_by: "Front Office",
    created_at: "2026-08-25T15:47:00Z",
  },
  {
    id: "00000000-0000-4000-8000-00000000c009",
    case_reference: "OS-2026-003",
    case_type: "object_swap",
    case_status: "open",
    display_status: "Open",
    origin: "wizard",
    owner_user_id: FRONT_OFFICE_USER,
    lc_partner_id: LC_PARTNER,
    routing_exception: false,
    created_by: "Front Office",
    created_at: "2026-08-30T09:58:00Z",
  },
  // A case type with no row in the routing table: it is never refused, it lands unassigned and carries
  // a visible marker (spec §3.3, Routing fallback).
  {
    id: "00000000-0000-4000-8000-00000000c010",
    case_reference: "AE-2026-001",
    case_type: "asset_event",
    case_status: "open",
    display_status: "Open",
    origin: "wizard",
    owner_user_id: null,
    lc_partner_id: LC_PARTNER,
    routing_exception: true,
    created_by: "Front Office",
    created_at: "2026-09-01T16:12:00Z",
  },
  {
    id: "00000000-0000-4000-8000-00000000c011",
    case_reference: "EX-2026-002",
    case_type: "extension",
    case_status: "cancelled",
    display_status: "Cancelled",
    origin: "wizard",
    owner_user_id: FRONT_OFFICE_USER,
    lc_partner_id: LC_PARTNER,
    routing_exception: false,
    created_by: "Back Office",
    created_at: "2026-06-21T12:30:00Z",
  },
]
