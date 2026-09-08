import { describe, expect, it } from "vitest"
import {
  CASE_TRANSITIONS,
  isDestructiveTransition,
  isKnownCaseStatus,
  isTerminalDisplayStatus,
  offeredTransitions,
} from "@/features/cases/caseTransitions"

describe("isTerminalDisplayStatus", () => {
  it("recognises the finished states", () => {
    for (const s of ["committed", "rejected", "cancelled", "done"]) {
      expect(isTerminalDisplayStatus(s)).toBe(true)
    }
  })

  it("does not treat in-flight states as finished", () => {
    for (const s of [
      "draft",
      "submitted",
      "rework",
      "missing_information",
      "open",
    ]) {
      expect(isTerminalDisplayStatus(s)).toBe(false)
    }
  })

  // `display_status` arrives Title Case with spaces ("Missing information"), which is why it is
  // slugged before comparison — the same defect class that once made every badge grey.
  it("handles the wire's Title Case form", () => {
    expect(isTerminalDisplayStatus("Cancelled")).toBe(true)
    expect(isTerminalDisplayStatus("Missing information")).toBe(false)
  })
})

describe("offeredTransitions", () => {
  // Resubmission undoes a send-back, so it is offered only where there is something to undo.
  it("offers resubmit only on a case that was sent back", () => {
    expect(offeredTransitions("rework")).toContain("resubmit")
    expect(offeredTransitions("missing_information")).toContain("resubmit")
    expect(offeredTransitions("submitted")).not.toContain("resubmit")
    expect(offeredTransitions("draft")).not.toContain("resubmit")
  })

  // Reactivate exists to bring a finished case back, so it is the ONLY thing offered there —
  // returning a closed case to a queue or cancelling it again is meaningless.
  it("offers only reactivate on a finished case", () => {
    expect(offeredTransitions("rejected")).toEqual(["reactivate"])
    expect(offeredTransitions("cancelled")).toEqual(["reactivate"])
  })

  it("offers return-to-queue and cancel on an in-flight case", () => {
    const t = offeredTransitions("submitted")
    expect(t).toContain("return_to_queue")
    expect(t).toContain("cancel")
    expect(t).not.toContain("reactivate")
  })

  // The point of the module: it never claims to know configured legality, only structure. So an
  // unrecognised status still gets the safe in-flight set rather than nothing at all.
  it("falls back to the in-flight set for an unknown status", () => {
    expect(offeredTransitions("waiting_on_lessee")).toEqual([
      "return_to_queue",
      "cancel",
    ])
  })
})

describe("isDestructiveTransition", () => {
  it("marks only cancel", () => {
    expect(isDestructiveTransition("cancel")).toBe(true)
    for (const t of CASE_TRANSITIONS.filter(x => x !== "cancel")) {
      expect(isDestructiveTransition(t)).toBe(false)
    }
  })
})

describe("isKnownCaseStatus", () => {
  // `case_status` is the stored four-value set; `display_status` is the derived one and is
  // deliberately permissive. Conflating them is what US 1.1 warns against.
  it("accepts the four stored values and rejects a derived one", () => {
    for (const s of ["open", "waiting", "done", "cancelled"]) {
      expect(isKnownCaseStatus(s)).toBe(true)
    }
    expect(isKnownCaseStatus("missing_information")).toBe(false)
    expect(isKnownCaseStatus("committed")).toBe(false)
  })
})
