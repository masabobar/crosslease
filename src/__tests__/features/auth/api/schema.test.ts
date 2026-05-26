import { describe, it, expect } from "vitest"
import {
  LoginInputSchema,
  LoginResponseSchema,
  MfaRequiredResponseSchema,
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

describe("MfaRequiredResponseSchema", () => {
  it("accepts a valid MFA response", () => {
    expect(() =>
      MfaRequiredResponseSchema.parse({
        status: "MFA_REQUIRED",
        verification_token: "tok",
        expires_in: 300,
      })
    ).not.toThrow()
  })

  it("rejects wrong status", () => {
    expect(() =>
      MfaRequiredResponseSchema.parse({
        status: "OTHER",
        verification_token: "tok",
        expires_in: 300,
      })
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
    access_valid_from: null,
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
