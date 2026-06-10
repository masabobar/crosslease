import { describe, it, expect } from "vitest"
import {
  LoginInputSchema,
  LoginResponseSchema,
  LoginStepResponseSchema,
  VerifyOtpInputSchema,
} from "@/features/auth/api/schema"

describe("LoginInputSchema", () => {
  it("accepts valid credentials", () => {
    expect(() =>
      LoginInputSchema.parse({ email: "user@example.com", password: "secret" })
    ).not.toThrow()
  })

  it("rejects invalid email", () => {
    expect(() =>
      LoginInputSchema.parse({ email: "not-an-email", password: "secret" })
    ).toThrow()
  })

  it("rejects empty email", () => {
    expect(() =>
      LoginInputSchema.parse({ email: "", password: "secret" })
    ).toThrow()
  })

  it("rejects empty password", () => {
    expect(() =>
      LoginInputSchema.parse({ email: "user@example.com", password: "" })
    ).toThrow()
  })
})

describe("LoginStepResponseSchema", () => {
  it("accepts an otp step response", () => {
    expect(() =>
      LoginStepResponseSchema.parse({
        next_step: "otp",
        token: "tok",
        expires_in: 300,
      })
    ).not.toThrow()
  })

  it("accepts a session step response with null token", () => {
    expect(() =>
      LoginStepResponseSchema.parse({ next_step: "session", token: null })
    ).not.toThrow()
  })

  it("accepts mfa and mfa_setup steps", () => {
    expect(() =>
      LoginStepResponseSchema.parse({
        next_step: "mfa",
        token: "tok",
        expires_in: 300,
      })
    ).not.toThrow()
    expect(() =>
      LoginStepResponseSchema.parse({
        next_step: "mfa_setup",
        token: "tok",
        expires_in: 300,
      })
    ).not.toThrow()
  })

  it("rejects unknown next_step", () => {
    expect(() =>
      LoginStepResponseSchema.parse({ next_step: "unknown", token: "tok" })
    ).toThrow()
  })
})

describe("VerifyOtpInputSchema", () => {
  it("accepts valid input", () => {
    expect(() =>
      VerifyOtpInputSchema.parse({ verification_token: "tok", code: "123456" })
    ).not.toThrow()
  })

  it("rejects code shorter than 6", () => {
    expect(() =>
      VerifyOtpInputSchema.parse({ verification_token: "tok", code: "12345" })
    ).toThrow()
  })

  it("rejects code longer than 6", () => {
    expect(() =>
      VerifyOtpInputSchema.parse({ verification_token: "tok", code: "1234567" })
    ).toThrow()
  })
})

describe("LoginResponseSchema", () => {
  const validUser = {
    id: "00000000-0000-0000-0000-000000000000",
    user_id: "USR-00001",
    first_name: "Test",
    last_name: "User",
    email: "test@example.com",
    role: "system_admin",
    tenant_id: null,
    status: "active",
    access_valid_until: null,
    invited_by: null,
    invited_at: null,
    activated_at: null,
    last_login: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }

  it("accepts a valid verify-otp response with user only", () => {
    expect(() => LoginResponseSchema.parse({ user: validUser })).not.toThrow()
  })

  it("rejects missing user", () => {
    expect(() => LoginResponseSchema.parse({})).toThrow()
  })

  it("rejects invalid user shape", () => {
    expect(() =>
      LoginResponseSchema.parse({ user: { email: "bad-email" } })
    ).toThrow()
  })
})
