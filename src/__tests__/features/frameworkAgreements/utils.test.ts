import { describe, it, expect } from "vitest"
import {
  dedupeSelectableTemplates,
  filterSelectableTemplates,
  getFrameworkAgreementDisplayStatus,
  isFrameworkAgreementExpiredByDate,
} from "@/features/frameworkAgreements/utils"
import type { SelectableTemplateItem } from "@/features/frameworkAgreements/api/schema"

describe("getFrameworkAgreementDisplayStatus", () => {
  it("returns expired for an active agreement the BE reports as expired", () => {
    expect(getFrameworkAgreementDisplayStatus("active", true)).toBe("expired")
  })

  it("returns active when the BE does not report it as expired", () => {
    expect(getFrameworkAgreementDisplayStatus("active", false)).toBe("active")
  })

  it.each(["draft", "terminated"] as const)(
    "returns %s unchanged even when the BE reports it as expired",
    status => {
      expect(getFrameworkAgreementDisplayStatus(status, true)).toBe(status)
    }
  )
})

describe("isFrameworkAgreementExpiredByDate", () => {
  // valid_until is a date-only wire value and an agreement is valid through the whole
  // of that day — mirrors is_fa_expired() in refinext-api (valid_until < date.today()).
  it("is not expired on the valid_until day itself, whatever the time of day", () => {
    expect(
      isFrameworkAgreementExpiredByDate(
        "2026-07-27",
        new Date("2026-07-27T00:01:00")
      )
    ).toBe(false)
    expect(
      isFrameworkAgreementExpiredByDate(
        "2026-07-27",
        new Date("2026-07-27T23:59:00")
      )
    ).toBe(false)
  })

  it("is expired the day after valid_until", () => {
    expect(
      isFrameworkAgreementExpiredByDate(
        "2026-07-27",
        new Date("2026-07-28T00:01:00")
      )
    ).toBe(true)
  })

  it("is not expired the day before valid_until", () => {
    expect(
      isFrameworkAgreementExpiredByDate(
        "2026-07-27",
        new Date("2026-07-26T23:59:00")
      )
    ).toBe(false)
  })

  it("is never expired when open-ended", () => {
    expect(
      isFrameworkAgreementExpiredByDate(null, new Date("2030-01-01T12:00:00"))
    ).toBe(false)
  })
})

describe("dedupeSelectableTemplates", () => {
  const TEMPLATE_A = "11111111-1111-4111-8111-111111111111"
  const TEMPLATE_B = "22222222-2222-4222-8222-222222222222"

  function item(
    templateId: string,
    versionNumber: string,
    code = "FIN-00001"
  ): SelectableTemplateItem {
    return {
      template_id: templateId,
      template_code: code,
      template_name: "Standard Amortising",
      version_number: versionNumber,
    }
  }

  it("collapses several versions of one template into a single option", () => {
    const result = dedupeSelectableTemplates([
      item(TEMPLATE_A, "3"),
      item(TEMPLATE_A, "1"),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].template_id).toBe(TEMPLATE_A)
  })

  it("keeps the highest version regardless of arrival order", () => {
    expect(
      dedupeSelectableTemplates([
        item(TEMPLATE_A, "1"),
        item(TEMPLATE_A, "3"),
      ])[0].version_number
    ).toBe("3")
    expect(
      dedupeSelectableTemplates([
        item(TEMPLATE_A, "3"),
        item(TEMPLATE_A, "1"),
      ])[0].version_number
    ).toBe("3")
  })

  it("compares versions numerically, not lexicographically", () => {
    // "10" < "9" as strings — the bug this guards against.
    const result = dedupeSelectableTemplates([
      item(TEMPLATE_A, "9"),
      item(TEMPLATE_A, "10"),
    ])
    expect(result[0].version_number).toBe("10")
  })

  it("keeps distinct templates apart", () => {
    const result = dedupeSelectableTemplates([
      item(TEMPLATE_A, "1"),
      item(TEMPLATE_B, "1", "LEA-00042"),
    ])
    expect(result.map(o => o.template_id)).toEqual([TEMPLATE_A, TEMPLATE_B])
  })

  it("preserves first-seen template order", () => {
    const result = dedupeSelectableTemplates([
      item(TEMPLATE_B, "1", "LEA-00042"),
      item(TEMPLATE_A, "1"),
      item(TEMPLATE_B, "2", "LEA-00042"),
    ])
    expect(result.map(o => o.template_id)).toEqual([TEMPLATE_B, TEMPLATE_A])
  })

  it("returns an empty list for no options", () => {
    expect(dedupeSelectableTemplates([])).toEqual([])
  })

  it("leaves an already-unique list unchanged", () => {
    const options = [item(TEMPLATE_A, "1"), item(TEMPLATE_B, "2", "LEA-00042")]
    expect(dedupeSelectableTemplates(options)).toEqual(options)
  })
})

describe("filterSelectableTemplates", () => {
  const templates: SelectableTemplateItem[] = [
    {
      template_id: "11111111-1111-4111-8111-111111111111",
      template_code: "FIN-00001",
      template_name: "Standard Amortising",
      version_number: "3",
    },
    {
      template_id: "22222222-2222-4222-8222-222222222222",
      template_code: "LEA-00042",
      template_name: "Balloon Lease",
      version_number: "1",
    },
  ]

  it("returns every option for an empty query", () => {
    expect(filterSelectableTemplates(templates, "")).toEqual(templates)
  })

  it("returns every option for a whitespace-only query", () => {
    expect(filterSelectableTemplates(templates, "   ")).toEqual(templates)
  })

  it("matches on template name, case-insensitively", () => {
    expect(filterSelectableTemplates(templates, "balloon")).toEqual([
      templates[1],
    ])
  })

  it("matches on template code", () => {
    expect(filterSelectableTemplates(templates, "FIN-00001")).toEqual([
      templates[0],
    ])
  })

  it("matches a partial code", () => {
    expect(filterSelectableTemplates(templates, "lea-")).toEqual([templates[1]])
  })

  it("ignores surrounding whitespace in the query", () => {
    expect(filterSelectableTemplates(templates, "  Balloon  ")).toEqual([
      templates[1],
    ])
  })

  it("returns an empty list when nothing matches", () => {
    expect(filterSelectableTemplates(templates, "zzz")).toEqual([])
  })
})
