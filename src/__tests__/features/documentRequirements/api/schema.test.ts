import { describe, it, expect } from "vitest"
import {
  DocumentRequirementCatalogListResponseSchema,
  DocumentRequirementListResponseSchema,
  DocumentRequirementSchema,
} from "@/features/documentRequirements/api/schema"

const CATALOG_UUID = "5c2d8b10-6a4f-4e9b-8c31-7d0a1f2b3c44"
const REQUIREMENT_UUID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"

const validRequirement = {
  id: REQUIREMENT_UUID,
  catalog_id: CATALOG_UUID,
  requirement_code: "DOC-FHA-001",
  document_type_name: "Asset registration confirmation",
  description: "Registry confirmation of the true-sale asset transfer.",
  is_active: true,
  sort_order: 10,
}

const validCatalogItem = {
  id: CATALOG_UUID,
  catalog_name: "FHA Standard 2024 documents",
  catalog_type: "product_specific",
  applicable_process_contexts: ["disbursement_readiness"],
  product_template_id: "11111111-2222-4333-8444-555555555555",
  valid_from: "2026-06-13",
  valid_to: null,
}

describe("DocumentRequirementSchema", () => {
  it("accepts the documented shape", () => {
    expect(DocumentRequirementSchema.parse(validRequirement)).toEqual(
      validRequirement
    )
  })

  it("accepts a null description", () => {
    expect(
      DocumentRequirementSchema.parse({
        ...validRequirement,
        description: null,
      }).description
    ).toBeNull()
  })

  it("rejects a non-uuid id", () => {
    expect(() =>
      DocumentRequirementSchema.parse({ ...validRequirement, id: "DOC-1" })
    ).toThrow()
  })

  it("rejects a missing requirement_code", () => {
    const withoutCode: Record<string, unknown> = { ...validRequirement }
    delete withoutCode.requirement_code
    expect(() => DocumentRequirementSchema.parse(withoutCode)).toThrow()
  })

  it("rejects is_active as a string", () => {
    expect(() =>
      DocumentRequirementSchema.parse({
        ...validRequirement,
        is_active: "true",
      })
    ).toThrow()
  })

  it("strips fields the FE does not model", () => {
    const parsed = DocumentRequirementSchema.parse({
      ...validRequirement,
      governance_classification: "regulatory",
      blocks_submission: true,
    }) as Record<string, unknown>

    expect(parsed.governance_classification).toBeUndefined()
    expect(parsed.blocks_submission).toBeUndefined()
    expect(parsed.requirement_code).toBe("DOC-FHA-001")
  })
})

describe("DocumentRequirementCatalogListResponseSchema", () => {
  it("accepts the paginated envelope", () => {
    const parsed = DocumentRequirementCatalogListResponseSchema.parse({
      items: [validCatalogItem],
      total: 1,
      page: 1,
      per_page: 50,
      total_pages: 1,
    })
    expect(parsed.items[0].catalog_name).toBe("FHA Standard 2024 documents")
  })

  it("accepts a global default catalogue with no product template", () => {
    const parsed = DocumentRequirementCatalogListResponseSchema.parse({
      items: [
        {
          ...validCatalogItem,
          catalog_type: "global_default",
          product_template_id: null,
        },
      ],
      total: 1,
      page: 1,
      per_page: 50,
      total_pages: 1,
    })
    expect(parsed.items[0].product_template_id).toBeNull()
  })

  it("rejects an unknown catalog_type", () => {
    expect(() =>
      DocumentRequirementCatalogListResponseSchema.parse({
        items: [{ ...validCatalogItem, catalog_type: "tenant_specific" }],
        total: 1,
        page: 1,
        per_page: 50,
        total_pages: 1,
      })
    ).toThrow()
  })

  it("rejects a missing pagination field", () => {
    expect(() =>
      DocumentRequirementCatalogListResponseSchema.parse({
        items: [validCatalogItem],
        total: 1,
        page: 1,
        per_page: 50,
      })
    ).toThrow()
  })
})

describe("DocumentRequirementListResponseSchema", () => {
  it("accepts an empty tenant with no requirements", () => {
    const parsed = DocumentRequirementListResponseSchema.parse({
      items: [],
      total: 0,
      page: 1,
      per_page: 50,
      total_pages: 0,
    })
    expect(parsed.items).toEqual([])
  })

  it("rejects items that are not requirement objects", () => {
    expect(() =>
      DocumentRequirementListResponseSchema.parse({
        items: [REQUIREMENT_UUID],
        total: 1,
        page: 1,
        per_page: 50,
        total_pages: 1,
      })
    ).toThrow()
  })
})
