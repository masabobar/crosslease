import { describe, it, expect } from "vitest"
import type { TFunction } from "i18next"
import { resolveFormMessage } from "@/lib/formMessages"

// Stands in for a component's namespaced `t`: returns the key so assertions can see exactly which
// key was looked up, and honours `defaultValue` the way i18next does for a missing key.
const KNOWN_FEATURE_KEYS = new Set([
  "create.errors.validToBeforeValidFrom",
  "create.errors.validFromInPast",
  "common:validation.required",
  "common:validation.tooLong",
])

const t = ((key: string, options?: { defaultValue?: string }) =>
  KNOWN_FEATURE_KEYS.has(key)
    ? key
    : (options?.defaultValue ??
      key)) as unknown as TFunction<"documentRequirements">

describe("resolveFormMessage", () => {
  it("returns undefined when there is no message", () => {
    expect(resolveFormMessage(undefined, t, "create.errors")).toBeUndefined()
  })

  it("resolves a shared code from the common namespace", () => {
    expect(resolveFormMessage("required", t, "create.errors")).toBe(
      "common:validation.required"
    )
    expect(resolveFormMessage("tooLong", t, "create.errors")).toBe(
      "common:validation.tooLong"
    )
  })

  it("resolves a feature code under the form's own prefix", () => {
    expect(
      resolveFormMessage("validToBeforeValidFrom", t, "create.errors")
    ).toBe("create.errors.validToBeforeValidFrom")
  })

  it("prefers the common namespace over the feature prefix for a shared code", () => {
    expect(
      resolveFormMessage("required", t, "requirement.errors")
    ).not.toContain("requirement.errors")
  })

  // The regression this helper exists for: both of these used to be concatenated onto a key
  // prefix and rendered as a mangled key path (i18next splits on its own `:` and `.`).
  it("passes through the already-translated server message verbatim", () => {
    const serverMessage = "The server rejected this value."
    expect(resolveFormMessage(serverMessage, t, "create.errors")).toBe(
      serverMessage
    )
  })

  it("passes through Zod's built-in text verbatim, colons included", () => {
    const zodMessage = "Too big: expected string to have <=200 characters"
    expect(resolveFormMessage(zodMessage, t, "create.errors")).toBe(zodMessage)
  })
})
