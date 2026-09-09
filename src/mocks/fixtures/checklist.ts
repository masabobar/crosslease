/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The runtime checklist for a case, plus its phase gates.
 *
 * Two things worth knowing before reading this, both recorded as findings rather than smoothed over:
 *
 *  1. `ChecklistItemStatusSchema` is `open | checked | not_applicable` — **two** resolutions. The spec's
 *     mark set is three: *in order / not in order / not applicable*. The implementation matches the
 *     client's click dummy, not the spec (design extract §10, finding 2). The fixture follows the
 *     implemented contract, because that is what `parse()` accepts.
 *  2. `StageCategorizationSchema` has **six** stages (`pre_submission` … `redemption`), while the
 *     delivered design shows **five** phases A–E (Application & credit review → Post-processing).
 *     They are different models. The fixture uses the implemented six.
 *
 * The step list is the click dummy's own `DB.checklist` — **41 steps**, A 3 · B 8 · C 9 · D 9 ·
 * E 12, which is the 41 its progress band reports.
 *
 * It is 41 and not the sheet's 45 because the dummy drops four of them, and the four it drops make
 * the rule clear: step 1 (pre-enquiry form) and the three **LeasySoft** steps — 13, 14 and 33b.
 * Those are work done in another system, not to-dos the platform tracks. `n` keeps the sheet's own
 * number, so the mapping back to the client's document survives.
 *
 * Roles and four eyes are the dummy's per-step values, not inferred: three steps carry four eyes —
 * sheet 4, 28 and 38.
 */
import { mockUuid } from "@/mocks/uuid"
import type {
  ChecklistItemResponse,
  PhaseGateResponse,
} from "@/features/workflowTaskCatalog/api/runtimeSchema"

const FRONT_OFFICE_USER = "00000000-0000-4000-8000-000000000005"

type Seed = {
  /** The step id as the client's sheet numbers it — a string, because 33 is split into 33a / 33b. */
  n: string
  code: string
  name: string
  role: "front_office" | "back_office_risk"
  stage: ChecklistItemResponse["stage_categorization"]
  status: ChecklistItemResponse["status"]
  fourEyes?: boolean
  mandatory?: boolean
}

