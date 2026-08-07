import { describe, it, expect } from "vitest"
import {
  MfaEnrollResponseSchema,
  MfaActivateResponseSchema,
  MfaVerifyResponseSchema,
  ResetVerifyResponseSchema,
  RECOVERY_CODE_LENGTH,
  TOTP_CODE_LENGTH,
  isAcceptedMfaCode,
  normalizeMfaCodeInput,
} from "@/features/auth/api/mfaSchema"

describe("isAcceptedMfaCode", () => {
  const totp = "1".repeat(TOTP_CODE_LENGTH)
  const recovery = "a1b2c3d4e5".repeat(RECOVERY_CODE_LENGTH / 10)

  it("accepts a 6-digit TOTP code", () => {
    expect(isAcceptedMfaCode(totp)).toBe(true)
  })

  it("accepts a 20-character lowercase hex recovery code", () => {
    expect(recovery).toHaveLength(RECOVERY_CODE_LENGTH)
    expect(isAcceptedMfaCode(recovery)).toBe(true)
  })

  it("rejects a code of the wrong length", () => {
    expect(isAcceptedMfaCode("12345")).toBe(false)
    expect(isAcceptedMfaCode("1234567")).toBe(false)
    expect(isAcceptedMfaCode("")).toBe(false)
  })

  it("rejects a non-numeric TOTP code", () => {
    expect(isAcceptedMfaCode("12345a")).toBe(false)
  })

  it("rejects a recovery code with non-hex characters", () => {
    expect(isAcceptedMfaCode("z".repeat(RECOVERY_CODE_LENGTH))).toBe(false)
  })

  it("rejects an uppercase recovery code — the wire format is lowercase hex", () => {
    expect(isAcceptedMfaCode(recovery.toUpperCase())).toBe(false)
  })
})

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

describe("normalizeMfaCodeInput", () => {
  const recovery = "a1b2c3d4e5".repeat(RECOVERY_CODE_LENGTH / 10)

  it("trims surrounding whitespace", () => {
    expect(normalizeMfaCodeInput("  123456  ")).toBe("123456")
  })

  // A mobile keyboard auto-capitalizes and some mail clients upper-case on copy; without
  // folding the case the submit button stayed disabled with nothing explaining why.
  it("lowercases so an auto-capitalized recovery code still validates", () => {
    const shouted = recovery.toUpperCase()
    expect(isAcceptedMfaCode(shouted)).toBe(false)
    expect(isAcceptedMfaCode(normalizeMfaCodeInput(shouted))).toBe(true)
  })

  it("leaves a digit-only TOTP code untouched", () => {
    expect(normalizeMfaCodeInput("123456")).toBe("123456")
  })
})
