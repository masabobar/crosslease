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
  it("calls POST /users/forgot-password with the email", async () => {
    mockApi.post.mockResolvedValue(undefined)
    await requestPasswordReset("user@example.com")
    expect(mockApi.post).toHaveBeenCalledWith("/users/forgot-password", {
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
  it("calls GET /users/validate-reset-token with the token as a query param", async () => {
    mockApi.get.mockResolvedValue(undefined)
    await validateResetToken("abc123")
    expect(mockApi.get).toHaveBeenCalledWith("/users/validate-reset-token", {
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
  it("calls POST /users/reset-password with token, password, and password_confirm", async () => {
    mockApi.post.mockResolvedValue(undefined)
    await resetPassword("tok", "Abcdef1!", "Abcdef1!")
    expect(mockApi.post).toHaveBeenCalledWith("/users/reset-password", {
      token: "tok",
      password: "Abcdef1!",
      password_confirm: "Abcdef1!",
    })
  })

  it("propagates errors from the API", async () => {
    mockApi.post.mockRejectedValue(new Error("expired"))
    await expect(resetPassword("tok", "Abcdef1!", "Abcdef1!")).rejects.toThrow(
      "expired"
    )
  })
})
