import { describe, it, expect, vi, beforeEach } from "vitest"
import { verifyEmailChange } from "@/features/auth/api/verifyEmailApi"
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

describe("verifyEmailChange", () => {
  it("calls POST /auth/verify-email-change with the encoded token", async () => {
    mockApi.post.mockResolvedValue(undefined)

    await verifyEmailChange("abc123")

    expect(mockApi.post).toHaveBeenCalledWith(
      "/auth/verify-email-change?token=abc123"
    )
  })

  it("encodes special characters in the token", async () => {
    mockApi.post.mockResolvedValue(undefined)

    await verifyEmailChange("tok en+val=ue")

    expect(mockApi.post).toHaveBeenCalledWith(
      "/auth/verify-email-change?token=tok%20en%2Bval%3Due"
    )
  })

  it("propagates ApiError from the API call", async () => {
    const error = new ApiError("INVALID_TOKEN", "Token is invalid or expired")
    mockApi.post.mockRejectedValue(error)

    await expect(verifyEmailChange("bad-token")).rejects.toMatchObject({
      code: "INVALID_TOKEN",
    })
  })

  it("propagates unknown errors from the API call", async () => {
    mockApi.post.mockRejectedValue(new Error("Network error"))

    await expect(verifyEmailChange("token")).rejects.toThrow("Network error")
  })
})
