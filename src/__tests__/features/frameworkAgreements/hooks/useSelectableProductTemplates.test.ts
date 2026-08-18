import { describe, it, expect } from "vitest"
import { selectUniqueTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import type { SelectableTemplateItem } from "@/features/frameworkAgreements/api/schema"

// This select wraps dedupeSelectableTemplates (a no-op since CR PRD1042-1798 — see utils.ts)
// to preserve the response envelope shape for every consumer of the version-scoped
// /product-templates/selectable response — the FA picker and review steps, the FA detail
// Templates tab, and the Workflow Task Catalogue / Document Requirement surfaces. Each
// selectable version arrives as its own row; template-level grouping happens downstream via
// groupByTemplateId / canonicalVersionByTemplate.
describe("selectUniqueTemplates", () => {
  const TEMPLATE_A = "11111111-1111-4111-8111-111111111111"
  const TEMPLATE_B = "22222222-2222-4222-8222-222222222222"

  function item(
    templateId: string,
    versionNumber: string,
    code = "REFI-FULL-008"
  ): SelectableTemplateItem {
    return {
      template_id: templateId,
      template_code: code,
      template_name: "Publish Fix Verify 001",
      version_number: versionNumber,
      valid_from: null,
    }
  }

  it("keeps the response envelope shape", () => {
    const result = selectUniqueTemplates({ items: [item(TEMPLATE_A, "1")] })
    expect(result).toEqual({ items: [item(TEMPLATE_A, "1")] })
  })

  it("keeps an active and a superseded version of one template as separate rows", () => {
    const result = selectUniqueTemplates({
      items: [item(TEMPLATE_A, "2"), item(TEMPLATE_A, "1")],
    })
    expect(result.items).toHaveLength(2)
    expect(result.items.map(i => i.version_number)).toEqual(["2", "1"])
  })

  it("leaves distinct templates alone", () => {
    const result = selectUniqueTemplates({
      items: [item(TEMPLATE_A, "1"), item(TEMPLATE_B, "1", "QA-TIMING-007")],
    })
    expect(result.items.map(i => i.template_id)).toEqual([
      TEMPLATE_A,
      TEMPLATE_B,
    ])
  })

  it("handles an empty response", () => {
    expect(selectUniqueTemplates({ items: [] })).toEqual({ items: [] })
  })

  it("returns a mutable array, as the response type declares", () => {
    expect(
      Array.isArray(
        selectUniqueTemplates({ items: [item(TEMPLATE_A, "1")] }).items
      )
    ).toBe(true)
  })
})
