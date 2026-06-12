import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
} from "@/features/auth/api/forgotPasswordApi"

vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import { api } from "@/lib/api"

const mockApi = api as unknown as {
  post: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("requestPasswordReset", () => {
  it("calls POST /auth/password/forgot with the email", async () => {
    mockApi.post.mockResolvedValue(undefined)
    await requestPasswordReset("user@example.com")
    expect(mockApi.post).toHaveBeenCalledWith("/auth/password/forgot", {
      email: "user@example.com",
    })
  })

  it("propagates errors from the API", async () => {
    mockApi.post.mockRejectedValue(new Error("network error"))
    await expect(requestPasswordReset("user@example.com")).rejects.toThrow(
      "network error"
    )
  })
})

describe("validateResetToken", () => {
  it("calls GET /auth/password/validate-token with the token as a query param", async () => {
    mockApi.get.mockResolvedValue(undefined)
    await validateResetToken("abc123")
    expect(mockApi.get).toHaveBeenCalledWith("/auth/password/validate-token", {
      params: { token: "abc123" },
    })
  })

  it("propagates errors from the API", async () => {
    mockApi.get.mockRejectedValue(new Error("invalid token"))
    await expect(validateResetToken("bad-token")).rejects.toThrow(
      "invalid token"
    )
  })
})

describe("resetPassword", () => {
  it("calls POST /auth/password/reset and returns parsed response", async () => {
    mockApi.post.mockResolvedValue({ mfa_required: false })
    const result = await resetPassword("tok", "Abcdef1!", "Abcdef1!")
    expect(mockApi.post).toHaveBeenCalledWith("/auth/password/reset", {
      token: "tok",
      password: "Abcdef1!",
      password_confirm: "Abcdef1!",
    })
    expect(result.mfa_required).toBe(false)
  })

  it("returns mfa_required=true with mfa_token when MFA verification is needed", async () => {
    mockApi.post.mockResolvedValue({ mfa_required: true, mfa_token: "mfa-tok" })
    const result = await resetPassword("tok", "Abcdef1!", "Abcdef1!")
    expect(result.mfa_required).toBe(true)
    expect(result.mfa_token).toBe("mfa-tok")
  })

  it("propagates errors from the API", async () => {
    mockApi.post.mockRejectedValue(new Error("expired"))
    await expect(resetPassword("tok", "Abcdef1!", "Abcdef1!")).rejects.toThrow(
      "expired"
    )
  })
})
