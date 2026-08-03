import { api } from "@/lib/api"
import {
  ChecklistItemResponseSchema,
  ChecklistResponseSchema,
  PhaseGateResponseSchema,
  PhaseGatesResponseSchema,
  RequiredProjectionResponseSchema,
} from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type {
  ChecklistItemResponse,
  ChecklistResponse,
  PhaseGateResponse,
  PhaseGatesResponse,
  RequiredProjectionResponse,
  SetItemStatusRequest,
  SetPhaseGateRequest,
} from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { StageCategorization } from "@/features/workflowTaskCatalog/api/schema"

// Every key is scoped by business object, because that is the only thing identifying a case —
// there is no case entity in this app yet, so the UUID comes from the route.
export const CASE_CHECKLIST_QUERY_KEYS = {
  all: ["case-checklist"] as const,
  // The invalidation target for both mutations: setting an item status changes the required
  // projection too, and setting a gate can change nothing else but is cheap to refetch together.
  case: (businessObjectId: string) =>
    ["case-checklist", businessObjectId] as const,
  checklist: (businessObjectId: string) =>
    ["case-checklist", businessObjectId, "items"] as const,
  required: (businessObjectId: string) =>
    ["case-checklist", businessObjectId, "required"] as const,
  phaseGates: (businessObjectId: string) =>
    ["case-checklist", businessObjectId, "phase-gates"] as const,
} as const

// NOTE: there is deliberately no materialize function here, even though
// POST /cases/{business_object_id}/checklist exists. Materialization takes `amount_eur`, and CR
// PRD1042-1792 item 2 forbids collecting that figure from a person — it is the EUR 2M Contact
// Treasury threshold and must be read from the Financing server-side (1790 A5, open question
// Q-053). PRD1042-1556 does not ask for a materialization screen either. Add this only once the
// amount has come off the request.

// Raises WTC_CHECKLIST_NOT_FOUND (404) when nothing has been materialized for this case —
// `get_case_checklist` treats an empty list as absent. So a 404 here means "no checklist yet",
// not "broken", and the UI distinguishes the two by code.
export async function fetchCaseChecklist(
  businessObjectId: string
): Promise<ChecklistResponse> {
  const data = await api.get(`/cases/${businessObjectId}/checklist`)
  return ChecklistResponseSchema.parse(data)
}

export async function setChecklistItemStatus(
  businessObjectId: string,
  itemId: string,
  body: SetItemStatusRequest
): Promise<ChecklistItemResponse> {
  const data = await api.patch(
    `/cases/${businessObjectId}/checklist/items/${itemId}`,
    body
  )
  return ChecklistItemResponseSchema.parse(data)
}

export async function fetchCaseRequiredProjection(
  businessObjectId: string
): Promise<RequiredProjectionResponse> {
  const data = await api.get(`/cases/${businessObjectId}/checklist/required`)
  return RequiredProjectionResponseSchema.parse(data)
}

export async function fetchCasePhaseGates(
  businessObjectId: string
): Promise<PhaseGatesResponse> {
  const data = await api.get(`/cases/${businessObjectId}/phase-gates`)
  return PhaseGatesResponseSchema.parse(data)
}

export async function setCasePhaseGate(
  businessObjectId: string,
  phase: StageCategorization,
  body: SetPhaseGateRequest
): Promise<PhaseGateResponse> {
  const data = await api.patch(
    `/cases/${businessObjectId}/phase-gates/${phase}`,
    body
  )
  return PhaseGateResponseSchema.parse(data)
}
