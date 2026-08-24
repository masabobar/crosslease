import { describe, it, expect, vi, beforeEach } from "vitest"
import type { TFunction } from "i18next"
import { ApiError } from "@/lib/api"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"

const toastErrorMock = vi.hoisted(() => vi.fn())
vi.mock("sonner", () => ({ toast: { error: toastErrorMock } }))

// Stands in for i18next's t(): returns the key when the resource tree has one, otherwise the
// caller-supplied defaultValue. That is the contract resolveApiErrorMessage relies on, and the
// reason `fallbackNS` works — i18next resolves across namespaces before applying defaultValue,
// so from this helper's point of view a common-only key is simply "known".
const KNOWN_KEYS = new Set(["errors.generic", "errors.PARTNER_NOT_FOUND"])
const t = ((key: string, options?: { defaultValue?: string }) =>
  KNOWN_KEYS.has(key)
    ? key
    : (options?.defaultValue ?? key)) as unknown as TFunction<"partners">

describe("resolveApiErrorMessage", () => {
  it("translates a known BE error code via its errors.<CODE> key", () => {
    const error = new ApiError("PARTNER_NOT_FOUND", "Partner not found")
    expect(resolveApiErrorMessage(error, t)).toBe("errors.PARTNER_NOT_FOUND")
  })

  it("prefers the translation over the backend message for a known code", () => {
    // The BE's English prose must never win against curated, translated copy.
    const error = new ApiError("PARTNER_NOT_FOUND", "raw backend prose")
    expect(resolveApiErrorMessage(error, t)).toBe("errors.PARTNER_NOT_FOUND")
  })

  it("shows the backend message for a code that has no i18n key yet", () => {
    // The point of the exception in .claude/rules/error-handling-and-logging.md §2: a code the
    // BE added before this repo keyed it still tells the user what went wrong.
    const error = new ApiError(
      "SOME_BRAND_NEW_CODE",
      "Partner is already merged"
    )
    expect(resolveApiErrorMessage(error, t)).toBe("Partner is already merged")
  })

  it("prefers a caller-supplied fallback over the backend message", () => {
    // A curated, translated, interpolated per-action message beats raw BE prose.
    const error = new ApiError("SOME_BRAND_NEW_CODE", "raw backend prose")
    expect(
      resolveApiErrorMessage(error, t, "Could not add dealer number 42")
    ).toBe("Could not add dealer number 42")
  })

  it("falls back to the generic message when the response carried no message", () => {
    // @/lib/api substitutes the literal "Something went wrong" when detail.message is absent;
    // passing that through would re-display the untranslated placeholder.
    const error = new ApiError("SOME_BRAND_NEW_CODE", "Something went wrong")
    expect(resolveApiErrorMessage(error, t)).toBe("errors.generic")
  })

  it("falls back to the generic message for a blank backend message", () => {
    expect(resolveApiErrorMessage(new ApiError("NEW_CODE", "   "), t)).toBe(
      "errors.generic"
    )
  })

  it("falls back to the generic message for a non-ApiError throw", () => {
    // A transport failure has no envelope, so there is no backend message to show.
    expect(resolveApiErrorMessage(new Error("network down"), t)).toBe(
      "errors.generic"
    )
  })

  it("uses the caller's fallback for a non-ApiError throw", () => {
    expect(
      resolveApiErrorMessage(new Error("network down"), t, "Export failed")
    ).toBe("Export failed")
  })

  it("falls back to the generic message for undefined (query with no error)", () => {
    expect(resolveApiErrorMessage(undefined, t)).toBe("errors.generic")
  })
})

describe("showApiError", () => {
  beforeEach(() => {
    toastErrorMock.mockClear()
  })

  it("toasts the resolved message for a known code", () => {
    showApiError(new ApiError("PARTNER_NOT_FOUND", "Partner not found"), t)
    expect(toastErrorMock).toHaveBeenCalledWith("errors.PARTNER_NOT_FOUND")
  })

  it("toasts the backend message for an unknown code", () => {
    showApiError(
      new ApiError("SOME_BRAND_NEW_CODE", "Merge already resolved"),
      t
    )
    expect(toastErrorMock).toHaveBeenCalledWith("Merge already resolved")
  })
})
