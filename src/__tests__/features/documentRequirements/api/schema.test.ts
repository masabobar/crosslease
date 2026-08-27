import { describe, it, expect } from "vitest"
import {
  AddRequirementRequestSchema,
  CreateDocumentRequirementCatalogRequestSchema,
  CreateDocumentTypeRequestSchema,
  DocumentRequirementCatalogDetailResponseSchema,
  DocumentRequirementCatalogListResponseSchema,
  DocumentRequirementCatalogResponseSchema,
  DocumentRequirementListResponseSchema,
  DocumentRequirementSchema,
  DocumentTypeListResponseSchema,
  DocumentTypeOriginSchema,
  DocumentTypeSchema,
  FulfilmentStatusSchema,
  RuntimeRequirementItemSchema,
  RuntimeRequirementSurfaceResponseSchema,
  MaterializationResponseSchema,
  MaterializedRequirementResponseSchema,
  RequirementResponseSchema,
  UpdateDocumentRequirementCatalogRequestSchema,
  UpdateDocumentTypeRequestSchema,
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
  applicable_process_contexts: ["disbursement_readiness"],
  valid_from: "2026-06-13",
  valid_to: null,
  created_at: "2026-06-13T10:00:00Z",
}

const validCreateRequest = {
  catalog_name: "FHA Standard 2024 documents",
  applicable_process_contexts: ["disbursement_readiness"],
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
      source_layer: "default",
    }) as Record<string, unknown>

    expect(parsed.governance_classification).toBeUndefined()
    expect(parsed.source_layer).toBeUndefined()
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

  it("strips a stale catalog_type / product_template_id sent by an old backend", () => {
    const parsed = DocumentRequirementCatalogListResponseSchema.parse({
      items: [
        {
          ...validCatalogItem,
          catalog_type: "global_default",
          product_template_id: TEMPLATE_UUID,
        },
      ],
      total: 1,
      page: 1,
      per_page: 50,
      total_pages: 1,
    })
    const item = parsed.items[0] as Record<string, unknown>
    expect(item.catalog_type).toBeUndefined()
    expect(item.product_template_id).toBeUndefined()
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

  it("strips a stale catalog_type / product_template_id from the payload", () => {
    const parsed = CreateDocumentRequirementCatalogRequestSchema.parse({
      ...validCreateRequest,
      catalog_type: "global_default",
      product_template_id: TEMPLATE_UUID,
    }) as Record<string, unknown>
    expect(parsed.catalog_type).toBeUndefined()
    expect(parsed.product_template_id).toBeUndefined()
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

  // CR PRD1042-1794 dropped `conditional` from the requirement classification enum — only
  // mandatory | optional remain.
  it("accepts every documented classification and rejects the removed conditional", () => {
    for (const classification of ["mandatory", "optional"]) {
      expect(() =>
        RequirementResponseSchema.parse({
          ...validFullRequirement,
          classification,
        })
      ).not.toThrow()
    }
    expect(() =>
      RequirementResponseSchema.parse({
        ...validFullRequirement,
        classification: "conditional",
      })
    ).toThrow()
  })

  it("rejects an unknown classification", () => {
    expect(() =>
      RequirementResponseSchema.parse({
        ...validFullRequirement,
        classification: "critical",
      })
    ).toThrow()
  })

  // CR PRD1042-1794 removed applicability, condition, blocks_submission, governance_classification
  // and source_layer from the document side. All are absent from the contract; these assertions pin
  // that they stay gone.
  it("does not model the removed governance/source-layer/applicability fields", () => {
    const parsed = RequirementResponseSchema.parse(
      validFullRequirement
    ) as Record<string, unknown>
    expect("applicability" in parsed).toBe(false)
    expect("condition" in parsed).toBe(false)
    expect("blocks_submission" in parsed).toBe(false)
    expect("governance_classification" in parsed).toBe(false)
    expect("source_layer" in parsed).toBe(false)
  })

  it("still parses when the backend sends them anyway", () => {
    // Extra keys are stripped rather than rejected, so a stale deployment cannot break the screen.
    expect(() =>
      RequirementResponseSchema.parse({
        ...validFullRequirement,
        applicability: "always",
        condition: null,
        blocks_submission: true,
        governance_classification: "compliance_sensitive",
        source_layer: "default",
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

  it("has no requirement_code or document_type_code field — neither is mutable", () => {
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

describe("CreateDocumentTypeRequestSchema (PRD1042-1794 Block 10)", () => {
  const validCreate = {
    type_code: "LEASE_CONTRACT",
    type_name: "Lease contract",
    role_scope: "lessee",
    origin: "requested",
    note: null,
  }

  it("accepts the documented shape", () => {
    expect(CreateDocumentTypeRequestSchema.parse(validCreate)).toEqual(
      validCreate
    )
  })

  it("defaults origin to requested when omitted", () => {
    const minimal = {
      type_code: "LOAN_OFFER",
      type_name: "Loan offer",
      role_scope: "case",
    }
    expect(CreateDocumentTypeRequestSchema.parse(minimal).origin).toBe(
      "requested"
    )
  })

  it("rejects a type_code over 100 characters", () => {
    expect(() =>
      CreateDocumentTypeRequestSchema.parse({
        ...validCreate,
        type_code: "a".repeat(101),
      })
    ).toThrow()
  })

  it("rejects a type_name over 255 characters", () => {
    expect(() =>
      CreateDocumentTypeRequestSchema.parse({
        ...validCreate,
        type_name: "a".repeat(256),
      })
    ).toThrow()
  })

  it("rejects an unknown role scope", () => {
    expect(() =>
      CreateDocumentTypeRequestSchema.parse({
        ...validCreate,
        role_scope: "vendor",
      })
    ).toThrow()
  })

  // The registry origin is requested | generated — never the requirement's uploaded | generated.
  it("rejects the requirement-side origin value 'uploaded'", () => {
    expect(() =>
      CreateDocumentTypeRequestSchema.parse({
        ...validCreate,
        origin: "uploaded",
      })
    ).toThrow()
  })
})

describe("UpdateDocumentTypeRequestSchema (PRD1042-1794 Block 10)", () => {
  it("accepts a single-field partial update", () => {
    const parsed = UpdateDocumentTypeRequestSchema.parse({
      type_name: "Renamed type",
    })
    expect(parsed.type_name).toBe("Renamed type")
  })

  it("accepts an empty object — every field is optional", () => {
    expect(() => UpdateDocumentTypeRequestSchema.parse({})).not.toThrow()
  })

  it("carries is_active for the deactivate/reactivate row action", () => {
    expect(
      UpdateDocumentTypeRequestSchema.parse({ is_active: false }).is_active
    ).toBe(false)
  })

  // type_code and origin are immutable, so the request contract must not carry them.
  it("has no type_code or origin field — neither is mutable", () => {
    const parsed = UpdateDocumentTypeRequestSchema.parse({
      type_code: "should-be-stripped",
      origin: "should-be-stripped",
    }) as Record<string, unknown>
    expect(parsed.type_code).toBeUndefined()
    expect(parsed.origin).toBeUndefined()
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
      stage_categorization: null,
      applicable_process_contexts: ["refinancing_request"],
      document_origin: "uploaded",
    })
    expect("blocks_submission" in parsed).toBe(false)
  })
})

describe("D-11 runtime requirement surface (PRD1042-1796 item 5)", () => {
  const validItem = {
    requirement_definition_id: REQUIREMENT_UUID,
    requirement_code: "DOC-001",
    document_type_name: "Lease contract",
    classification: "mandatory",
    stage_categorization: null,
    fulfilment_status: "missing",
    is_blocking: true,
    document_origin: "uploaded",
    applicable_process_contexts: ["submission"],
    linked_document_id: null,
  }

  const validSurface = {
    catalog_id: CATALOG_UUID,
    business_object_id: TEMPLATE_UUID,
    process_context: null,
    completeness_summary: "1 of 1 mandatory documents outstanding",
    requirements: [validItem],
  }

  it("accepts the surface read without naming a checkpoint", () => {
    const parsed = RuntimeRequirementSurfaceResponseSchema.parse(validSurface)
    // Null rather than a made-up context: the response spans the catalogue, and each row says where
    // it applies.
    expect(parsed.process_context).toBeNull()
    expect(parsed.requirements[0].applicable_process_contexts).toEqual([
      "submission",
    ])
  })

  it("accepts a surface narrowed to one checkpoint", () => {
    const parsed = RuntimeRequirementSurfaceResponseSchema.parse({
      ...validSurface,
      process_context: "submission",
    })
    expect(parsed.process_context).toBe("submission")
  })

  it("carries the fulfilling document so it can be opened", () => {
    const parsed = RuntimeRequirementItemSchema.parse({
      ...validItem,
      fulfilment_status: "fulfilled",
      is_blocking: false,
      linked_document_id: USER_UUID,
    })
    expect(parsed.linked_document_id).toBe(USER_UUID)
  })

  it("has no document while the requirement is unmet", () => {
    const parsed = RuntimeRequirementItemSchema.parse(validItem)
    expect(parsed.linked_document_id).toBeNull()
  })

  // fulfilment_status is a plain string on the wire. A status added on the backend must widen what
  // this screen renders, never fail the parse and blank the page.
  it("accepts a fulfilment status this frontend does not know yet", () => {
    const parsed = RuntimeRequirementItemSchema.parse({
      ...validItem,
      fulfilment_status: "waived",
    })
    expect(parsed.fulfilment_status).toBe("waived")
  })

  it("still names the statuses the backend defines today", () => {
    expect(FulfilmentStatusSchema.options).toEqual([
      "missing",
      "uploaded_pending_review",
      "fulfilled",
      "rejected",
    ])
  })

  it("rejects a non-uuid business object id", () => {
    expect(() =>
      RuntimeRequirementSurfaceResponseSchema.parse({
        ...validSurface,
        business_object_id: "case-1",
      })
    ).toThrow()
  })

  it("accepts a case with nothing required of it", () => {
    const parsed = RuntimeRequirementSurfaceResponseSchema.parse({
      ...validSurface,
      requirements: [],
    })
    expect(parsed.requirements).toEqual([])
  })
})
