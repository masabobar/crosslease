import { describe, expect, it } from "vitest"
import {
  filterTemplatesAllowedByAgreement,
  templateOptionLabel,
} from "@/features/cases/allowedTemplates"
import type { SelectableTemplateItem } from "@/features/frameworkAgreements/api/schema"

function template(
  overrides: Partial<SelectableTemplateItem> = {}
): SelectableTemplateItem {
  return {
    template_id: "00000000-0000-4000-8000-0000000000t1",
    template_code: "STD-LEASE",
    template_name: "Standard lease refinancing",
    version_number: "4",
    valid_from: "2026-01-01",
    ...overrides,
  }
}

const OTHER_ID = "00000000-0000-4000-8000-0000000000t2"
const THIRD_ID = "00000000-0000-4000-8000-0000000000t3"

describe("filterTemplatesAllowedByAgreement", () => {
  it("keeps only the templates the agreement permits", () => {
    const result = filterTemplatesAllowedByAgreement(
      [template(), template({ template_id: OTHER_ID })],
      [OTHER_ID]
    )

    expect(result.map(item => item.template_id)).toEqual([OTHER_ID])
  })

  // An agreement that permits nothing is a configuration gap, not a crash: the step shows its
  // "allows no product templates" state off an empty array.
  it("returns nothing when the agreement permits nothing", () => {
    expect(filterTemplatesAllowedByAgreement([template()], [])).toEqual([])
  })

  // The agreement may reference a template that is no longer selectable (superseded, terminated).
  // Those ids simply do not match, rather than producing a phantom option.
  it("ignores permitted ids that are not selectable", () => {
    expect(
      filterTemplatesAllowedByAgreement([template()], [OTHER_ID, THIRD_ID])
    ).toEqual([])
  })

  // Order follows the selectable list so the picker matches every other template picker in the
  // app, not the arbitrary order of the agreement's array.
  it("preserves the selectable list's order, not the agreement's", () => {
    const first = template()
    const second = template({ template_id: OTHER_ID })
    const third = template({ template_id: THIRD_ID })

    const result = filterTemplatesAllowedByAgreement(
      [first, second, third],
      [THIRD_ID, first.template_id]
    )

    expect(result.map(item => item.template_id)).toEqual([
      first.template_id,
      THIRD_ID,
    ])
  })

  it("returns nothing when there is nothing selectable", () => {
    expect(filterTemplatesAllowedByAgreement([], [OTHER_ID])).toEqual([])
  })
})

describe("templateOptionLabel", () => {
  // Matches the design's "Standard lease refinancing, v4" exactly.
  it("renders name then version, as the design does", () => {
    expect(templateOptionLabel(template())).toBe(
      "Standard lease refinancing, v4"
    )
  })

  it("does not include the template code", () => {
    expect(
      templateOptionLabel(template({ template_code: "ABC-123" }))
    ).not.toContain("ABC-123")
  })
})
