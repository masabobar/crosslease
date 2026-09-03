import { describe, expect, it } from "vitest"
import { phaseLetter } from "@/features/cases/utils"

describe("phaseLetter", () => {
  it("maps the 1-based wire position onto A-first letters", () => {
    expect(phaseLetter(1)).toBe("A")
    expect(phaseLetter(2)).toBe("B")
    expect(phaseLetter(5)).toBe("E")
  })

  it("returns null for an unknown position when no fallback index is given", () => {
    // The list row's case: there is no array to take an ordinal from, so an em-dash is the only
    // honest answer. Returning "A" here would label every phase-less case as the first phase.
    expect(phaseLetter(null)).toBeNull()
    expect(phaseLetter(undefined)).toBeNull()
    expect(phaseLetter(0)).toBeNull()
  })

  it("falls back to the array index when one is supplied", () => {
    // The progress band's case: an unnamed phase still needs a stable letter rather than an
    // empty circle.
    expect(phaseLetter(null, 0)).toBe("A")
    expect(phaseLetter(null, 3)).toBe("D")
    expect(phaseLetter(0, 2)).toBe("C")
  })

  it("prefers the wire position over the fallback index when both are usable", () => {
    // Guards the case that matters most: a backend that returns phases out of array order must
    // still letter them by position, or the list and the band disagree.
    expect(phaseLetter(4, 0)).toBe("D")
  })

  it("returns the ordinal as a string past the end of the letter run", () => {
    // Nine phases is wrong-looking on purpose — a repeated "H" would be worse, because two
    // different phases would render identically.
    expect(phaseLetter(9)).toBe("9")
  })

  it("agrees with itself across both call shapes for a known position", () => {
    // The whole reason this is one function: the two surfaces must never differ on a letter.
    for (let position = 1; position <= 5; position++) {
      expect(phaseLetter(position)).toBe(phaseLetter(position, 99))
    }
  })
})
