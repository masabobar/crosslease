import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "@/store/authStore"

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false })
  })

  it("setAuthenticated(true) marks the session as authenticated", () => {
    useAuthStore.getState().setAuthenticated(true)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it("setAuthenticated(false) marks the session as unauthenticated", () => {
    useAuthStore.getState().setAuthenticated(true)
    useAuthStore.getState().setAuthenticated(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("clearAuth resets isAuthenticated to false", () => {
    useAuthStore.getState().setAuthenticated(true)
    useAuthStore.getState().clearAuth()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("initial state is unauthenticated", () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
