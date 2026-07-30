import { describe, it, expect } from "vitest"
import {
  CatalogEntityTypeSchema,
  CatalogLayerSchema,
  CatalogListItemSchema,
  CatalogListResponseSchema,
  CatalogResponseSchema,
  CatalogStateSchema,
  CreateCatalogRequestSchema,
} from "@/features/workflowTaskCatalog/api/schema"

const CATALOG_UUID = "3f1c9a2e-0b7d-4c5e-8a11-9d2e6f4b7c80"
const TENANT_UUID = "9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d"
const TEMPLATE_UUID = "11111111-2222-4333-8444-555555555555"
const USER_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"

const validListItem = {
  id: CATALOG_UUID,
  catalog_name: "Refinancing Rules",
  catalog_layer: "product_specific",
  catalog_state: "active",
  entity_type: "refinancing_request",
  entity_id: TEMPLATE_UUID,
  valid_from: "2026-08-01",
  valid_until: null,
  created_at: "2026-07-30T12:00:00Z",
}

const validCatalogResponse = {
  id: CATALOG_UUID,
  tenant_id: TENANT_UUID,
  catalog_name: "Refinancing Rules",
  catalog_layer: "product_specific",
  catalog_state: "active",
  entity_type: "refinancing_request",
  entity_id: TEMPLATE_UUID,
  valid_from: "2026-08-01",
  valid_until: null,
  description: null,
  created_by: USER_UUID,
  created_at: "2026-07-30T12:00:00Z",
  updated_at: "2026-07-30T12:00:00Z",
}

describe("wire enums", () => {
  it("accepts every documented value", () => {
    expect(CatalogLayerSchema.options).toEqual([
      "global_default",
      "product_specific",
    ])
    expect(CatalogEntityTypeSchema.options).toEqual([
      "refinancing_request",
      "financing",
      "redemption_request",
    ])
    expect(CatalogStateSchema.options).toEqual(["active", "archived"])
  })

  // The pre-wiring shell carried draft/deprecated states that the BE never had: a catalog is
  // created directly ACTIVE and no endpoint transitions it. Reintroducing either here would
  // silently accept a state the wire cannot produce.
  it("rejects the retired draft and deprecated states", () => {
    expect(() => CatalogStateSchema.parse("draft")).toThrow()
    expect(() => CatalogStateSchema.parse("deprecated")).toThrow()
  })

  it("rejects an unknown entity type", () => {
    expect(() => CatalogEntityTypeSchema.parse("lessee_change")).toThrow()
  })
})

describe("CatalogListItemSchema", () => {
  it("accepts the documented shape", () => {
    expect(() => CatalogListItemSchema.parse(validListItem)).not.toThrow()
  })

  it("accepts a global default row with no entity id", () => {
    expect(() =>
      CatalogListItemSchema.parse({
        ...validListItem,
        catalog_layer: "global_default",
        entity_id: null,
      })
    ).not.toThrow()
  })

  it("accepts an archived row with a valid_until date", () => {
    const parsed = CatalogListItemSchema.parse({
      ...validListItem,
      catalog_state: "archived",
      valid_until: "2027-01-31",
    })
    expect(parsed.valid_until).toBe("2027-01-31")
  })

  it.each([
    "id",
    "catalog_name",
    "catalog_layer",
    "catalog_state",
    "entity_type",
    "entity_id",
    "valid_from",
    "valid_until",
    "created_at",
  ])("rejects a payload missing %s", field => {
    const payload: Record<string, unknown> = { ...validListItem }
    delete payload[field]
    expect(() => CatalogListItemSchema.parse(payload)).toThrow()
  })

  it("rejects a non-uuid id", () => {
    expect(() =>
      CatalogListItemSchema.parse({ ...validListItem, id: "wtc-1" })
    ).toThrow()
  })

  it("rejects an unknown catalog state", () => {
    expect(() =>
      CatalogListItemSchema.parse({ ...validListItem, catalog_state: "banana" })
    ).toThrow()
  })

  it("rejects a numeric valid_from", () => {
    expect(() =>
      CatalogListItemSchema.parse({ ...validListItem, valid_from: 20260801 })
    ).toThrow()
  })
})

