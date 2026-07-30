import { describe, it, expect, vi } from "vitest"
import { ApiError } from "@/lib/api"
import {
  applyApiFieldErrors,
  VALIDATION_ERROR_CODE,
} from "@/lib/apiFieldErrors"

const MESSAGE = "The server rejected this value."

function validationError(
  errors: Array<{ field: string; message: string; input: unknown }>
): ApiError {
  return new ApiError(
    VALIDATION_ERROR_CODE,
    "Request validation failed",
    undefined,
    errors
  )
}

function setup(fields: readonly string[]) {
  const setError = vi.fn()
  const apply = (error: unknown) =>
    applyApiFieldErrors({ error, fields, setError, message: MESSAGE })
  return { setError, apply }
}

describe("applyApiFieldErrors", () => {
  it("attaches a wire field name that matches the form exactly", () => {
    const { setError, apply } = setup(["agreement_name", "valid_from"])

    const handled = apply(
      validationError([
        { field: "valid_from", message: "Field required", input: null },
      ])
    )

    expect(handled).toBe(true)
    expect(setError).toHaveBeenCalledWith("valid_from", {
      type: "server",
      message: MESSAGE,
    })
  })

  // Most forms here use the wire's snake_case, but a few (e.g. the workflow task catalogue
  // create dialog) use camelCase — both spellings must resolve.
  it("maps a snake_case wire name onto a camelCase form field", () => {
    const { setError, apply } = setup(["catalogName", "validFrom"])

    const handled = apply(
      validationError([
        { field: "valid_from", message: "Field required", input: null },
      ])
    )

    expect(handled).toBe(true)
    expect(setError).toHaveBeenCalledWith("validFrom", expect.anything())
  })

  it("attaches every field it can resolve", () => {
    const { setError, apply } = setup(["agreement_name", "effective_rate"])

    const handled = apply(
      validationError([
        { field: "agreement_name", message: "Field required", input: null },
        {
          field: "effective_rate",
          message: "Input should be <= 25",
          input: 99,
        },
      ])
    )

    expect(handled).toBe(true)
    expect(setError).toHaveBeenCalledTimes(2)
  })

  it("keeps the dotted tail of a nested wire path", () => {
    const { setError, apply } = setup(["address"])

    apply(
      validationError([
        { field: "address.city", message: "Field required", input: null },
      ])
    )

    expect(setError).toHaveBeenCalledWith("address.city", expect.anything())
  })

  // The message is the caller's already-translated string — the BE's English prose must
  // never reach the UI (code-review.md §6).
  it("never renders the server's own message", () => {
    const { setError, apply } = setup(["valid_from"])

    apply(
      validationError([
        { field: "valid_from", message: "Field required", input: null },
      ])
    )

    const [, attached] = setError.mock.calls[0]
    expect(attached.message).toBe(MESSAGE)
    expect(attached.message).not.toContain("Field required")
  })

  describe("falls through to the caller's toast", () => {
    it("when the field does not exist on the form", () => {
      const { setError, apply } = setup(["agreement_name"])

      const handled = apply(
        validationError([
          { field: "some_other_field", message: "Field required", input: null },
        ])
      )

      expect(handled).toBe(false)
      expect(setError).not.toHaveBeenCalled()
    })

    it("when only some fields resolve, it still reports handled", () => {
      const { setError, apply } = setup(["agreement_name"])

      const handled = apply(
        validationError([
          { field: "agreement_name", message: "Field required", input: null },
          { field: "unknown_field", message: "Field required", input: null },
        ])
      )

      expect(handled).toBe(true)
      expect(setError).toHaveBeenCalledTimes(1)
    })

    it("on any other ApiError code", () => {
      const { setError, apply } = setup(["catalog_name"])

      const handled = apply(
        new ApiError("WTC_CATALOG_NAME_CONFLICT", "Already exists")
      )

      expect(handled).toBe(false)
      expect(setError).not.toHaveBeenCalled()
    })

    it("on a validation error with an empty errors array", () => {
      const { setError, apply } = setup(["catalog_name"])

      expect(apply(validationError([]))).toBe(false)
      expect(setError).not.toHaveBeenCalled()
    })

    it("on a validation error with no errors property at all", () => {
      const { setError, apply } = setup(["catalog_name"])

      const handled = apply(
        new ApiError(VALIDATION_ERROR_CODE, "Request validation failed")
      )

      expect(handled).toBe(false)
      expect(setError).not.toHaveBeenCalled()
    })

    it("on a non-ApiError throw such as a network failure", () => {
      const { setError, apply } = setup(["catalog_name"])

      expect(apply(new Error("Network Error"))).toBe(false)
      expect(apply(undefined)).toBe(false)
      expect(setError).not.toHaveBeenCalled()
    })
  })
})

// The helper resolves its own default message so 26 call sites do not each need a
// useTranslation("common") added — same non-React i18n access as src/main.tsx.
describe("default message", () => {
  it("falls back to common:validation.rejectedByServer when none is passed", () => {
    const setError = vi.fn()

    applyApiFieldErrors({
      error: validationError([
        { field: "valid_from", message: "Field required", input: null },
      ]),
      fields: ["valid_from"],
      setError,
    })

    const [, attached] = setError.mock.calls[0]
    expect(attached.message).toBe("The server rejected this value.")
  })
})
