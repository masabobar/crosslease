import { describe, it, expect } from "vitest"
import {
  EMAIL_INVALID,
  EMAIL_REQUIRED,
  ForgotPasswordInputSchema,
  ResetPasswordResponseSchema,
} from "@/features/auth/api/forgotPasswordSchema"

describe("ResetPasswordResponseSchema", () => {
  it("accepts mfa_required=false", () => {
    expect(() =>
      ResetPasswordResponseSchema.parse({ mfa_required: false })
    ).not.toThrow()
  })

  it("accepts mfa_required=true with mfa_token", () => {
    expect(() =>
      ResetPasswordResponseSchema.parse({
        mfa_required: true,
        mfa_token: "tok",
      })
    ).not.toThrow()
  })

  it("rejects missing mfa_required", () => {
    expect(() => ResetPasswordResponseSchema.parse({})).toThrow()
  })
})

describe("ForgotPasswordInputSchema", () => {
  it("accepts a valid email", () => {
    expect(() =>
      ForgotPasswordInputSchema.parse({ email: "user@example.com" })
    ).not.toThrow()
  })

  it("rejects empty string", () => {
    expect(() => ForgotPasswordInputSchema.parse({ email: "" })).toThrow()
  })

  it("rejects a non-email string", () => {
    expect(() =>
      ForgotPasswordInputSchema.parse({ email: "notanemail" })
    ).toThrow()
  })
})

describe("ForgotPasswordInputSchema message codes", () => {
  it("reports EMAIL_REQUIRED for an empty value", () => {
    const result = ForgotPasswordInputSchema.safeParse({ email: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain(EMAIL_REQUIRED)
    }
  })

  it("reports EMAIL_INVALID for a malformed address", () => {
    const result = ForgotPasswordInputSchema.safeParse({ email: "notanemail" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain(EMAIL_INVALID)
    }
  })
})
