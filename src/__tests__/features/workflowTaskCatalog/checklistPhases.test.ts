import { describe, expect, it } from "vitest"
import {
  groupChecklistByPhase,
  isOwnedByRole,
  phaseHeading,
  phaseLetterFromTaskCode,
  taskNumber,
} from "@/features/workflowTaskCatalog/checklistPhases"
import type { ChecklistItemResponse } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { CaseProgressResponse } from "@/features/cases/api/schema"

let seq = 0

function item(
  overrides: Partial<ChecklistItemResponse> = {}
): ChecklistItemResponse {
  seq += 1
  return {
    id: `00000000-0000-4000-8000-0000000000${seq.toString(16).padStart(2, "0")}`,
    business_object_id: "00000000-0000-4000-8000-00000000c005",
    source_catalog_task_id: "00000000-0000-4000-8000-0000000000f1",
    task_code: "A-01",
    task_name: "Pre-inquiry form created & saved",
    is_mandatory: true,
    weight: null,
    responsible_role: null,
    responsible_roles: ["front_office"],
    display_order: 1,
    stage_categorization: null,
    task_type: null,
    applicability: null,
    four_eyes: false,
    doc_requirement_ref: null,
    status: "open",
    note: null,
    checked_by: null,
    checked_by_type: null,
    checked_at: null,
    checks: [],
    ...overrides,
  }
}

const progress = {
  phases: [
    { position: 1, phase_name: "Application & credit review" },
    { position: 2, phase_name: "Settlement documents" },
    { position: 3, phase_name: "Data entry & loan setup" },
  ],
} as unknown as CaseProgressResponse

describe("phaseLetterFromTaskCode", () => {
  it("reads the phase letter from the code prefix", () => {
    expect(phaseLetterFromTaskCode("A-01")).toBe("A")
    expect(phaseLetterFromTaskCode("E-12")).toBe("E")
  })

  it("uppercases a lowercase prefix", () => {
    expect(phaseLetterFromTaskCode("c-04")).toBe("C")
  })

  it("returns null for a code with no phase prefix", () => {
    // A multi-letter prefix is not a phase letter — only a single letter followed by the hyphen is,
    // which is what keeps a code like PRE-INQUIRY out of a phantom phase "P".
    expect(phaseLetterFromTaskCode("PRE-INQUIRY")).toBeNull()
    expect(phaseLetterFromTaskCode("0104")).toBeNull()
    expect(phaseLetterFromTaskCode(null)).toBeNull()
    expect(phaseLetterFromTaskCode(undefined)).toBeNull()
  })
})

describe("groupChecklistByPhase", () => {
  it("groups items into the phases the progress reports, in that order", () => {
    const groups = groupChecklistByPhase(
      [
        item({ task_code: "C-01" }),
        item({ task_code: "A-01" }),
        item({ task_code: "B-01" }),
      ],
      progress,
      "front_office"
    )
    expect(groups.map(g => g.letter)).toEqual(["A", "B", "C"])
    expect(groups[0].name).toBe("Application & credit review")
  })

  // The order comes from progress, not from sorting letters, so the sections line up with the
  // band above them even if a phase is renamed or reordered.
  it("follows the progress order rather than alphabetical order", () => {
    const reversed = {
      phases: [
        { position: 1, phase_name: "Third" },
        { position: 2, phase_name: "Second" },
      ],
    } as unknown as CaseProgressResponse
    const groups = groupChecklistByPhase(
      [item({ task_code: "B-01" }), item({ task_code: "A-01" })],
      reversed,
      undefined
    )
    expect(groups.map(g => g.name)).toEqual(["Third", "Second"])
  })

  // An empty section reads as "nothing to do here" when the truth is the checklist has no such
  // task at all, so a phase with no items is not rendered.
  it("omits a reported phase that carries no task", () => {
    const groups = groupChecklistByPhase(
      [item({ task_code: "A-01" })],
      progress,
      undefined
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].letter).toBe("A")
  })

  // A task that exists but cannot be placed still has to be workable, so it is never dropped.
  it("keeps items whose code carries no phase prefix in a trailing group", () => {
    const groups = groupChecklistByPhase(
      [item({ task_code: "A-01" }), item({ task_code: null })],
      progress,
      undefined
    )
    expect(groups.at(-1)?.letter).toBeNull()
    expect(groups.at(-1)?.items).toHaveLength(1)
  })

  it("keeps a phase the items mention but progress does not, after the known ones", () => {
    const groups = groupChecklistByPhase(
      [item({ task_code: "E-01" }), item({ task_code: "A-01" })],
      progress,
      undefined
    )
    expect(groups.map(g => g.letter)).toEqual(["A", "E"])
    expect(groups[1].name).toBeNull()
  })

  it("orders tasks within a phase by display_order", () => {
    const groups = groupChecklistByPhase(
      [
        item({ task_code: "A-03", display_order: 3 }),
        item({ task_code: "A-01", display_order: 1 }),
        item({ task_code: "A-02", display_order: 2 }),
      ],
      progress,
      undefined
    )
    expect(groups[0].items.map(i => i.task_code)).toEqual([
      "A-01",
      "A-02",
      "A-03",
    ])
  })

  it("puts items without a display_order behind those that have one", () => {
    const groups = groupChecklistByPhase(
      [
        item({ task_code: "A-09", display_order: null }),
        item({ task_code: "A-01", display_order: 1 }),
      ],
      progress,
      undefined
    )
    expect(groups[0].items.map(i => i.task_code)).toEqual(["A-01", "A-09"])
  })
})

