import { describe, it, expect } from "vitest"
import { LoginInputSchema, LoginResponseSchema } from "./schema"

describe("LoginInputSchema", () => {
  it("accepts valid credentials", () => {
    expect(() =>
      LoginInputSchema.parse({
        username: "user@example.com",
        password: "secret",
      })
    ).not.toThrow()
  })

  it("rejects empty username", () => {
    expect(() =>
      LoginInputSchema.parse({ username: "", password: "secret" })
    ).toThrow()
  })

  it("rejects empty password", () => {
    expect(() =>
      LoginInputSchema.parse({ username: "user@example.com", password: "" })
    ).toThrow()
  })

  it("rejects both empty", () => {
    expect(() =>
      LoginInputSchema.parse({ username: "", password: "" })
    ).toThrow()
  })
})

describe("LoginResponseSchema", () => {
  it("accepts a valid token pair", () => {
    expect(() =>
      LoginResponseSchema.parse({ access_token: "abc", refresh_token: "xyz" })
    ).not.toThrow()
  })

  it("rejects missing access_token", () => {
    expect(() => LoginResponseSchema.parse({ refresh_token: "xyz" })).toThrow()
  })

  it("rejects missing refresh_token", () => {
    expect(() => LoginResponseSchema.parse({ access_token: "abc" })).toThrow()
  })
})
