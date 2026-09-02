/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The case checklist, its required projection, and its phase gates. Marking an item is held in memory
 * for the session so ticking a step visibly sticks until reload — the checklist is the one screen where
 * an inert control would misrepresent what is built.
 */
import { http } from "msw"
import {
  ChecklistResponseSchema,
  PhaseGatesResponseSchema,
  RequiredProjectionResponseSchema,
  type ChecklistItemResponse,
} from "@/features/workflowTaskCatalog/api/runtimeSchema"
import { mockChecklist, mockPhaseGates } from "@/mocks/fixtures/checklist"
import { envelope, errorEnvelope } from "@/mocks/envelope"

const API = "*/api/v1"
const FRONT_OFFICE_USER = "00000000-0000-4000-8000-000000000005"

// Per business object, so two cases do not share a checklist.
const byObject = new Map<string, ChecklistItemResponse[]>()

function checklistFor(businessObjectId: string): ChecklistItemResponse[] {
  const existing = byObject.get(businessObjectId)
  if (existing) return existing
  const fresh = mockChecklist(businessObjectId)
  byObject.set(businessObjectId, fresh)
  return fresh
}

export const checklistHandlers = [
  http.get(
    `${API}/cases/:businessObjectId/checklist/required`,
    ({ params }) => {
      const items = checklistFor(String(params.businessObjectId))
      const required = items.filter(i => i.is_mandatory)
      return envelope(
        RequiredProjectionResponseSchema.parse({
          business_object_id: String(params.businessObjectId),
          all_required_done: required.every(i => i.status !== "open"),
          required_items: required,
        })
      )
    }
  ),

  http.get(`${API}/cases/:businessObjectId/phase-gates`, () =>
    envelope(PhaseGatesResponseSchema.parse(mockPhaseGates))
  ),

  http.get(`${API}/cases/:businessObjectId/checklist`, ({ params }) =>
    envelope(
      ChecklistResponseSchema.parse(
        checklistFor(String(params.businessObjectId))
      )
    )
  ),

  // PATCH one item's status. The status enum the contract accepts is open | checked | not_applicable —
  // two resolutions, not the spec's three marks. See the fixture's header note.
  http.patch(
    `${API}/cases/:businessObjectId/checklist/items/:itemId`,
    async ({ params, request }) => {
      const items = checklistFor(String(params.businessObjectId))
      const index = items.findIndex(i => i.id === params.itemId)
      if (index === -1)
        return errorEnvelope("NOT_FOUND", "Checklist item not found", 404)

      const body = (await request.json().catch(() => null)) as {
        status?: unknown
        note?: unknown
      } | null

      const status = body?.status
      if (
        status !== "checked" &&
        status !== "not_applicable" &&
        status !== "open"
      )
        return errorEnvelope("VALIDATION_ERROR", "Invalid status", 422)

      const updated: ChecklistItemResponse = {
        ...items[index],
        status,
        note: typeof body?.note === "string" ? body.note : items[index].note,
        checked_by: status === "open" ? null : FRONT_OFFICE_USER,
        checked_by_type: status === "open" ? null : "person",
        checked_at: status === "open" ? null : new Date().toISOString(),
      }
      items[index] = updated
      return envelope(updated, "CHECKLIST_ITEM_UPDATED")
    }
  ),
]
