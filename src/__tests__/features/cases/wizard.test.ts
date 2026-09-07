import { describe, expect, it } from "vitest"
import {
  CASE_WIZARD_STEPS,
  canOpenStep,
  furthestOpenStep,
  nextStep,
  previousStep,
} from "@/features/cases/wizard"
import type { CaseWizardProgress } from "@/features/cases/wizard"

const NOTHING_DONE: CaseWizardProgress = {
  isLeasingCompanyBound: false,
  hasContracts: false,
}
const STEP_ONE_DONE: CaseWizardProgress = {
  isLeasingCompanyBound: true,
  hasContracts: false,
}
const STEP_TWO_DONE: CaseWizardProgress = {
  isLeasingCompanyBound: true,
  hasContracts: true,
}

describe("CASE_WIZARD_STEPS", () => {
  // Three, not five. R2's D-77 settled this and the click dummy's five-step version is a recorded
  // defect (US 1.1, "Known defects in reference material") — so this asserts the count on purpose.
  it("is the design's three steps in order", () => {
    expect(CASE_WIZARD_STEPS).toEqual([
      "leasingCompany",
      "contracts",
      "summary",
    ])
  })
})

describe("nextStep / previousStep", () => {
  it("walks forward and stops at the last step", () => {
    expect(nextStep("leasingCompany")).toBe("contracts")
    expect(nextStep("contracts")).toBe("summary")
    expect(nextStep("summary")).toBeNull()
  })

  it("walks back and stops at the first step", () => {
    expect(previousStep("summary")).toBe("contracts")
    expect(previousStep("contracts")).toBe("leasingCompany")
    expect(previousStep("leasingCompany")).toBeNull()
  })
})

describe("canOpenStep", () => {
  // Always reachable: the user must be able to return and change the company, and it is where the
  // wizard opens.
  it("always allows step 1", () => {
    expect(canOpenStep("leasingCompany", NOTHING_DONE)).toBe(true)
    expect(canOpenStep("leasingCompany", STEP_TWO_DONE)).toBe(true)
  })

  // The import validates rows against the bound product template, so opening step 2 first would
  // produce a whole-file precondition error rather than a usable screen.
  it("gates step 2 on the company and template being bound", () => {
    expect(canOpenStep("contracts", NOTHING_DONE)).toBe(false)
    expect(canOpenStep("contracts", STEP_ONE_DONE)).toBe(true)
  })

  it("gates step 3 on there being contracts", () => {
    expect(canOpenStep("summary", STEP_ONE_DONE)).toBe(false)
    expect(canOpenStep("summary", STEP_TWO_DONE)).toBe(true)
  })

  // Guards against a future edit that lets the summary open off `hasContracts` alone — a case can
  // never hold contracts without a company, but the guard should not rely on that being impossible.
  it("does not allow step 3 on contracts alone", () => {
    expect(
      canOpenStep("summary", {
        isLeasingCompanyBound: false,
        hasContracts: true,
      })
    ).toBe(false)
  })
})

describe("furthestOpenStep", () => {
  // Re-entering a draft should land on the work still to do, not make the user walk forward
  // through steps already completed.
  it("resumes a draft at the first unfinished step", () => {
    expect(furthestOpenStep(NOTHING_DONE)).toBe("leasingCompany")
    expect(furthestOpenStep(STEP_ONE_DONE)).toBe("contracts")
    expect(furthestOpenStep(STEP_TWO_DONE)).toBe("summary")
  })
})
