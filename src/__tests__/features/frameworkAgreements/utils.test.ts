import { describe, it, expect } from "vitest"
import {
  canonicalVersionByTemplate,
  dedupeSelectableTemplates,
  filterSelectableTemplates,
  filterTemplatesEffectiveBy,
  getLcPortalAgreementLifecycle,
  groupByTemplateId,
  isFrameworkAgreementExpiredByDate,
  splitGroupsIntoColumns,
} from "@/features/frameworkAgreements/utils"
import type { SelectableTemplateItem } from "@/features/frameworkAgreements/api/schema"

// LC-portal-only since CR-FA-07: the bank-side screens read `agreement_lifecycle` off the
// wire instead of folding expiry in themselves. This helper survives solely because
// LCPortalFAListItem carries neither field (Q-033).
describe("getLcPortalAgreementLifecycle", () => {
  it("returns expired for an active agreement whose validity has passed", () => {
    expect(getLcPortalAgreementLifecycle("active", true)).toBe("expired")
  })

  it("returns active when it has not expired", () => {
    expect(getLcPortalAgreementLifecycle("active", false)).toBe("active")
  })

  it.each(["draft", "terminated"] as const)(
    "returns %s unchanged even when the validity date has passed",
    status => {
      expect(getLcPortalAgreementLifecycle(status, true)).toBe(status)
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
      valid_from: null,
    }
  }

  // No-op since CR PRD1042-1798 — version-scoped rows are kept separate on purpose;
  // grouping/canonicalization now happens downstream via groupByTemplateId and
  // canonicalVersionByTemplate (see the comment above this function in utils.ts).
  it("keeps every version row of one template, in arrival order", () => {
    const options = [item(TEMPLATE_A, "3"), item(TEMPLATE_A, "1")]
    expect(dedupeSelectableTemplates(options)).toEqual(options)
  })

  it("keeps distinct templates apart, in arrival order", () => {
    const options = [item(TEMPLATE_A, "1"), item(TEMPLATE_B, "1", "LEA-00042")]
    expect(dedupeSelectableTemplates(options)).toEqual(options)
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
      valid_from: null,
    },
    {
      template_id: "22222222-2222-4222-8222-222222222222",
      template_code: "LEA-00042",
      template_name: "Balloon Lease",
      version_number: "1",
      valid_from: null,
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

// Create-wizard-only eligibility filter (supersedes CR-FA-05 for Create — see the comment
// above this function in utils.ts). Edit's picker never calls this.
describe("filterTemplatesEffectiveBy", () => {
  const early: SelectableTemplateItem = {
    template_id: "11111111-1111-4111-8111-111111111111",
    template_code: "FIN-00001",
    template_name: "Early Template",
    version_number: "1",
    valid_from: "2026-01-01",
  }
  const sameDay: SelectableTemplateItem = {
    template_id: "22222222-2222-4222-8222-222222222222",
    template_code: "FIN-00002",
    template_name: "Same Day Template",
    version_number: "1",
    valid_from: "2026-06-01",
  }
  const late: SelectableTemplateItem = {
    template_id: "33333333-3333-4333-8333-333333333333",
    template_code: "FIN-00003",
    template_name: "Late Template",
    version_number: "1",
    valid_from: "2026-12-31",
  }
  const noValidFrom: SelectableTemplateItem = {
    template_id: "44444444-4444-4444-8444-444444444444",
    template_code: "FIN-00004",
    template_name: "Unset Template",
    version_number: "1",
    valid_from: null,
  }
  const templates = [early, sameDay, late, noValidFrom]

  it("returns every option when the agreement has no valid_from yet", () => {
    expect(filterTemplatesEffectiveBy(templates, "")).toEqual(templates)
  })

  it("keeps templates whose valid_from is before the agreement's", () => {
    expect(filterTemplatesEffectiveBy(templates, "2026-06-01")).toContain(early)
  })

  it("keeps a template whose valid_from equals the agreement's (inclusive)", () => {
    expect(filterTemplatesEffectiveBy(templates, "2026-06-01")).toContain(
      sameDay
    )
  })

  it("excludes templates whose valid_from is after the agreement's", () => {
    expect(filterTemplatesEffectiveBy(templates, "2026-06-01")).not.toContain(
      late
    )
  })

  it("never excludes a template with no valid_from set", () => {
    expect(filterTemplatesEffectiveBy(templates, "2026-06-01")).toContain(
      noValidFrom
    )
  })
})

// The default assumed version for a template_id that's already selected but has no
// remembered version yet (initial render, or a value populated from an existing agreement).
describe("canonicalVersionByTemplate", () => {
  const TEMPLATE_A = "11111111-1111-4111-8111-111111111111"
  const TEMPLATE_B = "22222222-2222-4222-8222-222222222222"

  function item(
    templateId: string,
    versionNumber: string
  ): SelectableTemplateItem {
    return {
      template_id: templateId,
      template_code: "FIN-00001",
      template_name: "Standard Amortising",
      version_number: versionNumber,
      valid_from: null,
    }
  }

  it("picks the highest version regardless of arrival order", () => {
    expect(
      canonicalVersionByTemplate([
        item(TEMPLATE_A, "1"),
        item(TEMPLATE_A, "3"),
      ]).get(TEMPLATE_A)
    ).toBe("3")
    expect(
      canonicalVersionByTemplate([
        item(TEMPLATE_A, "3"),
        item(TEMPLATE_A, "1"),
      ]).get(TEMPLATE_A)
    ).toBe("3")
  })

  it("compares versions numerically, not lexicographically", () => {
    // "10" < "9" as strings — the bug this guards against.
    expect(
      canonicalVersionByTemplate([
        item(TEMPLATE_A, "9"),
        item(TEMPLATE_A, "10"),
      ]).get(TEMPLATE_A)
    ).toBe("10")
  })

  it("tracks distinct templates independently", () => {
    const result = canonicalVersionByTemplate([
      item(TEMPLATE_A, "2"),
      item(TEMPLATE_B, "1"),
    ])
    expect(result.get(TEMPLATE_A)).toBe("2")
    expect(result.get(TEMPLATE_B)).toBe("1")
  })

  it("returns an empty map for no options", () => {
    expect(canonicalVersionByTemplate([]).size).toBe(0)
  })
})

describe("groupByTemplateId", () => {
  const TEMPLATE_A = "11111111-1111-4111-8111-111111111111"
  const TEMPLATE_B = "22222222-2222-4222-8222-222222222222"
  const TEMPLATE_C = "33333333-3333-4333-8333-333333333333"

  function item(
    templateId: string,
    versionNumber: string
  ): SelectableTemplateItem {
    return {
      template_id: templateId,
      template_code: "FIN-00001",
      template_name: "Standard Amortising",
      version_number: versionNumber,
      valid_from: null,
    }
  }

  it("groups a later duplicate into its template's own array", () => {
    const b1 = item(TEMPLATE_B, "1")
    const a1 = item(TEMPLATE_A, "1")
    const b2 = item(TEMPLATE_B, "2")
    expect(groupByTemplateId([b1, a1, b2])).toEqual([[b1, b2], [a1]])
  })

  it("preserves the order of first appearance across distinct templates", () => {
    const c1 = item(TEMPLATE_C, "1")
    const a1 = item(TEMPLATE_A, "1")
    const b1 = item(TEMPLATE_B, "1")
    expect(
      groupByTemplateId([c1, a1, b1]).map(group => group[0].template_id)
    ).toEqual([TEMPLATE_C, TEMPLATE_A, TEMPLATE_B])
  })

  it("wraps an already-unique list in one-item groups", () => {
    const a1 = item(TEMPLATE_A, "1")
    const b1 = item(TEMPLATE_B, "1")
    expect(groupByTemplateId([a1, b1])).toEqual([[a1], [b1]])
  })

  it("returns an empty list for no options", () => {
    expect(groupByTemplateId([])).toEqual([])
  })
})

describe("splitGroupsIntoColumns", () => {
  const TEMPLATE_A = "11111111-1111-4111-8111-111111111111"
  const TEMPLATE_B = "22222222-2222-4222-8222-222222222222"
  const TEMPLATE_C = "33333333-3333-4333-8333-333333333333"
  const TEMPLATE_D = "44444444-4444-4444-8444-444444444444"

  function item(
    templateId: string,
    versionNumber: string
  ): SelectableTemplateItem {
    return {
      template_id: templateId,
      template_code: "FIN-00001",
      template_name: "Standard Amortising",
      version_number: versionNumber,
      valid_from: null,
    }
  }

  it("alternates single-row groups evenly between columns", () => {
    const groups = [
      [item(TEMPLATE_A, "1")],
      [item(TEMPLATE_B, "1")],
      [item(TEMPLATE_C, "1")],
      [item(TEMPLATE_D, "1")],
    ]
    const [left, right] = splitGroupsIntoColumns(groups)
    expect(left).toEqual([groups[0], groups[2]])
    expect(right).toEqual([groups[1], groups[3]])
  })

  it("never splits a single template's versions across columns", () => {
    const multiVersionGroup = [item(TEMPLATE_A, "1"), item(TEMPLATE_A, "2")]
    const groups = [multiVersionGroup, [item(TEMPLATE_B, "1")]]
    const [left, right] = splitGroupsIntoColumns(groups)
    expect(left).toEqual([multiVersionGroup])
    expect(right).toEqual([[item(TEMPLATE_B, "1")]])
  })

  it("sends the next group to whichever column has fewer rows so far", () => {
    // A has 2 rows (left), B has 1 row — B should land in right, not left, even
    // though a pure group-count alternation would still put it wherever's next.
    const groupA = [item(TEMPLATE_A, "1"), item(TEMPLATE_A, "2")]
    const groupB = [item(TEMPLATE_B, "1")]
    const groupC = [item(TEMPLATE_C, "1")]
    const [left, right] = splitGroupsIntoColumns([groupA, groupB, groupC])
    expect(left).toEqual([groupA])
    expect(right).toEqual([groupB, groupC])
  })

  it("breaks ties in favor of the left column", () => {
    const groupA = [item(TEMPLATE_A, "1")]
    const [left, right] = splitGroupsIntoColumns([groupA])
    expect(left).toEqual([groupA])
    expect(right).toEqual([])
  })

  it("returns two empty columns for no groups", () => {
    expect(splitGroupsIntoColumns([])).toEqual([[], []])
  })
})
