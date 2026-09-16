import { describe, expect, it } from "vitest"
import {
  AssessmentCatalogueResponseSchema,
  AssessmentListResponseSchema,
} from "@/features/partners/api/assessmentSchema"

const PARTNER = "00000000-0000-4000-8000-00000000a001"
const SOURCE = "00000000-0000-4000-8000-0000000a5c10"
const ATTRIBUTE = "00000000-0000-4000-8000-0000000a5a10"

function listWith(valueOverrides: Record<string, unknown>) {
  return {
    partner_id: PARTNER,
    items: [
      {
        id: "00000000-0000-4000-8000-0000000a5e10",
        partner_id: PARTNER,
        source_type_id: SOURCE,
        source_type_code: "CREFO",
        source_type_name: "Creditreform",
        report_date: "2026-08-12",
        source_reference: null,
        case_id: null,
        contract_id: null,
        role: null,
        context_note: null,
        cancelled_at: null,
        cancel_reason: null,
        created_by: "00000000-0000-4000-8000-000000000003",
        created_at: "2026-08-12T08:40:00Z",
        values: [
          {
            attribute_id: ATTRIBUTE,
            attribute_code: "SOLVENCY_INDEX",
            attribute_name: "Solvency index",
            value_number: "212",
            value_text: null,
            no_value_supplied: false,
            ...valueOverrides,
          },
        ],
      },
    ],
  }
}

describe("AssessmentListResponseSchema", () => {
  it("accepts a record with a numeric value", () => {
    expect(() => AssessmentListResponseSchema.parse(listWith({}))).not.toThrow()
  })

  // "The agency returned no score" is a fact of its own, distinct from an empty field, and the
  // schema has to let a row carry it with both value columns null.
  it("accepts a value the source did not supply", () => {
    expect(() =>
      AssessmentListResponseSchema.parse(
        listWith({ value_number: null, no_value_supplied: true })
      )
    ).not.toThrow()
  })

  // Decimal STRING. Coercing it would turn a null into a convincing 0 — the same reason every
  // other money field on this API is a string.
  it("rejects a numeric value_number", () => {
    expect(() =>
      AssessmentListResponseSchema.parse(listWith({ value_number: 212 }))
    ).toThrow()
  })
})

describe("AssessmentCatalogueResponseSchema", () => {
  it("accepts a free-text-only source with no attributes", () => {
    expect(() =>
      AssessmentCatalogueResponseSchema.parse({
        source_types: [
          {
            id: SOURCE,
            code: "INTERNAL",
            name: "Internal assessment",
            free_text_only: true,
            attributes: [],
          },
        ],
      })
    ).not.toThrow()
  })

  it("rejects a source type missing its free_text_only flag", () => {
    expect(() =>
      AssessmentCatalogueResponseSchema.parse({
        source_types: [{ id: SOURCE, code: "X", name: "X", attributes: [] }],
      })
    ).toThrow()
  })
})
