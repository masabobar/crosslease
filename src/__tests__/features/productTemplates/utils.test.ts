import { describe, it, expect } from "vitest"
import { ApiError } from "@/lib/api"
import { isProductTemplateNotFoundError } from "@/features/productTemplates/utils"

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

  it("returns true for BPT_MODULE_NOT_ACTIVE", () => {
    const error = new ApiError("BPT_MODULE_NOT_ACTIVE", "Module inactive")
    expect(isProductTemplateNotFoundError(error)).toBe(true)
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
