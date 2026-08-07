import { describe, it, expect } from "vitest"
import {
  MIN_PASSWORD_LENGTH,
  PASSWORDS_DO_NOT_MATCH,
  PASSWORD_NEEDS_LOWERCASE,
  PASSWORD_NEEDS_NUMBER,
  PASSWORD_NEEDS_SYMBOL,
  PASSWORD_NEEDS_UPPERCASE,
  PASSWORD_TOO_SHORT,
  PasswordPolicySchema,
  SetPasswordFormSchema,
  getPasswordRequirements,
} from "@/features/auth/api/passwordPolicy"

const VALID = "Abcdef1!"

describe("PasswordPolicySchema", () => {
  it("accepts a password meeting every rule", () => {
    expect(() => PasswordPolicySchema.parse(VALID)).not.toThrow()
  })

  it.each([
    ["shorter than the minimum", "Ab1!", PASSWORD_TOO_SHORT],
    ["without an uppercase letter", "abcdef1!", PASSWORD_NEEDS_UPPERCASE],
    ["without a lowercase letter", "ABCDEF1!", PASSWORD_NEEDS_LOWERCASE],
    ["without a number", "Abcdefg!", PASSWORD_NEEDS_NUMBER],
    ["without a symbol", "Abcdef12", PASSWORD_NEEDS_SYMBOL],
  ])("rejects a password %s with the %s code", (_label, password, code) => {
    const result = PasswordPolicySchema.safeParse(password)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(i => i.message)).toContain(code)
    }
  })

  it("reports a message code, never display prose", () => {
    const result = PasswordPolicySchema.safeParse("a")
    expect(result.success).toBe(false)
    if (!result.success) {
      for (const issue of result.error.issues) {
        expect(issue.message).toMatch(/^[A-Z_]+$/)
      }
    }
  })
})

describe("SetPasswordFormSchema", () => {
  it("accepts matching valid passwords", () => {
    expect(() =>
      SetPasswordFormSchema.parse({
        password: VALID,
        passwordConfirm: VALID,
      })
    ).not.toThrow()
  })

  it("rejects mismatched passwords", () => {
    expect(() =>
      SetPasswordFormSchema.parse({
        password: VALID,
        passwordConfirm: "Different1!",
      })
    ).toThrow()
  })

  it("puts the mismatch error on the passwordConfirm path", () => {
    const result = SetPasswordFormSchema.safeParse({
      password: VALID,
      passwordConfirm: "Wrong1!",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const mismatch = result.error.issues.find(
        i => i.message === PASSWORDS_DO_NOT_MATCH
      )
      expect(mismatch?.path).toEqual(["passwordConfirm"])
    }
  })

  it.each([
    ["shorter than 8 characters", "Ab1!"],
    ["without an uppercase letter", "abcdef1!"],
    ["without a lowercase letter", "ABCDEF1!"],
    ["without a number", "Abcdefg!"],
    ["without a symbol", "Abcdef12"],
  ])("rejects a password %s", (_label, password) => {
    expect(() =>
      SetPasswordFormSchema.parse({
        password,
        passwordConfirm: password,
      })
    ).toThrow()
  })

  it("rejects a missing passwordConfirm", () => {
    expect(() => SetPasswordFormSchema.parse({ password: VALID })).toThrow()
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
    expect(getPasswordRequirements(VALID)).toEqual({
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

  it("agrees with the schema on the minimum length boundary", () => {
    const atMinimum = "Abcdef1!"
    expect(atMinimum).toHaveLength(MIN_PASSWORD_LENGTH)
    expect(getPasswordRequirements(atMinimum).minLength).toBe(true)
    expect(PasswordPolicySchema.safeParse(atMinimum).success).toBe(true)

    const belowMinimum = atMinimum.slice(0, MIN_PASSWORD_LENGTH - 1)
    expect(getPasswordRequirements(belowMinimum).minLength).toBe(false)
    expect(PasswordPolicySchema.safeParse(belowMinimum).success).toBe(false)
  })

  // The strength meter and validation are both derived from MIN_PASSWORD_LENGTH and the
  // same regexes, so a password the meter reports as fully compliant must always parse.
  it("never reports all requirements met for a password the schema rejects", () => {
    const samples = [
      "Abcdef1!",
      "Ab1!",
      "abcdef1!",
      "ABCDEF1!",
      "Abcdefg!",
      "Abcdef12",
      "LongEnough9$",
    ]
    for (const sample of samples) {
      const allMet = Object.values(getPasswordRequirements(sample)).every(
        Boolean
      )
      if (allMet) {
        expect(PasswordPolicySchema.safeParse(sample).success).toBe(true)
      }
    }
  })
})
