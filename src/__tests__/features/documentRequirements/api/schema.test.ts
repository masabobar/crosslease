import { describe, it, expect } from "vitest"
import {
  AddRequirementRequestSchema,
  CreateDocumentRequirementCatalogRequestSchema,
  DocumentRequirementCatalogDetailResponseSchema,
  DocumentRequirementCatalogListResponseSchema,
  DocumentRequirementCatalogResponseSchema,
  DocumentRequirementListResponseSchema,
  DocumentRequirementSchema,
  MaterializationResponseSchema,
  RequirementResponseSchema,
  UpdateDocumentRequirementCatalogRequestSchema,
  UpdateRequirementRequestSchema,
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

const validFullRequirement = {
  id: REQUIREMENT_UUID,
  catalog_id: CATALOG_UUID,
  requirement_code: "DOC-FHA-001",
  document_type_code: "ASSET_REG_CONF",
  document_type_name: "Asset registration confirmation",
  description: "Registry confirmation of the true-sale asset transfer.",
  classification: "mandatory",
  governance_classification: "compliance_sensitive",
  source_layer: "default",
  applicable_process_contexts: ["disbursement_readiness"],
  stage_categorization: "submission",
  blocks_submission: true,
  document_origin: "uploaded",
  is_active: true,
  sort_order: 10,
  applicability: "always",
  condition: null,
  created_at: "2026-06-13T10:00:00Z",
  updated_at: "2026-06-13T10:00:00Z",
}

const validAddRequirementRequest = {
  requirement_code: "DOC-FHA-001",
  document_type_code: "ASSET_REG_CONF",
  document_type_name: "Asset registration confirmation",
  description: null,
  classification: "mandatory",
  governance_classification: "compliance_sensitive",
  applicable_process_contexts: ["disbursement_readiness"],
  stage_categorization: null,
  blocks_submission: true,
  document_origin: "uploaded",
  sort_order: 0,
  applicability: "always",
  condition: null,
}

describe("RequirementResponseSchema", () => {
  it("accepts the documented shape", () => {
    expect(RequirementResponseSchema.parse(validFullRequirement)).toEqual(
      validFullRequirement
    )
  })

  it("accepts every documented source_layer value", () => {
    for (const source_layer of [
      "default",
      "override",
      "supplement",
      "deactivated",
    ]) {
      expect(() =>
        RequirementResponseSchema.parse({
          ...validFullRequirement,
          source_layer,
        })
      ).not.toThrow()
    }
  })

  it("rejects an unknown classification", () => {
    expect(() =>
      RequirementResponseSchema.parse({
        ...validFullRequirement,
        classification: "critical",
      })
    ).toThrow()
  })

  it("accepts a null condition alongside applicability=always", () => {
    const parsed = RequirementResponseSchema.parse(validFullRequirement)
    expect(parsed.condition).toBeNull()
  })

  it("accepts a populated condition for a conditional_rule requirement", () => {
    const parsed = RequirementResponseSchema.parse({
      ...validFullRequirement,
      applicability: "conditional_rule",
      condition: { attribute: "aml_risk_band", equals: "high" },
    })
    expect(parsed.condition).toEqual({
      attribute: "aml_risk_band",
      equals: "high",
    })
  })
})

describe("AddRequirementRequestSchema", () => {
  it("accepts the documented shape", () => {
    expect(
      AddRequirementRequestSchema.parse(validAddRequirementRequest)
    ).toEqual(validAddRequirementRequest)
  })

  it("applies documented defaults when optional fields are omitted", () => {
    const minimal = {
      requirement_code: "DOC-FHA-002",
      document_type_code: "LOAN_OFFER",
      document_type_name: "Loan offer",
      governance_classification: "operational",
      applicable_process_contexts: ["financing"],
    }
    const parsed = AddRequirementRequestSchema.parse(minimal)
    expect(parsed.classification).toBe("mandatory")
    expect(parsed.blocks_submission).toBe(true)
    expect(parsed.document_origin).toBe("uploaded")
    expect(parsed.applicability).toBe("always")
  })

  it("rejects condition present without applicability=conditional_rule", () => {
    expect(() =>
      AddRequirementRequestSchema.parse({
        ...validAddRequirementRequest,
        applicability: "always",
        condition: { attribute: "aml_risk_band", equals: "high" },
      })
    ).toThrow()
  })

  it("rejects applicability=conditional_rule with no condition", () => {
    expect(() =>
      AddRequirementRequestSchema.parse({
        ...validAddRequirementRequest,
        applicability: "conditional_rule",
        condition: null,
      })
    ).toThrow()
  })

  it("accepts applicability=conditional_rule with a condition", () => {
    expect(() =>
      AddRequirementRequestSchema.parse({
        ...validAddRequirementRequest,
        applicability: "conditional_rule",
        condition: { attribute: "jurisdiction", equals: "DE" },
      })
    ).not.toThrow()
  })

  it("rejects an empty applicable_process_contexts array", () => {
    expect(() =>
      AddRequirementRequestSchema.parse({
        ...validAddRequirementRequest,
        applicable_process_contexts: [],
      })
    ).toThrow()
  })
})

describe("UpdateRequirementRequestSchema", () => {
  it("accepts a single-field partial update", () => {
    const parsed = UpdateRequirementRequestSchema.parse({
      description: "Updated description.",
    })
    expect(parsed.description).toBe("Updated description.")
  })

  it("accepts an empty object — every field is optional", () => {
    expect(() => UpdateRequirementRequestSchema.parse({})).not.toThrow()
  })

  it("has no requirement_code, document_type_code or source_layer field", () => {
    const parsed = UpdateRequirementRequestSchema.parse({
      requirement_code: "should-be-stripped",
      document_type_code: "should-be-stripped",
      source_layer: "override",
    }) as Record<string, unknown>
    expect(parsed.requirement_code).toBeUndefined()
    expect(parsed.document_type_code).toBeUndefined()
    expect(parsed.source_layer).toBeUndefined()
  })
})

describe("UpdateDocumentRequirementCatalogRequestSchema", () => {
  it("accepts a single-field partial update", () => {
    const parsed = UpdateDocumentRequirementCatalogRequestSchema.parse({
      catalog_name: "Renamed catalog",
    })
    expect(parsed.catalog_name).toBe("Renamed catalog")
  })

  it("has no catalog_type or product_template_id field — neither is mutable", () => {
    const parsed = UpdateDocumentRequirementCatalogRequestSchema.parse({
      catalog_type: "global_default",
      product_template_id: TEMPLATE_UUID,
    }) as Record<string, unknown>
    expect(parsed.catalog_type).toBeUndefined()
    expect(parsed.product_template_id).toBeUndefined()
  })

  it("rejects an empty applicable_process_contexts array when provided", () => {
    expect(() =>
      UpdateDocumentRequirementCatalogRequestSchema.parse({
        applicable_process_contexts: [],
      })
    ).toThrow()
  })
})

describe("DocumentRequirementCatalogDetailResponseSchema", () => {
  it("accepts a catalog with embedded requirements", () => {
    const parsed = DocumentRequirementCatalogDetailResponseSchema.parse({
      ...validCatalogResponse,
      requirements: [validFullRequirement],
    })
    expect(parsed.requirements).toHaveLength(1)
    expect(parsed.requirements[0].requirement_code).toBe("DOC-FHA-001")
  })

  it("accepts a catalog with no requirements yet", () => {
    const parsed = DocumentRequirementCatalogDetailResponseSchema.parse({
      ...validCatalogResponse,
      requirements: [],
    })
    expect(parsed.requirements).toEqual([])
  })

  it("rejects a missing requirements field", () => {
    expect(() =>
      DocumentRequirementCatalogDetailResponseSchema.parse(validCatalogResponse)
    ).toThrow()
  })
})

describe("MaterializationResponseSchema", () => {
  it("accepts the documented shape", () => {
    const response = {
      catalog_id: CATALOG_UUID,
      process_context: "disbursement_readiness",
      effective_requirements: [
        {
          requirement_definition_id: REQUIREMENT_UUID,
          requirement_code: "DOC-FHA-001",
          document_type_code: "ASSET_REG_CONF",
          document_type_name: "Asset registration confirmation",
          classification: "mandatory",
          governance_classification: "compliance_sensitive",
          source_layer: "default",
          stage_categorization: "submission",
          applicable_process_contexts: ["disbursement_readiness"],
          blocks_submission: true,
          document_origin: "uploaded",
        },
      ],
      total: 1,
    }
    expect(MaterializationResponseSchema.parse(response)).toEqual(response)
  })

  it("accepts an empty effective set", () => {
    const parsed = MaterializationResponseSchema.parse({
      catalog_id: CATALOG_UUID,
      process_context: "financing",
      effective_requirements: [],
      total: 0,
    })
    expect(parsed.effective_requirements).toEqual([])
  })

  it("rejects a missing total field", () => {
    expect(() =>
      MaterializationResponseSchema.parse({
        catalog_id: CATALOG_UUID,
        process_context: "financing",
        effective_requirements: [],
      })
    ).toThrow()
  })
})
