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
 * The step names and responsible roles are the design's own (`Add convenant.pdf`, `BO approval.pdf`):
 * steps 1–4 of phase A, with step 4 carrying four eyes.
 */
import type {
  ChecklistItemResponse,
  PhaseGateResponse,
} from "@/features/workflowTaskCatalog/api/runtimeSchema"

const FRONT_OFFICE_USER = "00000000-0000-4000-8000-000000000005"

type Seed = {
  n: number
  code: string
  name: string
  role: "front_office" | "back_office_risk"
  stage: ChecklistItemResponse["stage_categorization"]
  status: ChecklistItemResponse["status"]
  fourEyes?: boolean
  mandatory?: boolean
}

const SEEDS: Seed[] = [
  // Phase A — the four steps the design shows by name.
  {
    n: 1,
    code: "A-01",
    name: "Pre-inquiry form created & saved",
    role: "front_office",
    stage: "pre_submission",
    status: "checked",
  },
  {
    n: 2,
    code: "A-02",
    name: "Total commitment queried & saved",
    role: "front_office",
    stage: "pre_submission",
    status: "checked",
  },
  {
    n: 3,
    code: "A-03",
    name: "Check if lessee is already a customer",
    role: "front_office",
    stage: "pre_submission",
    status: "checked",
  },
  {
    n: 4,
    code: "A-04",
    name: "Process request & approve/reject",
    role: "back_office_risk",
    stage: "stage_1_review",
    status: "open",
    fourEyes: true,
  },

  // Phase B — documents the bank names and the leasing company delivers.
  {
    n: 5,
    code: "B-01",
    name: "Required documents requested",
    role: "front_office",
    stage: "stage_1_review",
    status: "open",
  },
  {
    n: 6,
    code: "B-02",
    name: "Uploaded documents checked",
    role: "front_office",
    stage: "stage_1_review",
    status: "open",
  },
  {
    n: 7,
    code: "B-03",
    name: "Document set signed off",
    role: "back_office_risk",
    stage: "stage_2_review",
    status: "open",
    fourEyes: true,
  },

  // Phase C — enrichment, calculation, core-system set-up.
  {
    n: 8,
    code: "C-01",
    name: "Contract data entered",
    role: "front_office",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: 9,
    code: "C-02",
    name: "Sollbelastung recorded",
    role: "front_office",
    stage: "stage_2_review",
    status: "open",
  },
  {
    n: 10,
    code: "C-03",
    name: "Bank settlement & payment plan produced",
    role: "front_office",
    stage: "pre_disbursement",
    status: "open",
  },
  {
    n: 11,
    code: "C-04",
    name: "Hand-over file exported to the core system",
    role: "front_office",
    stage: "pre_disbursement",
    status: "open",
  },

  // Phase D — approval and disbursement.
  {
    n: 12,
    code: "D-01",
    name: "Collateral determined",
    role: "back_office_risk",
    stage: "pre_disbursement",
    status: "open",
  },
  {
    n: 13,
    code: "D-02",
    name: "Collateral controlled",
    role: "back_office_risk",
    stage: "pre_disbursement",
    status: "open",
    fourEyes: true,
  },
  {
    n: 14,
    code: "D-03",
    name: "Disbursement confirmed",
    role: "back_office_risk",
    stage: "servicing",
    status: "open",
    fourEyes: true,
  },

  // Phase E — post-processing. Not optional and not minor: the spec is explicit that the interface
  // must show something still open after the money has left.
  {
    n: 15,
    code: "E-01",
    name: "Habenausgleich recorded",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: 16,
    code: "E-02",
    name: "Combined document built",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  {
    n: 17,
    code: "E-03",
    name: "Case filed electronically for ten-year retention",
    role: "front_office",
    stage: "servicing",
    status: "open",
  },
  // A step legitimately not applicable — the spec insists guarantor step 14 stays visible and is
  // marked not applicable rather than hidden (D-14).
  {
    n: 18,
    code: "E-04",
    name: "Guarantor documents filed",
    role: "front_office",
    stage: "servicing",
    status: "not_applicable",
  },
]

export function mockChecklist(
  businessObjectId: string
): ChecklistItemResponse[] {
  return SEEDS.map(s => ({
    id: `00000000-0000-4000-8000-000000${String(9000 + s.n)}`,
    business_object_id: businessObjectId,
    source_catalog_task_id: `00000000-0000-4000-8000-000000${String(8000 + s.n)}`,
    task_code: s.code,
    task_name: s.name,
    is_mandatory: s.mandatory ?? true,
    weight: null,
    responsible_role: s.role,
    responsible_roles: null,
    display_order: s.n,
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
