import { describe, it, expect } from "vitest"
import {
  LCObligationItemSchema,
  LCObligationResponseSchema,
} from "@/features/lc/api/schema"

const OBJECT_UUID = "3f1c9a2e-0b7d-4c5e-8a11-9d2e6f4b7c80"
const DOCUMENT_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"

const validObligation = {
  document_type_name: "Lease contract",
  is_mandatory: true,
  fulfilment_status: "outstanding",
  action_needed: true,
  document_origin: "uploaded",
  linked_document_id: null,
}

const validResponse = {
  business_object_id: OBJECT_UUID,
  process_context: null,
  documents_status_summary: "1 document outstanding",
  obligations: [validObligation],
}

describe("LCObligationItemSchema", () => {
  it("accepts an outstanding obligation", () => {
    const parsed = LCObligationItemSchema.parse(validObligation)
    expect(parsed.document_type_name).toBe("Lease contract")
    expect(parsed.linked_document_id).toBeNull()
  })

  it("carries the document once the obligation is met", () => {
    const parsed = LCObligationItemSchema.parse({
      ...validObligation,
      fulfilment_status: "provided",
      action_needed: false,
      linked_document_id: DOCUMENT_UUID,
    })
    expect(parsed.linked_document_id).toBe(DOCUMENT_UUID)
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

  it("rejects a non-uuid document reference", () => {
    expect(() =>
      LCObligationItemSchema.parse({
        ...validObligation,
        linked_document_id: "doc-1",
      })
    ).toThrow()
  })
})

describe("LCObligationResponseSchema", () => {
  it("accepts the response addressed by object id alone", () => {
    const parsed = LCObligationResponseSchema.parse(validResponse)
    // Null rather than a checkpoint the company never named.
    expect(parsed.process_context).toBeNull()
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
