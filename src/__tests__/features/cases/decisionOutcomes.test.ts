import { describe, expect, it } from "vitest"
import {
  DECISION_OUTCOMES,
  canSubmitDecision,
  outcomeVariant,
  requiresReason,
} from "@/features/cases/decisionOutcomes"

describe("DECISION_OUTCOMES", () => {
  // Four, not two. The client confirmed them (Q-007) and StateTransitionOutcome on the wire says
  // the same; the Figma frame's Approve/Reject pair is the thing that is wrong.
  it("is the four confirmed outcomes", () => {
    expect(DECISION_OUTCOMES).toEqual([
      "committed",
      "rejected",
      "missing_information",
      "rework",
    ])
  })

  // AC-04 forbids treating these as one. Asserted because collapsing them is the easy mistake and
  // the design invites it.
  it("keeps missing_information and rework separate", () => {
    expect(DECISION_OUTCOMES).toContain("missing_information")
    expect(DECISION_OUTCOMES).toContain("rework")
  })

  // `RequestStatus`, the endpoint's declared type, also carries these two — but they are states a
  // request passes through, not verdicts, so they must never be offered.
  it("does not offer draft or submitted as decisions", () => {
    expect(DECISION_OUTCOMES).not.toContain("draft")
    expect(DECISION_OUTCOMES).not.toContain("submitted")
  })
})

describe("requiresReason", () => {
  it("requires a reason for everything that sends the case back", () => {
    expect(requiresReason("rejected")).toBe(true)
    expect(requiresReason("missing_information")).toBe(true)
    expect(requiresReason("rework")).toBe(true)
  })

  // The case is its own record of what was approved.
  it("does not require one to approve", () => {
    expect(requiresReason("committed")).toBe(false)
  })
})

describe("canSubmitDecision", () => {
  it("needs an outcome chosen", () => {
    expect(canSubmitDecision(null, "anything")).toBe(false)
  })

  it("lets an approval through with no reason", () => {
    expect(canSubmitDecision("committed", "")).toBe(true)
  })

  it("blocks a rejection with no reason", () => {
    expect(canSubmitDecision("rejected", "")).toBe(false)
    expect(canSubmitDecision("rejected", "   ")).toBe(false)
    expect(canSubmitDecision("rejected", "Collateral cover insufficient")).toBe(
      true
    )
  })
})

describe("outcomeVariant", () => {
  it("distinguishes approval, refusal and the two that send it back", () => {
    expect(outcomeVariant("committed")).toBe("default")
    expect(outcomeVariant("rejected")).toBe("destructive")
    expect(outcomeVariant("missing_information")).toBe("secondary")
    expect(outcomeVariant("rework")).toBe("secondary")
  })
})
