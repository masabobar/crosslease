import axios from "axios"
import type { AxiosError, InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/store/authStore"
import type { ApiErrorDetail } from "@/types/api"

export class ApiError extends Error {
  code: string
  field?: string
  errors?: Array<{ field: string; message: string; input: unknown }>

  constructor(
    code: string,
    message: string,
    field?: string,
    errors?: Array<{ field: string; message: string; input: unknown }>
  ) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.field = field
    this.errors = errors
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  // FastAPI expects repeated params for arrays: ?a=1&a=2 (not ?a[]=1&a[]=2)
  paramsSerializer: { indexes: null },
})

let refreshPromise: Promise<void> | null = null

api.interceptors.response.use(
  response =>
    response.data?.data !== undefined ? response.data.data : response.data,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const { isAuthenticated, clearAuth } = useAuthStore.getState()

      // Skip refresh when the user is already logged out (e.g. in-flight requests
      // that complete after an explicit logout should not trigger a refresh attempt).
      if (!isAuthenticated) {
        throw new ApiError("UNAUTHORIZED", "Not authenticated")
      }

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            await axios.post(
              `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
              {},
              { withCredentials: true }
            )
          } catch {
            clearAuth()
            throw new ApiError("INVALID_TOKEN", "Session expired")
          }
        })().finally(() => {
          refreshPromise = null
        })
      }

      await refreshPromise
      return api(original)
    }

    const detail = (error.response?.data as { detail?: ApiErrorDetail })?.detail

    throw new ApiError(
      detail?.code ?? "BAD_REQUEST",
      detail?.message ?? "Something went wrong",
      detail?.field,
      detail?.errors
    )
  }
)
