import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  mfaEnroll,
  mfaActivate,
  mfaVerify,
  resetPasswordVerify,
} from "@/features/auth/api/mfaApi"
import { ApiError } from "@/lib/api"

vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.name = "ApiError"
      this.code = code
    }
  },
}))

import { api } from "@/lib/api"

const mockApi = api as unknown as { post: ReturnType<typeof vi.fn> }

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

beforeEach(() => {
  vi.clearAllMocks()
})

describe("mfaEnroll", () => {
  it("calls POST /auth/mfa/enroll and returns parsed response", async () => {
    mockApi.post.mockResolvedValue({
      qr_code: "base64qr",
      secret: "JBSWY3DPEHPK3PXP",
      mfa_token: "enroll-tok",
    })
    const result = await mfaEnroll("setup-tok")
    expect(mockApi.post).toHaveBeenCalledWith("/auth/mfa/enroll", {
      mfa_token: "setup-tok",
    })
    expect(result.qr_code).toBe("base64qr")
    expect(result.secret).toBe("JBSWY3DPEHPK3PXP")
    expect(result.mfa_token).toBe("enroll-tok")
  })

  it("propagates MFA_TOKEN_INVALID error", async () => {
    mockApi.post.mockRejectedValue(
      new ApiError("MFA_TOKEN_INVALID", "Invalid token")
    )
    await expect(mfaEnroll("bad-tok")).rejects.toMatchObject({
      code: "MFA_TOKEN_INVALID",
    })
  })

  it("throws when response shape is invalid", async () => {
    mockApi.post.mockResolvedValue({ unexpected: "shape" })
    await expect(mfaEnroll("tok")).rejects.toThrow()
  })
})

describe("mfaActivate", () => {
  it("calls POST /auth/mfa/activate and returns parsed response", async () => {
    mockApi.post.mockResolvedValue({
      recovery_codes: ["abc123def456789012", "def456abc123789012"],
      user: validUser,
    })
    const result = await mfaActivate("enroll-tok", "123456")
    expect(mockApi.post).toHaveBeenCalledWith("/auth/mfa/activate", {
      mfa_token: "enroll-tok",
      code: "123456",
    })
    expect(result.recovery_codes).toHaveLength(2)
    expect(result.user.email).toBe("test@example.com")
  })

  it("propagates MFA_CODE_INVALID error", async () => {
    mockApi.post.mockRejectedValue(
      new ApiError("MFA_CODE_INVALID", "Invalid code")
    )
    await expect(mfaActivate("tok", "000000")).rejects.toMatchObject({
      code: "MFA_CODE_INVALID",
    })
  })
})

describe("mfaVerify", () => {
  it("calls POST /auth/mfa/verify and returns user without new recovery codes", async () => {
    mockApi.post.mockResolvedValue({
      user: validUser,
      new_recovery_codes: null,
    })
    const result = await mfaVerify("verify-tok", "123456")
    expect(mockApi.post).toHaveBeenCalledWith("/auth/mfa/verify", {
      mfa_token: "verify-tok",
      code: "123456",
    })
    expect(result.user.email).toBe("test@example.com")
    expect(result.new_recovery_codes).toBeNull()
  })

  it("returns new_recovery_codes when a recovery code was used", async () => {
    const newCodes = ["aaa111bbb222ccc333d4", "bbb222ccc333ddd444e5"]
    mockApi.post.mockResolvedValue({
      user: validUser,
      new_recovery_codes: newCodes,
    })
    const result = await mfaVerify("verify-tok", "aaa111bbb222ccc333d4")
    expect(result.new_recovery_codes).toEqual(newCodes)
  })

  it("propagates MFA_RECOVERY_RATE_LIMITED error", async () => {
    mockApi.post.mockRejectedValue(
      new ApiError("MFA_RECOVERY_RATE_LIMITED", "Rate limited")
    )
    await expect(
      mfaVerify("tok", "aaa111bbb222ccc333d4")
    ).rejects.toMatchObject({
      code: "MFA_RECOVERY_RATE_LIMITED",
    })
  })
})

describe("resetPasswordVerify", () => {
  it("calls POST /auth/password/reset/verify and returns user", async () => {
    mockApi.post.mockResolvedValue({
      user: validUser,
      new_recovery_codes: null,
    })
    const result = await resetPasswordVerify("reset-mfa-tok", "123456")
    expect(mockApi.post).toHaveBeenCalledWith("/auth/password/reset/verify", {
      mfa_token: "reset-mfa-tok",
      code: "123456",
    })
    expect(result.user.email).toBe("test@example.com")
  })

  it("returns new_recovery_codes when a recovery code was used", async () => {
    const newCodes = ["aaa111bbb222ccc333d4"]
    mockApi.post.mockResolvedValue({
      user: validUser,
      new_recovery_codes: newCodes,
    })
    const result = await resetPasswordVerify("tok", "aaa111bbb222ccc333d4")
    expect(result.new_recovery_codes).toEqual(newCodes)
  })

  it("propagates MFA_TOKEN_INVALID error", async () => {
    mockApi.post.mockRejectedValue(new ApiError("MFA_TOKEN_INVALID", "Expired"))
    await expect(
      resetPasswordVerify("expired-tok", "123456")
    ).rejects.toMatchObject({
      code: "MFA_TOKEN_INVALID",
    })
  })

  it("throws when response shape is invalid", async () => {
    mockApi.post.mockResolvedValue({ unexpected: "shape" })
    await expect(resetPasswordVerify("tok", "123456")).rejects.toThrow()
  })
})
