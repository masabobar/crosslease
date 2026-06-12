import { describe, it, expect } from "vitest"
import {
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
  ResetPasswordResponseSchema,
  getPasswordRequirements,
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

describe("ResetPasswordInputSchema", () => {
  const VALID = "Abcdef1!"

  it("accepts matching valid passwords", () => {
    expect(() =>
      ResetPasswordInputSchema.parse({
        password: VALID,
        password_confirm: VALID,
      })
    ).not.toThrow()
  })

  it("rejects mismatched passwords", () => {
    expect(() =>
      ResetPasswordInputSchema.parse({
        password: VALID,
        password_confirm: "Different1!",
      })
    ).toThrow()
  })

  it("rejects a password shorter than 8 characters", () => {
    expect(() =>
      ResetPasswordInputSchema.parse({
        password: "Ab1!",
        password_confirm: "Ab1!",
      })
    ).toThrow()
  })

  it("rejects a password without an uppercase letter", () => {
    expect(() =>
      ResetPasswordInputSchema.parse({
        password: "abcdef1!",
        password_confirm: "abcdef1!",
      })
    ).toThrow()
  })

  it("rejects a password without a lowercase letter", () => {
    expect(() =>
      ResetPasswordInputSchema.parse({
        password: "ABCDEF1!",
        password_confirm: "ABCDEF1!",
      })
    ).toThrow()
  })

  it("rejects a password without a number", () => {
    expect(() =>
      ResetPasswordInputSchema.parse({
        password: "Abcdefg!",
        password_confirm: "Abcdefg!",
      })
    ).toThrow()
  })

  it("rejects a password without a symbol", () => {
    expect(() =>
      ResetPasswordInputSchema.parse({
        password: "Abcdef12",
        password_confirm: "Abcdef12",
      })
    ).toThrow()
  })

  it("puts the mismatch error on the password_confirm path", () => {
    const result = ResetPasswordInputSchema.safeParse({
      password: VALID,
      password_confirm: "Wrong1!",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join("."))
      expect(paths).toContain("password_confirm")
    }
  })
})

describe("getPasswordRequirements", () => {
  it("returns all false for an empty string", () => {
    expect(getPasswordRequirements("")).toEqual({
      minLength: false,
      hasLower: false,
      hasUpper: false,
      hasNumber: false,
      hasSymbol: false,
    })
  })

  it("returns all true for a fully valid password", () => {
    expect(getPasswordRequirements("Abcdef1!")).toEqual({
      minLength: true,
      hasLower: true,
      hasUpper: true,
      hasNumber: true,
      hasSymbol: true,
    })
  })

  it("detects minLength independently", () => {
    expect(getPasswordRequirements("Abc1!").minLength).toBe(false)
    expect(getPasswordRequirements("Abcdef1!").minLength).toBe(true)
  })

  it("detects missing uppercase independently", () => {
    expect(getPasswordRequirements("abcdef1!").hasUpper).toBe(false)
  })

  it("detects missing lowercase independently", () => {
    expect(getPasswordRequirements("ABCDEF1!").hasLower).toBe(false)
  })

  it("detects missing number independently", () => {
    expect(getPasswordRequirements("Abcdefg!").hasNumber).toBe(false)
  })

  it("detects missing symbol independently", () => {
    expect(getPasswordRequirements("Abcdef12").hasSymbol).toBe(false)
  })
})
