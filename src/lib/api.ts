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
})

api.interceptors.request.use(config => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

api.interceptors.response.use(
  response =>
    response.data?.data !== undefined ? response.data.data : response.data,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (!refreshPromise) {
        refreshPromise = (async () => {
          const { refreshToken, setTokens, clearTokens } =
            useAuthStore.getState()

          if (!refreshToken) {
            clearTokens()
            throw new ApiError("UNAUTHORIZED", "Session expired")
          }

          try {
            // TODO: update path when BE implements the refresh endpoint
            const { data } = await axios.post(
              `${import.meta.env.VITE_API_URL}/auth/token/refresh`,
              { refresh_token: refreshToken }
            )
            setTokens(data.data.access_token, data.data.refresh_token)
            return data.data.access_token as string
          } catch {
            clearTokens()
            throw new ApiError("INVALID_TOKEN", "Session expired")
          }
        })().finally(() => {
          refreshPromise = null
        })
      }

      const newToken = await refreshPromise
      original.headers.Authorization = `Bearer ${newToken}`
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