const SEEDS: Seed[] = [
  {
    n: "2",
    code: "A-1",
    name: "Total exposure queried and saved",
    role: "front_office",
    stage: "pre_submission",
    status: "checked",
  },
  {
    n: "3",
    code: "A-2",
    name: "Check whether the lessee is a customer of the bank",
    role: "front_office",
    stage: "pre_submission",
    status: "checked",
  },
  {
    n: "4",
    code: "A-3",
    name: "Process the request and approve or reject it",
    role: "back_office_risk",
    stage: "pre_submission",
    status: "open",
    fourEyes: true,
  },
  {
    n: "5",
    code: "B-1",
    name: "Settlement documents saved",
    role: "front_office",
    stage: "stage_1_review",
    status: "open",
  },
  {
    n: "6",
    code: "B-2",
    name: "Settlement documents complete (yes / no)",
    role: "front_office",
    stage: "stage_1_review",
    status: "open",
  },
  {
    n: "7",
    code: "B-3",
    name: "Payment advice present",
    role: "front_office",
    stage: "stage_1_review",
    status: "open",
  },
  {
    n: "8",
    code: "B-4",
    name: "Pre-financing checked with the bank",
    role: "front_office",
    stage: "stage_1_review",
    status: "open",
  },
  {
    n: "9",
    code: "B-5",
    name: "Entered on the pre-financing list",
    role: "front_office",
    stage: "stage_1_review",
    status: "open",
  },
  {
    n: "10",
    code: "B-6",
    name: "Release declaration requested",
    role: "front_office",
    stage: "stage_1_review",
    status: "open",
  },
  {
    n: "11",
    code: "B-7",
    name: "Missing or incomplete documents requested",
    role: "front_office",
    stage: "stage_1_review",
    status: "open",
  },
  {
    n: "12",
    code: "B-8",
    name: "Back office informed that the refinancing rate period is expiring",
    role: "front_office",
    stage: "stage_1_review",
    status: "open",
  },
  {
    n: "15",
    code: "C-1",
    name: "Bank settlement and repayment schedule created and saved",
    role: "front_office",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: "16",
    code: "C-2",
    name: "Settlement documents checked for content (8 sub-points)",
    role: "back_office_risk",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: "17",
    code: "C-3",
    name: "Control of the bank settlement carried out",
    role: "back_office_risk",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: "18",
    code: "C-4",
    name: "Loan set up in OS+ and the OS+ repayment schedule saved",
    role: "back_office_risk",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: "19",
    code: "C-5",
    name: "Rate changes and residual value taken from the OS+ schedule",
    role: "back_office_risk",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: "20",
    code: "C-6",
    name: "Event created for more than 5 pre-dated rate changes",
    role: "back_office_risk",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: "21",
    code: "C-7",
    name: "Account collector recorded and saved",
    role: "back_office_risk",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: "22",
    code: "C-8",
    name: "Contract number in the account note and the holding unit recorded",
    role: "back_office_risk",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: "23",
    code: "C-9",
    name: "Loan disbursement recorded and saved",
    role: "front_office",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: "24",
    code: "D-1",
    name: "Loan offer created and saved",
    role: "front_office",
    stage: "pre_disbursement",
    status: "open",
  },
  {
    n: "25",
    code: "D-2",
    name: "Report to Treasury (form DF090965) — from EUR 2 m financing amount",
    role: "back_office_risk",
    stage: "pre_disbursement",
    status: "open",
  },
  {
    n: "26",
    code: "D-3",
    name: "Control of loan setup and rate change",
    role: "back_office_risk",
    stage: "pre_disbursement",
    status: "open",
  },
  {
    n: "27",
    code: "D-4",
    name: "Control of the event(s) for more than 5 rate changes",
    role: "back_office_risk",
    stage: "pre_disbursement",
    status: "open",
  },
  {
    n: "28",
    code: "D-5",
    name: "Release of rate change, account collector and disbursement in OS+",
    role: "back_office_risk",
    stage: "pre_disbursement",
    status: "open",
    fourEyes: true,
  },
  {
    n: "29",
    code: "D-6",
    name: "Loan offer checked and signed",
    role: "back_office_risk",
    stage: "pre_disbursement",
    status: "open",
  },
  {
    n: "30",
    code: "D-7",
    name: "Booking voucher signed",
    role: "back_office_risk",
    stage: "pre_disbursement",
    status: "open",
  },
  {
    n: "31",
    code: "D-8",
    name: "Disbursement added to the pre-financing list",
    role: "front_office",
    stage: "pre_disbursement",
    status: "open",
  },
  {
    n: "32",
    code: "D-9",
    name: "Loan offer and repayment schedule sent to the customer",
    role: "front_office",
    stage: "pre_disbursement",
    status: "open",
  },
  {
    n: "33a",
    code: "E-1",
    name: "Core-banking loan number recorded",
    role: "back_office_risk",
    stage: "servicing",
    status: "open",
  },
  {
    n: "34",
    code: "E-2",
    name: "Cover sheet created and saved",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: "35",
    code: "E-3",
    name: "Collateral recorded and saved",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: "36",
    code: "E-4",
    name: "Vehicle valuation queried and saved (for vehicle security transfer)",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: "37",
    code: "E-5",
    name: "Cover sheet filled in and signed",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: "38",
    code: "E-6",
    name: "Control of the collateral recording carried out (distinct second approver)",
    role: "back_office_risk",
    stage: "servicing",
    status: "open",
    fourEyes: true,
  },
  {
    n: "39",
    code: "E-7",
    name: "Customer-signed loan offer — identification performed, scanned and saved",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: "40",
    code: "E-8",
    name: "Customer-signed loan offer (original) filed",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: "41",
    code: "E-9",
    name: "Archivability checked",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: "42",
    code: "E-10",
    name: "All individual documents merged",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: "43",
    code: "E-11",
    name: "Filed in the electronic archive",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: "44",
    code: "E-12",
    name: "Case folder moved to “done” on the refinancing drive",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
]

export function mockChecklist(
  businessObjectId: string
): ChecklistItemResponse[] {
  return SEEDS.map((s, index) => ({
    // Built through `mockUuid`, which refuses a non-hex tag — the step id is not usable as one
    // ("33a" is fine, but a bare number is not 12 characters), so the row's index is the tag.
    id: mockUuid(`c1${index.toString(16).padStart(2, "0")}`),
    business_object_id: businessObjectId,
    source_catalog_task_id: mockUuid(
      `c2${index.toString(16).padStart(2, "0")}`
    ),
    task_code: s.code,
    task_name: s.name,
    is_mandatory: s.mandatory ?? true,
    weight: null,
    responsible_role: s.role,
    responsible_roles: null,
    // The list is already in the sheet's order, and the id is a string ("33a"), so the position
    // carries the numbering the user reads.
    display_order: index + 1,
    stage_categorization: s.stage,
    task_type: "checkbox",
    applicability: "always",
    four_eyes: s.fourEyes ?? false,
    doc_requirement_ref: null,
    status: s.status,
    note: null,
    checked_by: s.status === "open" ? null : FRONT_OFFICE_USER,
    checked_by_type: s.status === "open" ? null : "person",
    checked_at: s.status === "open" ? null : "2026-08-14T10:22:00Z",
    checks: [],
  }))
}

// A gate row is created lazily, on the first decision — so a phase nobody has decided has NO row, and
// the screen must not render an `open` state for it. Only the first two appear here for that reason.
export const mockPhaseGates: PhaseGateResponse[] = [
  {
    phase: "pre_submission",
    status: "approved",
    gate_approver: FRONT_OFFICE_USER,
    decided_at: "2026-08-14T10:30:00Z",
    note: null,
  },
  {
    phase: "stage_1_review",
    status: "in_review",
    gate_approver: null,
    decided_at: null,
    note: null,
  },
]
