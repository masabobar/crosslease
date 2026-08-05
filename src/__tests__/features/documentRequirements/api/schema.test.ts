import { describe, it, expect } from "vitest"
import {
  CreateDocumentRequirementCatalogRequestSchema,
  DocumentRequirementCatalogListResponseSchema,
  DocumentRequirementCatalogResponseSchema,
  DocumentRequirementListResponseSchema,
  DocumentRequirementSchema,
} from "@/features/documentRequirements/api/schema"

const CATALOG_UUID = "5c2d8b10-6a4f-4e9b-8c31-7d0a1f2b3c44"
const REQUIREMENT_UUID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
const TEMPLATE_UUID = "11111111-2222-4333-8444-555555555555"
const USER_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"

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
  product_template_id: TEMPLATE_UUID,
  valid_from: "2026-06-13",
  valid_to: null,
  created_at: "2026-06-13T10:00:00Z",
}

const validCreateRequest = {
  catalog_name: "FHA Standard 2024 documents",
  catalog_type: "product_specific",
  applicable_process_contexts: ["disbursement_readiness"],
  product_template_id: TEMPLATE_UUID,
  valid_from: "2026-06-13",
  valid_to: null,
}

const validCatalogResponse = {
  ...validCreateRequest,
  id: CATALOG_UUID,
  created_by: USER_UUID,
  created_at: "2026-06-13T10:00:00Z",
  updated_at: "2026-06-13T10:00:00Z",
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

  it("rejects a list item missing created_at", () => {
    const withoutCreatedAt: Record<string, unknown> = { ...validCatalogItem }
    delete withoutCreatedAt.created_at
    expect(() =>
      DocumentRequirementCatalogListResponseSchema.parse({
        items: [withoutCreatedAt],
        total: 1,
        page: 1,
        per_page: 50,
        total_pages: 1,
      })
    ).toThrow()
  })
})

describe("CreateDocumentRequirementCatalogRequestSchema", () => {
  it("accepts the documented shape", () => {
    expect(
      CreateDocumentRequirementCatalogRequestSchema.parse(validCreateRequest)
    ).toEqual(validCreateRequest)
  })

  it("accepts a global default catalog with no product template", () => {
    const parsed = CreateDocumentRequirementCatalogRequestSchema.parse({
      ...validCreateRequest,
      catalog_type: "global_default",
      product_template_id: null,
    })
    expect(parsed.product_template_id).toBeNull()
  })

  it("rejects a catalog name over 200 characters", () => {
    expect(() =>
      CreateDocumentRequirementCatalogRequestSchema.parse({
        ...validCreateRequest,
        catalog_name: "a".repeat(201),
      })
    ).toThrow()
  })

  it("rejects an empty applicable_process_contexts array", () => {
    expect(() =>
      CreateDocumentRequirementCatalogRequestSchema.parse({
        ...validCreateRequest,
        applicable_process_contexts: [],
      })
    ).toThrow()
  })

  it("rejects an unknown catalog_type", () => {
    expect(() =>
      CreateDocumentRequirementCatalogRequestSchema.parse({
        ...validCreateRequest,
        catalog_type: "tenant_specific",
      })
    ).toThrow()
  })
})

describe("DocumentRequirementCatalogResponseSchema", () => {
  it("accepts the documented shape", () => {
    expect(
      DocumentRequirementCatalogResponseSchema.parse(validCatalogResponse)
    ).toEqual(validCatalogResponse)
  })

  it("rejects a non-uuid created_by", () => {
    expect(() =>
      DocumentRequirementCatalogResponseSchema.parse({
        ...validCatalogResponse,
        created_by: "not-a-uuid",
      })
    ).toThrow()
  })

  it("rejects a missing updated_at", () => {
    const withoutUpdatedAt: Record<string, unknown> = {
      ...validCatalogResponse,
    }
    delete withoutUpdatedAt.updated_at
    expect(() =>
      DocumentRequirementCatalogResponseSchema.parse(withoutUpdatedAt)
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
