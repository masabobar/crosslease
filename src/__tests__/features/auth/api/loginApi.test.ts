import { describe, it, expect, vi, beforeEach } from "vitest"
import { login, verifyOtp, resendOtp } from "@/features/auth/api/loginApi"
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe("login", () => {
  it("calls POST /auth/login and returns a parsed MFA response", async () => {
    mockApi.post.mockResolvedValue({
      status: "MFA_REQUIRED",
      verification_token: "tok",
      expires_in: 300,
    })
    const result = await login({ email: "user@example.com", password: "pass" })
    expect(mockApi.post).toHaveBeenCalledWith("/auth/login", {
      email: "user@example.com",
      password: "pass",
    })
    expect(result.verification_token).toBe("tok")
  })

  it("propagates ACCOUNT_LOCKED error code from the API", async () => {
    const lockoutError = new ApiError("ACCOUNT_LOCKED", "Account locked")
    mockApi.post.mockRejectedValue(lockoutError)
    await expect(
      login({ email: "user@example.com", password: "pass" })
    ).rejects.toMatchObject({ code: "ACCOUNT_LOCKED" })
  })

  it("propagates ACCOUNT_DISABLED error code from the API", async () => {
    const disabledError = new ApiError("ACCOUNT_DISABLED", "Account disabled")
    mockApi.post.mockRejectedValue(disabledError)
    await expect(
      login({ email: "user@example.com", password: "pass" })
    ).rejects.toMatchObject({ code: "ACCOUNT_DISABLED" })
  })

  it("propagates INVALID_CREDENTIALS error code from the API", async () => {
    const credError = new ApiError("INVALID_CREDENTIALS", "Bad credentials")
    mockApi.post.mockRejectedValue(credError)
    await expect(
      login({ email: "user@example.com", password: "wrong" })
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" })
  })

  it("throws when the API response does not match MfaRequiredResponseSchema", async () => {
    mockApi.post.mockResolvedValue({ status: "UNEXPECTED", foo: "bar" })
    await expect(
      login({ email: "user@example.com", password: "pass" })
    ).rejects.toThrow()
  })
})

describe("verifyOtp", () => {
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

  it("calls POST /auth/verify-otp and returns the user object", async () => {
    mockApi.post.mockResolvedValue({ user: validUser })
    const result = await verifyOtp({
      verification_token: "tok",
      code: "123456",
    })
    expect(mockApi.post).toHaveBeenCalledWith("/auth/verify-otp", {
      verification_token: "tok",
      code: "123456",
    })
    expect(result.user.email).toBe("test@example.com")
  })

  it("propagates INVALID_OTP error code from the API", async () => {
    const otpError = new ApiError("INVALID_OTP", "Invalid OTP")
    mockApi.post.mockRejectedValue(otpError)
    await expect(
      verifyOtp({ verification_token: "tok", code: "000000" })
    ).rejects.toMatchObject({ code: "INVALID_OTP" })
  })
})

describe("resendOtp", () => {
  it("calls POST /auth/resend-otp with the verification token", async () => {
    mockApi.post.mockResolvedValue(undefined)
    await resendOtp({ verification_token: "tok" })
    expect(mockApi.post).toHaveBeenCalledWith("/auth/resend-otp", {
      verification_token: "tok",
    })
  })

  it("propagates OTP_RESEND_THROTTLED error code from the API", async () => {
    const throttleError = new ApiError(
      "OTP_RESEND_THROTTLED",
      "Too many resend requests"
    )
    mockApi.post.mockRejectedValue(throttleError)
    await expect(
      resendOtp({ verification_token: "tok" })
    ).rejects.toMatchObject({ code: "OTP_RESEND_THROTTLED" })
  })
})
