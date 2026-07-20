import { describe, it, expect } from "vitest"
import { ApiError } from "@/lib/api"
import {
  isProductTemplateNotFoundError,
  isModuleNotActiveError,
  resolveFieldErrorMessage,
} from "@/features/productTemplates/utils"

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
