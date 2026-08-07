import { describe, it, expect } from "vitest"
import {
  SetPasswordResponseSchema,
  decodeTokenEmail,
} from "@/features/auth/api/activationSchema"

describe("SetPasswordResponseSchema", () => {
  it("accepts mfa_enrollment_required=false", () => {
    expect(() =>
      SetPasswordResponseSchema.parse({ mfa_enrollment_required: false })
    ).not.toThrow()
  })

  it("accepts mfa_enrollment_required=true with mfa_token", () => {
    expect(() =>
      SetPasswordResponseSchema.parse({
        mfa_enrollment_required: true,
        mfa_token: "tok",
      })
    ).not.toThrow()
  })

  it("rejects missing mfa_enrollment_required", () => {
    expect(() => SetPasswordResponseSchema.parse({})).toThrow()
  })
})

describe("decodeTokenEmail", () => {
  it("returns email from a valid JWT payload", () => {
    const payload = btoa(JSON.stringify({ email: "user@example.com" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
    const token = `header.${payload}.signature`
    expect(decodeTokenEmail(token)).toBe("user@example.com")
  })

  it("returns null for a malformed token", () => {
    expect(decodeTokenEmail("not-a-jwt")).toBeNull()
  })

  it("returns null when email field is absent", () => {
    const payload = btoa(JSON.stringify({ sub: "user-id" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
    const token = `header.${payload}.signature`
    expect(decodeTokenEmail(token)).toBeNull()
  })
})
