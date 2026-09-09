import { describe, expect, it } from "vitest"
import {
  isFreezingStep,
  stepMoveFor,
} from "@/features/workflowTaskCatalog/checklistStepMoves"

describe("stepMoveFor", () => {
  it("annotates the seven steps the dummy marks", () => {
    expect(stepMoveFor("A-3")).toBe("commitsRequest")
    expect(stepMoveFor("B-7")).toBe("putsOnHold")
    expect(stepMoveFor("C-1")).toBe("freezesInputs")
    expect(stepMoveFor("C-4")).toBe("closesWayBack")
    expect(stepMoveFor("D-5")).toBe("releasesDisbursement")
    expect(stepMoveFor("E-6")).toBe("startsMoveToActive")
    expect(stepMoveFor("E-12")).toBe("completesAndArchives")
  })

  it("matches a lowercase code", () => {
    expect(stepMoveFor("a-3")).toBe("commitsRequest")
  })

  // The map is a set of annotations, not a claim about which codes exist. A tenant with a
  // differently-coded catalogue loses the pill rather than gaining a wrong one.
  it("returns null for a code it does not annotate", () => {
    expect(stepMoveFor("A-1")).toBeNull()
    expect(stepMoveFor("E-3")).toBeNull()
    expect(stepMoveFor(null)).toBeNull()
    expect(stepMoveFor(undefined)).toBeNull()
  })

  // "A-1" must not match "A-12" or vice versa — the whole code is the key, not a prefix.
  it("does not match a code that merely starts the same", () => {
    expect(stepMoveFor("A-30")).toBeNull()
    expect(stepMoveFor("E-120")).toBeNull()
  })
})

describe("isFreezingStep", () => {
  // Freezing and advancing are different consequences, and step 15 (C-1) does both.
  it("marks the two freeze points", () => {
    expect(isFreezingStep("C-1")).toBe(true)
    expect(isFreezingStep("C-4")).toBe(true)
  })

  it("is false for a step that only advances", () => {
    expect(isFreezingStep("A-3")).toBe(false)
    expect(isFreezingStep("D-5")).toBe(false)
    expect(isFreezingStep(null)).toBe(false)
  })
})
