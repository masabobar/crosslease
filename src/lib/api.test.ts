import { vi, describe, it, expect, beforeEach } from "vitest"

// Capture interceptor handlers before the module is imported
const capturedHandlers = vi.hoisted(() => ({
  responseError: null as ((err: unknown) => Promise<unknown>) | null,
}))

vi.mock("axios", () => {
  const mockAxiosPost = vi.fn()
  const mockInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: {
        use: vi.fn(
          (_success: unknown, errorFn: (err: unknown) => Promise<unknown>) => {
            capturedHandlers.responseError = errorFn
          }
        ),
      },
    },
    post: vi.fn(),
    get: vi.fn(),
  }
  return {
    default: {
      create: vi.fn(() => mockInstance),
      post: mockAxiosPost,
    },
    AxiosError: class AxiosError extends Error {},
  }
})

// Import AFTER mock is set up (vi.mock is hoisted so ordering is safe)
import { ApiError } from "./api"
import { useAuthStore } from "@/store/authStore"
import axios from "axios"

describe("ApiError", () => {
  it("is an instance of Error", () => {
    const err = new ApiError("SOME_CODE", "Some message")
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe("SOME_CODE")
    expect(err.message).toBe("Some message")
  })

  it("has a name of ApiError", () => {
    const err = new ApiError("CODE", "msg")
    expect(err.name).toBe("ApiError")
  })

  it("carries optional field and errors", () => {
    const err = new ApiError("CODE", "msg", "email", [
      { field: "email", message: "bad", input: "" },
    ])
    expect(err.field).toBe("email")
    expect(err.errors).toHaveLength(1)
    expect(err.errors![0].field).toBe("email")
  })

  it("field and errors are undefined when not provided", () => {
    const err = new ApiError("CODE", "msg")
    expect(err.field).toBeUndefined()
    expect(err.errors).toBeUndefined()
  })
})

describe("api response interceptor", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: "access-tok",
      refreshToken: "refresh-tok",
    })
    vi.mocked(axios.post).mockReset()
  })

  it("interceptor handler was registered", () => {
    expect(capturedHandlers.responseError).not.toBeNull()
  })

  it("clears tokens when refresh fails on 401", async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error("Refresh failed"))

    const error = {
      response: { status: 401, data: {} },
      config: { _retry: false, headers: {} },
    }

    if (!capturedHandlers.responseError)
      throw new Error("Interceptor not registered")

    await expect(capturedHandlers.responseError(error)).rejects.toBeInstanceOf(
      ApiError
    )

    const { accessToken, refreshToken } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(refreshToken).toBeNull()
  })

  it("does not attempt refresh when _retry is already true", async () => {
    const error = {
      response: { status: 401, data: {} },
      config: { _retry: true, headers: {} },
    }

    if (!capturedHandlers.responseError)
      throw new Error("Interceptor not registered")

    await expect(capturedHandlers.responseError(error)).rejects.toBeInstanceOf(
      ApiError
    )
    // axios.post (refresh call) should NOT have been called since _retry=true
    expect(vi.mocked(axios.post)).not.toHaveBeenCalled()
  })

  it("clears tokens when there is no refresh token on 401", async () => {
    useAuthStore.setState({ accessToken: "access-tok", refreshToken: null })

    const error = {
      response: { status: 401, data: {} },
      config: { _retry: false, headers: {} },
    }

    if (!capturedHandlers.responseError)
      throw new Error("Interceptor not registered")

    await expect(capturedHandlers.responseError(error)).rejects.toBeInstanceOf(
      ApiError
    )

    const { accessToken, refreshToken } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(refreshToken).toBeNull()
    expect(vi.mocked(axios.post)).not.toHaveBeenCalled()
  })

  it("throws ApiError with BAD_REQUEST code for non-401 errors", async () => {
    const error = {
      response: {
        status: 400,
        data: {
          detail: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            field: "email",
            errors: [],
          },
        },
      },
      config: { _retry: false, headers: {} },
    }

    if (!capturedHandlers.responseError)
      throw new Error("Interceptor not registered")

    await expect(capturedHandlers.responseError(error)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      field: "email",
    })
  })

  it("throws ApiError with BAD_REQUEST for responses without detail", async () => {
    const error = {
      response: {
        status: 500,
        data: {},
      },
      config: { _retry: false, headers: {} },
    }

    if (!capturedHandlers.responseError)
      throw new Error("Interceptor not registered")

    await expect(capturedHandlers.responseError(error)).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Something went wrong",
    })
  })
})
