import axios from "axios"
import type { AxiosError, InternalAxiosRequestConfig } from "axios"
import { z } from "zod"
import { useAuthStore } from "@/store/authStore"
import { ApiErrorDetailSchema } from "@/types/api"

const ApiErrorEnvelopeSchema = z.object({
  detail: ApiErrorDetailSchema.optional(),
})

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

/**
 * A `responseType: "blob"` request (the export downloads) receives its *error* envelope as a
 * Blob too, so the JSON has to be read out of it before `detail.code` can be recovered —
 * otherwise every failed download reports the generic fallback instead of what went wrong.
 */
async function parseErrorDetail(error: AxiosError) {
  const raw = error.response?.data
  let data: unknown = raw
  if (raw instanceof Blob) {
    try {
      data = JSON.parse(await raw.text())
    } catch {
      data = undefined
    }
  }
  const envelope = ApiErrorEnvelopeSchema.safeParse(data)
  return envelope.success ? envelope.data.detail : undefined
}

api.interceptors.response.use(
  response =>
    response.data?.data !== undefined ? response.data.data : response.data,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !original._retry) {
      const { isAuthenticated, clearAuth } = useAuthStore.getState()

      // Only an already-authenticated session's 401 means "try a refresh". A 401 from
      // login itself (or any other unauthenticated call) is a real domain error — e.g.
      // INVALID_CREDENTIALS — and must fall through to the envelope parsing below rather
      // than being masked with a fabricated code.
      if (isAuthenticated) {
        original._retry = true

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
    }

    const detail = await parseErrorDetail(error)

    // `error.response` is absent when the request never reached the server — connectivity
    // loss, timeout, CORS rejection. Reporting that as BAD_REQUEST blames the payload for a
    // transport failure and sends the UI looking up a code the backend never issues.
    const fallbackCode = error.response ? "BAD_REQUEST" : "NETWORK_ERROR"

    throw new ApiError(
      detail?.code ?? fallbackCode,
      detail?.message ?? "Something went wrong",
      detail?.field,
      detail?.errors
    )
  }
)
