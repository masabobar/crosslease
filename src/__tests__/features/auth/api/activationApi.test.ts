import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  validateActivationToken,
  activateSetPassword,
} from "@/features/auth/api/activationApi"

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

describe("validateActivationToken", () => {
  it("calls api.get with the token as a query string parameter", async () => {
    mockApi.get.mockResolvedValue(undefined)
    await validateActivationToken("abc123")
    expect(mockApi.get).toHaveBeenCalledWith(
      `/auth/invite/validate-token?token=${encodeURIComponent("abc123")}`
    )
  })

  it("propagates errors from the API", async () => {
    mockApi.get.mockRejectedValue(new Error("invalid token"))
    await expect(validateActivationToken("bad-token")).rejects.toThrow(
      "invalid token"
    )
  })
})

describe("activateSetPassword", () => {
  it("calls api.post with token, password, and password_confirm and returns parsed response", async () => {
    mockApi.post.mockResolvedValue({ mfa_enrollment_required: false })
    const result = await activateSetPassword("tok", "Abcdef1!", "Abcdef1@")
    expect(mockApi.post).toHaveBeenCalledWith("/auth/invite/set-password", {
      token: "tok",
      password: "Abcdef1!",
      password_confirm: "Abcdef1@",
    })
    expect(result.mfa_enrollment_required).toBe(false)
  })

  it("returns mfa_enrollment_required=true with mfa_token when MFA setup is needed", async () => {
    mockApi.post.mockResolvedValue({
      mfa_enrollment_required: true,
      mfa_token: "mfa-tok",
    })
    const result = await activateSetPassword("tok", "Abcdef1!", "Abcdef1!")
    expect(result.mfa_enrollment_required).toBe(true)
    expect(result.mfa_token).toBe("mfa-tok")
  })

  it("propagates errors from the API", async () => {
    mockApi.post.mockRejectedValue(new Error("expired"))
    await expect(
      activateSetPassword("tok", "Abcdef1!", "Abcdef1!")
    ).rejects.toThrow("expired")
  })
})
