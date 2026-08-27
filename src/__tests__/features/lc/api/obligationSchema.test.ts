import { describe, it, expect } from "vitest"
import {
  LCObligationItemSchema,
  LCObligationResponseSchema,
} from "@/features/lc/api/schema"

const OBJECT_UUID = "3f1c9a2e-0b7d-4c5e-8a11-9d2e6f4b7c80"
const REQUIREMENT_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"

// Matches the backend LCObligationItem exactly (verify against src/generated/api.ts): a requirement
// handle, the document type, whether it is required, its LC-vocabulary status and whether the company
// still has to act. Nothing else is sent.
const validObligation = {
  requirement_definition_id: REQUIREMENT_UUID,
  document_type_name: "Lease contract",
  is_mandatory: true,
  fulfilment_status: "outstanding",
  action_needed: true,
}

const validResponse = {
  business_object_id: OBJECT_UUID,
  case_type: "refinancing_request",
  documents_status_summary: "1 document outstanding",
  obligations: [validObligation],
}

describe("LCObligationItemSchema", () => {
  it("accepts an outstanding obligation", () => {
    const parsed = LCObligationItemSchema.parse(validObligation)
    expect(parsed.document_type_name).toBe("Lease contract")
    expect(parsed.requirement_definition_id).toBe(REQUIREMENT_UUID)
    expect(parsed.action_needed).toBe(true)
  })

  it("carries the requirement handle the LC upload sends back", () => {
    const parsed = LCObligationItemSchema.parse({
      ...validObligation,
      fulfilment_status: "provided",
      action_needed: false,
    })
    // PRD1042-1794 — this is the id POST /cases/{case_id}/documents needs; without it the LC screen
    // could not offer an upload.
    expect(parsed.requirement_definition_id).toBe(REQUIREMENT_UUID)
    expect(parsed.action_needed).toBe(false)
  })

  // PRD1042-1796 item 9 forbids the catalogue, the layers, the conditions, which layer won and
  // whether a requirement blocks on a leasing-company screen. The shape cannot carry them, so the
  // screen cannot leak them even by mistake — that is the guarantee, not a rendering choice.
  it("strips anything item 9 forbids rather than surfacing it", () => {
    const parsed = LCObligationItemSchema.parse({
      ...validObligation,
      source_layer: "override",
      is_blocking: true,
      classification: "mandatory",
      condition: { attribute: "x" },
      catalog_id: OBJECT_UUID,
    })
    for (const forbidden of [
      "source_layer",
      "is_blocking",
      "classification",
      "condition",
      "catalog_id",
    ]) {
      expect(forbidden in parsed).toBe(false)
    }
  })

  // The status arrives in the LC vocabulary, mapped by the backend. Parsed as a plain string so a
  // status added there widens the screen instead of blanking it.
  it("accepts a status this frontend does not know yet", () => {
    const parsed = LCObligationItemSchema.parse({
      ...validObligation,
      fulfilment_status: "waived",
    })
    expect(parsed.fulfilment_status).toBe("waived")
  })

  it("rejects a non-uuid requirement handle", () => {
    expect(() =>
      LCObligationItemSchema.parse({
        ...validObligation,
        requirement_definition_id: "req-1",
      })
    ).toThrow()
  })

  it("rejects an obligation missing the requirement handle", () => {
    const { requirement_definition_id: _omitted, ...withoutHandle } =
      validObligation
    void _omitted
    expect(() => LCObligationItemSchema.parse(withoutHandle)).toThrow()
  })
})

describe("LCObligationResponseSchema", () => {
  it("accepts the response addressed by object id alone", () => {
    const parsed = LCObligationResponseSchema.parse(validResponse)
    expect(parsed.case_type).toBe("refinancing_request")
    expect(parsed.obligations).toHaveLength(1)
  })

  it("accepts a case with nothing outstanding", () => {
    const parsed = LCObligationResponseSchema.parse({
      ...validResponse,
      obligations: [],
    })
    expect(parsed.obligations).toEqual([])
  })

  it("rejects a missing status summary", () => {
    const { documents_status_summary: _omitted, ...withoutSummary } =
      validResponse
    void _omitted
    expect(() => LCObligationResponseSchema.parse(withoutSummary)).toThrow()
  })
})
