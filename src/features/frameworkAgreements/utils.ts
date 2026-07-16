import { ApiError } from "@/lib/api"

export function isFrameworkAgreementNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "FA_NOT_FOUND"
}