describe("CatalogListResponseSchema", () => {
  it("accepts the paginated envelope", () => {
    const parsed = CatalogListResponseSchema.parse({
      items: [validListItem],
      total: 1,
      page: 1,
      per_page: 25,
      total_pages: 1,
    })
    expect(parsed.items).toHaveLength(1)
  })

  it("accepts an empty page", () => {
    expect(() =>
      CatalogListResponseSchema.parse({
        items: [],
        total: 0,
        page: 1,
        per_page: 25,
        total_pages: 0,
      })
    ).not.toThrow()
  })

  it("rejects a fractional counter", () => {
    expect(() =>
      CatalogListResponseSchema.parse({
        items: [],
        total: 1.5,
        page: 1,
        per_page: 25,
        total_pages: 1,
      })
    ).toThrow()
  })

  it("rejects a bare array — the endpoint is enveloped", () => {
    expect(() => CatalogListResponseSchema.parse([validListItem])).toThrow()
  })

  it("rejects an envelope missing total_pages", () => {
    expect(() =>
      CatalogListResponseSchema.parse({
        items: [],
        total: 0,
        page: 1,
        per_page: 25,
      })
    ).toThrow()
  })
})

describe("CreateCatalogRequestSchema", () => {
  it("accepts a product-specific payload", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "Refinancing Rules",
        catalog_layer: "product_specific",
        entity_type: "refinancing_request",
        entity_id: TEMPLATE_UUID,
        valid_from: "2026-08-01",
        valid_until: null,
      })
    ).not.toThrow()
  })

  it("accepts a global default payload with a null entity id", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "Financing Default",
        catalog_layer: "global_default",
        entity_type: "financing",
        entity_id: null,
        valid_from: "2026-08-01",
        valid_until: null,
      })
    ).not.toThrow()
  })

  it("rejects an empty catalog name", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "",
        catalog_layer: "global_default",
        valid_from: "2026-08-01",
      })
    ).toThrow()
  })

  it("rejects a catalog name over the 200-character wire limit", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "x".repeat(201),
        catalog_layer: "global_default",
        valid_from: "2026-08-01",
      })
    ).toThrow()
  })

  it("rejects a missing valid_from", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "Financing Default",
        catalog_layer: "global_default",
      })
    ).toThrow()
  })

  // entity_id carries the Product Template UUID, so a template *name* must not pass —
  // that was the shell's placeholder shape and the BE would 422 on it.
  it("rejects a non-uuid entity id", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "Refinancing Rules",
        catalog_layer: "product_specific",
        entity_type: "refinancing_request",
        entity_id: "Mortgage Plus",
        valid_from: "2026-08-01",
      })
    ).toThrow()
  })
})

describe("CatalogResponseSchema", () => {
  it("accepts the documented shape and defaults warnings to an empty array", () => {
    const parsed = CatalogResponseSchema.parse(validCatalogResponse)
    expect(parsed.warnings).toEqual([])
    expect(parsed.current_version_id).toBeUndefined()
  })

  it("keeps the no-global-default warning the BE returns on create", () => {
    const parsed = CatalogResponseSchema.parse({
      ...validCatalogResponse,
      current_version_id: CATALOG_UUID,
      warnings: [
        "No Global Default Catalog exists for this Tenant × Entity Type.",
      ],
    })
    expect(parsed.warnings).toHaveLength(1)
  })

  it("rejects a payload missing created_by", () => {
    const payload: Record<string, unknown> = { ...validCatalogResponse }
    delete payload.created_by
    expect(() => CatalogResponseSchema.parse(payload)).toThrow()
  })

  it("rejects a non-array warnings value", () => {
    expect(() =>
      CatalogResponseSchema.parse({
        ...validCatalogResponse,
        warnings: "no global default",
      })
    ).toThrow()
  })
})