describe("the open and yours counts", () => {
  it("counts only open items", () => {
    const groups = groupChecklistByPhase(
      [
        item({ task_code: "A-01", status: "open" }),
        item({ task_code: "A-02", status: "checked" }),
        item({ task_code: "A-03", status: "not_applicable" }),
      ],
      progress,
      "front_office"
    )
    expect(groups[0].openCount).toBe(1)
    expect(groups[0].items).toHaveLength(3)
  })

  it("counts as yours only the open items your role is responsible for", () => {
    const groups = groupChecklistByPhase(
      [
        item({ task_code: "A-01", responsible_roles: ["front_office"] }),
        item({ task_code: "A-02", responsible_roles: ["back_office"] }),
        // Settled, and therefore not outstanding work for anyone.
        item({
          task_code: "A-03",
          responsible_roles: ["front_office"],
          status: "checked",
        }),
      ],
      progress,
      "front_office"
    )
    expect(groups[0].openCount).toBe(2)
    expect(groups[0].yoursCount).toBe(1)
  })

  it("counts nothing as yours when the role is unknown", () => {
    const groups = groupChecklistByPhase(
      [item({ task_code: "A-01" })],
      progress,
      undefined
    )
    expect(groups[0].yoursCount).toBe(0)
  })
})

describe("isOwnedByRole", () => {
  it("reads the role set when the wire sends one", () => {
    expect(
      isOwnedByRole(
        item({ responsible_roles: ["back_office", "front_office"] }),
        "back_office"
      )
    ).toBe(true)
  })

  it("falls back to the single responsible_role", () => {
    expect(
      isOwnedByRole(
        item({ responsible_roles: null, responsible_role: "front_office" }),
        "front_office"
      )
    ).toBe(true)
  })

  /**
   * The catalogue calls the role `back_office_risk`; a signed-in user carries `back_office`.
   * US 1.15's permission matrix states they are the same role. Without the alias every phase would
   * report "0 yours" for a back-office user, which is the kind of wrong that looks like no work.
   */
  it("treats the catalogue's back_office_risk as the platform's back_office", () => {
    expect(
      isOwnedByRole(
        item({ responsible_roles: null, responsible_role: "back_office_risk" }),
        "back_office"
      )
    ).toBe(true)
  })

  it("does not match a catalogue role with no platform counterpart", () => {
    for (const named of [
      "compliance",
      "legal",
      "treasury",
      "system",
    ] as const) {
      expect(
        isOwnedByRole(
          item({ responsible_roles: null, responsible_role: named }),
          "back_office"
        )
      ).toBe(false)
    }
  })

  // A task with no responsible role named is nobody's in particular. Counting it as yours would
  // make the screen claim work is assigned to you when nothing says so.
  it("is false when no responsible role is named", () => {
    expect(
      isOwnedByRole(
        item({ responsible_roles: [], responsible_role: null }),
        "front_office"
      )
    ).toBe(false)
  })

  it("prefers the set over the single value when both are present", () => {
    expect(
      isOwnedByRole(
        item({
          responsible_roles: ["back_office"],
          responsible_role: "front_office",
        }),
        "front_office"
      )
    ).toBe(false)
  })
})

describe("phaseHeading", () => {
  it("joins the letter and the name", () => {
    expect(
      phaseHeading({
        letter: "A",
        name: "Application & credit review",
        items: [],
        openCount: 0,
        yoursCount: 0,
      })
    ).toBe("A · Application & credit review")
  })

  it("degrades to whichever half is known", () => {
    const base = { items: [], openCount: 0, yoursCount: 0 }
    expect(phaseHeading({ ...base, letter: "E", name: null })).toBe("E")
    expect(phaseHeading({ ...base, letter: null, name: "Archive" })).toBe(
      "Archive"
    )
    expect(phaseHeading({ ...base, letter: null, name: null })).toBeNull()
  })
})

describe("taskNumber", () => {
  it("uses display_order when the wire gives one", () => {
    expect(taskNumber(item({ display_order: 7 }), 0)).toBe(7)
  })

  // So a section is never numbered with blanks.
  it("falls back to the position within the section", () => {
    expect(taskNumber(item({ display_order: null }), 2)).toBe(3)
  })
})
