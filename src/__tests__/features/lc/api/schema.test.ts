import { describe, it, expect } from "vitest"
import {
  LCPortalDocumentItemSchema,
  LCPortalFAListItemSchema,
  LCPortalFAListResponseSchema,
  LCPortalProductTemplateItemSchema,
} from "@/features/lc/api/schema"

const validDocument = {
  id: "b3e1c9a0-1111-4a2b-8c3d-000000000010",
  file_name: "agreement-original.pdf",
  file_size_bytes: 204800,
  mime_type: "application/pdf",
  document_type: "original_agreement",
  document_label: null,
  uploaded_at: "2026-07-15T14:19:00Z",
}

const validTemplate = {
  id: "b3e1c9a0-1111-4a2b-8c3d-000000000020",
  template_name: "Standard Equipment Lease",
}

const validListItem = {
  id: "b3e1c9a0-1111-4a2b-8c3d-000000000001",
  agreement_name: "RV-SSKM-2026-001",
  status: "active",
  valid_from: "2026-06-01",
  valid_until: null,
  max_volume_eur: 25000000,
  available_volume_eur: null,
  new_financings_available: null,
  product_templates: [validTemplate],
  documents: [validDocument],
}

describe("LCPortalDocumentItemSchema", () => {
  it("accepts a valid document", () => {
    expect(() => LCPortalDocumentItemSchema.parse(validDocument)).not.toThrow()
  })

  it("rejects an unknown document_type", () => {
    expect(() =>
      LCPortalDocumentItemSchema.parse({
        ...validDocument,
        document_type: "unknown_type",
      })
    ).toThrow()
  })

  it("rejects a missing file_name", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { file_name: _omit, ...rest } = validDocument
    expect(() => LCPortalDocumentItemSchema.parse(rest)).toThrow()
  })
})

describe("LCPortalProductTemplateItemSchema", () => {
  it("accepts a valid template reference", () => {
    expect(() =>
      LCPortalProductTemplateItemSchema.parse(validTemplate)
    ).not.toThrow()
  })

  it("accepts a null template_name (deleted/unresolved template)", () => {
    expect(() =>
      LCPortalProductTemplateItemSchema.parse({
        ...validTemplate,
        template_name: null,
      })
    ).not.toThrow()
  })
})

describe("LCPortalFAListItemSchema", () => {
  it("accepts a fully valid FA summary", () => {
    expect(() => LCPortalFAListItemSchema.parse(validListItem)).not.toThrow()
  })

  it("accepts empty product_templates and documents arrays", () => {
    expect(() =>
      LCPortalFAListItemSchema.parse({
        ...validListItem,
        product_templates: [],
        documents: [],
      })
    ).not.toThrow()
  })

  it("accepts a null available_volume_eur/new_financings_available (Epic 19 stub)", () => {
    expect(() =>
      LCPortalFAListItemSchema.parse({
        ...validListItem,
        available_volume_eur: null,
        new_financings_available: null,
      })
    ).not.toThrow()
  })

  it("rejects an unknown status", () => {
    expect(() =>
      LCPortalFAListItemSchema.parse({ ...validListItem, status: "unknown" })
    ).toThrow()
  })

  it("coerces a numeric-string max_volume_eur", () => {
    const parsed = LCPortalFAListItemSchema.parse({
      ...validListItem,
      max_volume_eur: "25000000.00",
    })
    expect(parsed.max_volume_eur).toBe(25000000)
  })

  it("rejects a missing agreement_name", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { agreement_name: _omit, ...rest } = validListItem
    expect(() => LCPortalFAListItemSchema.parse(rest)).toThrow()
  })
})

describe("LCPortalFAListResponseSchema", () => {
  it("accepts a valid response", () => {
    expect(() =>
      LCPortalFAListResponseSchema.parse({ items: [validListItem], total: 1 })
    ).not.toThrow()
  })

  it("accepts an empty list", () => {
    expect(() =>
      LCPortalFAListResponseSchema.parse({ items: [], total: 0 })
    ).not.toThrow()
  })

  it("rejects a missing total", () => {
    expect(() => LCPortalFAListResponseSchema.parse({ items: [] })).toThrow()
  })
})
