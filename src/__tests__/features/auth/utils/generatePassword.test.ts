import { describe, it, expect } from "vitest"
import { generatePassword } from "@/features/auth/utils/generatePassword"
import { PasswordPolicySchema } from "@/features/auth/api/passwordPolicy"

describe("generatePassword", () => {
  it("returns exactly 16 characters", () => {
    expect(generatePassword()).toHaveLength(16)
  })

  it("contains at least one lowercase letter", () => {
    expect(/[a-z]/.test(generatePassword())).toBe(true)
  })

  it("contains at least one uppercase letter", () => {
    expect(/[A-Z]/.test(generatePassword())).toBe(true)
  })

  it("contains at least one digit", () => {
    expect(/[0-9]/.test(generatePassword())).toBe(true)
  })

  it("contains at least one symbol", () => {
    expect(/[^a-zA-Z0-9]/.test(generatePassword())).toBe(true)
  })

  it("passes the password policy Zod schema", () => {
    expect(() => PasswordPolicySchema.parse(generatePassword())).not.toThrow()
  })

  it("produces different values on consecutive calls", () => {
    expect(generatePassword()).not.toBe(generatePassword())
  })
})
