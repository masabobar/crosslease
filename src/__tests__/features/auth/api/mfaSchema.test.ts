import { describe, it, expect } from "vitest"
import {
  MfaEnrollResponseSchema,
  MfaActivateResponseSchema,
  MfaVerifyResponseSchema,
  ResetVerifyResponseSchema,
} from "@/features/auth/api/mfaSchema"

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

describe("MfaEnrollResponseSchema", () => {
  it("accepts a valid enroll response", () => {
    expect(() =>
      MfaEnrollResponseSchema.parse({
        qr_code: "base64string",
        secret: "JBSWY3DPEHPK3PXP",
        mfa_token: "tok",
      })
    ).not.toThrow()
  })

  it("rejects missing qr_code", () => {
    expect(() =>
      MfaEnrollResponseSchema.parse({
        secret: "JBSWY3DPEHPK3PXP",
        mfa_token: "tok",
      })
    ).toThrow()
  })

  it("rejects missing mfa_token", () => {
    expect(() =>
      MfaEnrollResponseSchema.parse({ qr_code: "b64", secret: "SECRET" })
    ).toThrow()
  })
})

describe("MfaActivateResponseSchema", () => {
  it("accepts a valid activate response", () => {
    expect(() =>
      MfaActivateResponseSchema.parse({
        recovery_codes: ["abc123def456789012", "def456abc123789012"],
        user: validUser,
      })
    ).not.toThrow()
  })

  it("rejects missing recovery_codes", () => {
    expect(() => MfaActivateResponseSchema.parse({ user: validUser })).toThrow()
  })

  it("rejects recovery_codes that are not an array", () => {
    expect(() =>
      MfaActivateResponseSchema.parse({
        recovery_codes: "notanarray",
        user: validUser,
      })
    ).toThrow()
  })

  it("rejects missing user", () => {
    expect(() =>
      MfaActivateResponseSchema.parse({ recovery_codes: [] })
    ).toThrow()
  })
})

describe("MfaVerifyResponseSchema", () => {
  it("accepts a response without new_recovery_codes", () => {
    expect(() =>
      MfaVerifyResponseSchema.parse({ user: validUser })
    ).not.toThrow()
  })

  it("accepts a response with new_recovery_codes", () => {
    expect(() =>
      MfaVerifyResponseSchema.parse({
        user: validUser,
        new_recovery_codes: ["abc123def456789012"],
      })
    ).not.toThrow()
  })

  it("accepts new_recovery_codes as null", () => {
    expect(() =>
      MfaVerifyResponseSchema.parse({
        user: validUser,
        new_recovery_codes: null,
      })
    ).not.toThrow()
  })

  it("rejects missing user", () => {
    expect(() =>
      MfaVerifyResponseSchema.parse({ new_recovery_codes: null })
    ).toThrow()
  })
})

describe("ResetVerifyResponseSchema", () => {
  it("accepts a response without new_recovery_codes", () => {
    expect(() =>
      ResetVerifyResponseSchema.parse({ user: validUser })
    ).not.toThrow()
  })

  it("accepts a response with new_recovery_codes", () => {
    expect(() =>
      ResetVerifyResponseSchema.parse({
        user: validUser,
        new_recovery_codes: ["abc123def456789012"],
      })
    ).not.toThrow()
  })

  it("accepts new_recovery_codes as null", () => {
    expect(() =>
      ResetVerifyResponseSchema.parse({
        user: validUser,
        new_recovery_codes: null,
      })
    ).not.toThrow()
  })

  it("rejects missing user", () => {
    expect(() => ResetVerifyResponseSchema.parse({})).toThrow()
  })
})
