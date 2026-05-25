import { describe, it, expect } from "vitest"
import {
  ActivateAccountInputSchema,
  decodeTokenEmail,
} from "@/features/auth/api/activationSchema"

const VALID = "Abcdef1!"

describe("ActivateAccountInputSchema", () => {
  it("accepts matching valid passwords", () => {
    expect(() =>
      ActivateAccountInputSchema.parse({
        password: VALID,
        password_confirm: VALID,
      })
    ).not.toThrow()
  })

  it("rejects mismatched passwords", () => {
    expect(() =>
      ActivateAccountInputSchema.parse({
        password: VALID,
        password_confirm: "Different1!",
      })
    ).toThrow()
  })

  it("rejects password shorter than 8 characters", () => {
    expect(() =>
      ActivateAccountInputSchema.parse({
        password: "Ab1!",
        password_confirm: "Ab1!",
      })
    ).toThrow()
  })

  it("rejects password without uppercase", () => {
    expect(() =>
      ActivateAccountInputSchema.parse({
        password: "abcdef1!",
        password_confirm: "abcdef1!",
      })
    ).toThrow()
  })

  it("rejects password without lowercase", () => {
    expect(() =>
      ActivateAccountInputSchema.parse({
        password: "ABCDEF1!",
        password_confirm: "ABCDEF1!",
      })
    ).toThrow()
  })

  it("rejects password without number", () => {
    expect(() =>
      ActivateAccountInputSchema.parse({
        password: "Abcdefg!",
        password_confirm: "Abcdefg!",
      })
    ).toThrow()
  })

  it("rejects password without symbol", () => {
    expect(() =>
      ActivateAccountInputSchema.parse({
        password: "Abcdef12",
        password_confirm: "Abcdef12",
      })
    ).toThrow()
  })

  it("puts the mismatch error on the password_confirm path", () => {
    const result = ActivateAccountInputSchema.safeParse({
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
