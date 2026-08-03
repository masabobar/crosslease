import type { UserRole } from "@/features/users/types"

// Per PRD1042-1158/1159/1180 permission matrices: Power User (bank_power_user) is the
// sole authoring role — unlike Product Templates/Framework Agreements, system_admin has
// no authority over this bank-level catalog.
export const WORKFLOW_TASK_CATALOG_MANAGE_ALLOWED_ROLES: readonly UserRole[] = [
  "bank_power_user",
]

// support_user/auditor get read-only diagnostic access; front_office, back_office,
// system_admin, and leasing_company_user have no access at all (bank-internal, WTC-12).
export const WORKFLOW_TASK_CATALOG_READ_ALLOWED_ROLES: readonly UserRole[] = [
  "bank_power_user",
  "support_user",
  "auditor",
]

export type WorkflowTaskCatalogDetailTab =
  | "identity"
  | "taskDefinitions"
  | "auditTrail"

// ---------------------------------------------------------------------------
// Runtime (case checklist + phase gates) — SEPARATE constants, not a widening.
//
// The catalog constants above must never be widened to admit front_office/back_office: the
// catalogue is bank-internal configuration and letting the case workers in there would hand them
// the authoring surface as a side effect. These three mirror
// refinext-api .../workflow_task_catalog/interfaces/http/routes/cases.py, which is the source of
// truth — read from it rather than inferred from the permission tables.
// ---------------------------------------------------------------------------

// Mirrors _RUNTIME_READ_ROLES. leasing_company_user is absent by design — LC users never see a
// checklist surface at all (CR PRD1042-1554 B10). system_admin is absent because v9 gives it
// nothing in this epic.
export const CASE_CHECKLIST_READ_ALLOWED_ROLES: readonly UserRole[] = [
  "bank_power_user",
  "back_office",
  "front_office",
  "support_user",
  "auditor",
]

// Mirrors _RUNTIME_WRITE_ROLES — who may complete or waive an item.
//
// This is as narrow as the wire allows, and it is NOT as narrow as the CR wants. PRD1042-1792 item
// 6 requires that a worker only act on items carrying their own responsible role, but
// `ChecklistItemResponse` does not carry `responsible_role` at all (1790 B7), so the item cannot
// say whose it is. Every holder of this role can therefore action every item. That is a known,
// filed gap — open-questions.md Q-052 — deliberately left visible rather than faked with a guessed
// role mapping.
export const CASE_CHECKLIST_WRITE_ALLOWED_ROLES: readonly UserRole[] = [
  "front_office",
  "back_office",
]

// Who may decide a phase gate.
//
// ⚠️ DELIBERATELY NARROWER THAN THE BACKEND. `_PHASE_GATE_DECIDE_ROLES` in cases.py is
// {BANK_POWER_USER, BACK_OFFICE} — and admitting the Bank Admin is precisely the defect CR
// PRD1042-1790 A3 raises: the role that authors the checklist must not also sign off the phases
// that checklist governs, or the separation the whole role model rests on is gone. PRD1042-1792
// item 1 makes the FE requirement explicit: the Power User "keeps the catalogue screens and read
// access to a case checklist, and loses the gate action."
//
// So this is the one place the screen is stricter than the server. It is not a security control —
// the BE would still accept a Bank Admin's decision if one were sent — it stops the UI from
// offering an action the CR says should not exist. Remove this comment only when the BE narrows
// _PHASE_GATE_DECIDE_ROLES to Back Office and the two agree again.
//
// front_office is correctly absent, both here and server-side: Front Office creates and enriches,
// Back Office approves (1790 A3 "Not to be changed" — MaRisk BTO 1.1).
export const CASE_PHASE_GATE_DECIDE_ALLOWED_ROLES: readonly UserRole[] = [
  "back_office",
]
