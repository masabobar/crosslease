/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The pending-approvals list. Its reason for existing is narrow and specific: a **condition
 * waiver** (US 1.21) is a governed action, and until `financing_approval_condition_waive` was
 * added to `GovernedActionTypeSchema` a single one of these made
 * `PaginatedGovernedActionsSchema.parse()` throw and rendered the entire page as an error. That
 * defect was invisible to type-check, lint and the unit suite, and could only be seen by opening
 * the page — so the fixture leads with a waiver.
 *
 * Output is parsed through the **real** schema, so a fixture that drifts throws here rather than
 * reaching the screen.
 */
import { http } from "msw"
import { PaginatedGovernedActionsSchema } from "@/features/governedActions/api/schema"
import { envelope } from "@/mocks/envelope"
import { API } from "@/mocks/apiBase"

const INITIATOR = {
  user_id: "USR-00042",
  first_name: "Bank",
  last_name: "Power User",
  role: "bank_power_user",
  tenant_id: null,
}

const actions = [
  {
    id: "00000000-0000-4000-8000-0000000aa001",
    action_type: "financing_approval_condition_waive",
    subject_type: "approval_condition",
    subject_id: "00000000-0000-4000-8000-0000000ac001",
    tenant_id: null,
    status: "pending",
    initiator_id: "00000000-0000-4000-8000-000000000042",
    approver_id: null,
    // Open record in the contract — deliberately sparse, since no key is read from it.
    display_snapshot: {},
    initiator_snapshot: INITIATOR,
    approver_snapshot: null,
    execution_params: {},
    reason: "The guarantee will not arrive before the planned payout date.",
    approver_comment: null,
    expires_at: null,
    resolved_at: null,
    correlation_id: null,
    created_at: "2026-09-08T09:12:00Z",
    updated_at: "2026-09-08T09:12:00Z",
  },
  {
    id: "00000000-0000-4000-8000-0000000aa002",
    action_type: "partner_confirm",
    subject_type: "partner",
    subject_id: "00000000-0000-4000-8000-00000000ab01",
    tenant_id: null,
    status: "pending",
    initiator_id: "00000000-0000-4000-8000-000000000042",
    approver_id: null,
    display_snapshot: { partner_id: "PRT-00017" },
    initiator_snapshot: INITIATOR,
    approver_snapshot: null,
    execution_params: {},
    reason: null,
    approver_comment: null,
    expires_at: null,
    resolved_at: null,
    correlation_id: null,
    created_at: "2026-09-07T14:03:00Z",
    updated_at: "2026-09-07T14:03:00Z",
  },
]

export const governedActionHandlers = [
  http.get(`${API}/governed-actions`, ({ request }) => {
    const status = new URL(request.url).searchParams.get("status")
    const rows =
      status === null || status === "" || status === "all"
        ? actions
        : actions.filter(a => a.status === status)
    return envelope(
      PaginatedGovernedActionsSchema.parse({
        actions: rows,
        total: rows.length,
        page: 1,
        per_page: 25,
        total_pages: 1,
      })
    )
  }),
]
