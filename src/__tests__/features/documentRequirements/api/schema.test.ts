import { describe, it, expect } from "vitest"
import {
  AddRequirementRequestSchema,
  CreateDocumentRequirementCatalogRequestSchema,
  DocumentRequirementCatalogDetailResponseSchema,
  DocumentRequirementCatalogListResponseSchema,
  DocumentRequirementCatalogResponseSchema,
  DocumentRequirementListResponseSchema,
  DocumentRequirementSchema,
  DocumentTypeListResponseSchema,
  DocumentTypeOriginSchema,
  DocumentTypeSchema,
  MaterializationResponseSchema,
  MaterializedRequirementResponseSchema,
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
  document_origin: "uploaded",
  is_active: true,
  sort_order: 10,
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
  document_origin: "uploaded",
  sort_order: 0,
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

  // CR PRD1042-1794 A4 (12 Aug 2026) removed applicability and condition from the document side —
  // conditions live only on the workflow step. blocks_submission went with the CR's later decision
  // that membership carries "required". All three are absent from the contract, so declaring them
  // required here made every requirement fail to parse. These assertions pin that they stay gone.
  it("does not require the removed applicability, condition or blocks_submission", () => {
    const parsed = RequirementResponseSchema.parse(validFullRequirement)
    expect("applicability" in parsed).toBe(false)
    expect("condition" in parsed).toBe(false)
    expect("blocks_submission" in parsed).toBe(false)
  })

  it("still parses when the backend sends them anyway", () => {
    // Extra keys are stripped rather than rejected, so a stale deployment cannot break the screen.
    expect(() =>
      RequirementResponseSchema.parse({
        ...validFullRequirement,
        applicability: "always",
        condition: null,
        blocks_submission: true,
      })
    ).not.toThrow()
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
    expect(parsed.document_origin).toBe("uploaded")
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

describe("document-type registry (PRD1042-1794 Block 10)", () => {
  const validType = {
    id: TEMPLATE_UUID,
    type_code: "LEASE_CONTRACT",
    type_name: "Lease contract",
    role_scope: "lessee",
    origin: "requested",
    note: null,
    is_active: true,
    created_at: "2026-08-26T10:00:00Z",
    updated_at: "2026-08-26T10:00:00Z",
  }

  it("accepts a registered document type", () => {
    const parsed = DocumentTypeSchema.parse(validType)
    expect(parsed.type_code).toBe("LEASE_CONTRACT")
    expect(parsed.origin).toBe("requested")
  })

  // The registry's origin vocabulary is NOT the requirement's. A requirement's document_origin is
  // uploaded | generated; the registry says requested | generated. Conflating them would silently
  // mislabel every requested document as uploaded.
  it("keeps the registry origin distinct from a requirement's document origin", () => {
    expect(DocumentTypeOriginSchema.options).toEqual(["requested", "generated"])
    expect(DocumentTypeOriginSchema.options).not.toContain("uploaded")
    expect(() => DocumentTypeOriginSchema.parse("uploaded")).toThrow()
  })

  it("rejects an unknown role scope", () => {
    expect(() =>
      DocumentTypeSchema.parse({ ...validType, role_scope: "vendor" })
    ).toThrow()
  })

  it("accepts an inactive type on read, so a retired one still renders", () => {
    const parsed = DocumentTypeSchema.parse({ ...validType, is_active: false })
    expect(parsed.is_active).toBe(false)
  })

  it("parses the enveloped list", () => {
    const parsed = DocumentTypeListResponseSchema.parse({
      items: [validType],
      total: 1,
    })
    expect(parsed.items).toHaveLength(1)
    expect(parsed.total).toBe(1)
  })

  it("rejects a bare array — the endpoint is enveloped", () => {
    expect(() => DocumentTypeListResponseSchema.parse([validType])).toThrow()
  })

  it("accepts an empty registry", () => {
    const parsed = DocumentTypeListResponseSchema.parse({ items: [], total: 0 })
    expect(parsed.items).toEqual([])
  })
})

// This drift is what broke the Requirements tab: the backend removed three fields, the schema kept
// declaring them required, and every parse threw. Nothing caught it — the openapi drift check
// compares the committed contract against the API, not the hand-written schemas against either. So
// these assert the *shape* the contract documents, field by field, rather than a happy payload.
describe("requirement schemas against the documented contract", () => {
  const CONTRACT_REQUIREMENT_FIELDS = [
    "id",
    "catalog_id",
    "requirement_code",
    "document_type_code",
    "document_type_name",
    "description",
    "classification",
    "governance_classification",
    "source_layer",
    "applicable_process_contexts",
    "stage_categorization",
    "document_origin",
    "is_active",
    "sort_order",
    "created_at",
    "updated_at",
  ] as const

  it("parses a payload carrying exactly the contract's fields and nothing more", () => {
    const parsed = RequirementResponseSchema.parse(validFullRequirement)
    expect(Object.keys(parsed).sort()).toEqual(
      [...CONTRACT_REQUIREMENT_FIELDS].sort()
    )
  })

  it("rejects a payload missing any contract field", () => {
    for (const field of CONTRACT_REQUIREMENT_FIELDS) {
      const payload: Record<string, unknown> = { ...validFullRequirement }
      delete payload[field]
      expect(() => RequirementResponseSchema.parse(payload)).toThrow()
    }
  })

  // The preview/materialization row lost blocks_submission for the same reason.
  it("keeps the materialized row aligned too", () => {
    const parsed = MaterializedRequirementResponseSchema.parse({
      requirement_definition_id: REQUIREMENT_UUID,
      requirement_code: "DOC-001",
      document_type_code: "LEASE_CONTRACT",
      document_type_name: "Lease contract",
      classification: "mandatory",
      governance_classification: "operational",
      source_layer: "default",
      stage_categorization: null,
      applicable_process_contexts: ["refinancing_request"],
      document_origin: "uploaded",
    })
    expect("blocks_submission" in parsed).toBe(false)
  })
})
