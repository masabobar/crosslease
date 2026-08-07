import { describe, it, expect, vi, beforeEach } from "vitest"
import type { TFunction } from "i18next"
import { ApiError } from "@/lib/api"
import {
  compareVersionNumbers,
  isProductTemplateNotFoundError,
  isModuleNotActiveError,
  latestVersionNumber,
  resolveApiErrorMessage,
  resolveFieldErrorMessage,
  showApiError,
} from "@/features/productTemplates/utils"

const toastErrorMock = vi.hoisted(() => vi.fn())
vi.mock("sonner", () => ({ toast: { error: toastErrorMock } }))

// Stands in for i18next's t(): returns the key when the namespace has one, otherwise the
// caller-supplied defaultValue — the same contract resolveApiErrorMessage relies on.
const KNOWN_KEYS = new Set([
  "errors.generic",
  "errors.PRODUCT_TEMPLATE_NOT_FOUND",
])
const t = ((key: string, options?: { defaultValue?: string }) =>
  KNOWN_KEYS.has(key)
    ? key
    : (options?.defaultValue ??
      key)) as unknown as TFunction<"productTemplates">

describe("resolveApiErrorMessage", () => {
  it("translates a known BE error code via its errors.<CODE> key", () => {
    const error = new ApiError("PRODUCT_TEMPLATE_NOT_FOUND", "Not found")
    expect(resolveApiErrorMessage(error, t)).toBe(
      "errors.PRODUCT_TEMPLATE_NOT_FOUND"
    )
  })

  it("falls back to the generic message for a code with no i18n key", () => {
    const error = new ApiError("SOME_BRAND_NEW_CODE", "Unmapped")
    expect(resolveApiErrorMessage(error, t)).toBe("errors.generic")
  })

  it("falls back to the generic message for a non-ApiError throw", () => {
    expect(resolveApiErrorMessage(new Error("network down"), t)).toBe(
      "errors.generic"
    )
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
    showApiError(new ApiError("PRODUCT_TEMPLATE_NOT_FOUND", "Not found"), t)
    expect(toastErrorMock).toHaveBeenCalledWith(
      "errors.PRODUCT_TEMPLATE_NOT_FOUND"
    )
  })

  it("toasts the generic message for an unknown code", () => {
    showApiError(new ApiError("SOME_BRAND_NEW_CODE", "Unmapped"), t)
    expect(toastErrorMock).toHaveBeenCalledWith("errors.generic")
  })
})

describe("isProductTemplateNotFoundError", () => {
  it("returns true for PRODUCT_TEMPLATE_NOT_FOUND", () => {
    const error = new ApiError("PRODUCT_TEMPLATE_NOT_FOUND", "Not found")
    expect(isProductTemplateNotFoundError(error)).toBe(true)
  })

  it("returns true for PRODUCT_TEMPLATE_VERSION_NOT_FOUND", () => {
    const error = new ApiError(
      "PRODUCT_TEMPLATE_VERSION_NOT_FOUND",
      "Not found"
    )
    expect(isProductTemplateNotFoundError(error)).toBe(true)
  })

  it("returns false for BPT_MODULE_NOT_ACTIVE", () => {
    const error = new ApiError("BPT_MODULE_NOT_ACTIVE", "Module inactive")
    expect(isProductTemplateNotFoundError(error)).toBe(false)
  })

  it("returns false for an unrelated ApiError code", () => {
    const error = new ApiError("VALIDATION_ERROR", "Invalid")
    expect(isProductTemplateNotFoundError(error)).toBe(false)
  })

  it("returns false for a non-ApiError value", () => {
    expect(isProductTemplateNotFoundError(new Error("network down"))).toBe(
      false
    )
  })

  it("returns false for null or undefined", () => {
    expect(isProductTemplateNotFoundError(null)).toBe(false)
    expect(isProductTemplateNotFoundError(undefined)).toBe(false)
  })
})

describe("isModuleNotActiveError", () => {
  it("returns true for MODULE_NOT_ACTIVE", () => {
    const error = new ApiError("MODULE_NOT_ACTIVE", "Module inactive")
    expect(isModuleNotActiveError(error)).toBe(true)
  })

  it("returns true for BPT_MODULE_NOT_ACTIVE", () => {
    const error = new ApiError("BPT_MODULE_NOT_ACTIVE", "Module inactive")
    expect(isModuleNotActiveError(error)).toBe(true)
  })

  it("returns false for an unrelated ApiError code", () => {
    const error = new ApiError("VALIDATION_ERROR", "Invalid")
    expect(isModuleNotActiveError(error)).toBe(false)
  })

  it("returns false for a non-ApiError value", () => {
    expect(isModuleNotActiveError(new Error("network down"))).toBe(false)
  })
})

describe("resolveFieldErrorMessage", () => {
  it("returns undefined when msg is undefined", () => {
    expect(resolveFieldErrorMessage(undefined, "Required")).toBeUndefined()
  })

  it("returns the shared required message for the 'required' code", () => {
    expect(resolveFieldErrorMessage("required", "Required")).toBe("Required")
  })

  it("returns the mapped string when the code is found in the map", () => {
    expect(
      resolveFieldErrorMessage("codeInvalidChars", "Required", {
        codeInvalidChars: "Only letters and numbers are allowed",
      })
    ).toBe("Only letters and numbers are allowed")
  })

  it("returns the raw code as-is when not found in the map", () => {
    expect(
      resolveFieldErrorMessage("someUnmappedCode", "Required", {
        codeInvalidChars: "Only letters and numbers are allowed",
      })
    ).toBe("someUnmappedCode")
  })

  it("returns the raw code as-is when no map is supplied", () => {
    expect(resolveFieldErrorMessage("someUnmappedCode", "Required")).toBe(
      "someUnmappedCode"
    )
  })
})

describe("compareVersionNumbers", () => {
  it("orders by major segment", () => {
    expect(compareVersionNumbers("2", "1.9")).toBeGreaterThan(0)
    expect(compareVersionNumbers("0.1", "1.0")).toBeLessThan(0)
  })

  it("orders by minor segment when majors match", () => {
    expect(compareVersionNumbers("1.2", "1.1")).toBeGreaterThan(0)
  })

  // A decimal parse would rank 1.10 below 1.9 — the reason this compares segment-wise.
  it("treats a two-digit minor as higher than a one-digit one", () => {
    expect(compareVersionNumbers("1.10", "1.9")).toBeGreaterThan(0)
  })

  it("treats a missing segment as zero", () => {
    expect(compareVersionNumbers("2", "2.0")).toBe(0)
  })
})

describe("latestVersionNumber", () => {
  it("returns null for an empty list", () => {
    expect(latestVersionNumber([])).toBeNull()
  })

  // The list's arrival order is not part of the API contract, which is the whole point.
  it("finds the highest version regardless of list order", () => {
    expect(
      latestVersionNumber([
        { version_number: "1.0" },
        { version_number: "2.1" },
        { version_number: "0.9" },
      ])
    ).toBe("2.1")
  })

  it("returns the only version when there is one", () => {
    expect(latestVersionNumber([{ version_number: "0.1" }])).toBe("0.1")
  })
})
