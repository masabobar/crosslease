import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "@/store/authStore"

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, refreshToken: null })
  })

  it("setTokens stores both tokens", () => {
    useAuthStore.getState().setTokens("acc-123", "ref-456")
    const { accessToken, refreshToken } = useAuthStore.getState()
    expect(accessToken).toBe("acc-123")
    expect(refreshToken).toBe("ref-456")
  })

  it("clearTokens resets both tokens to null", () => {
    useAuthStore.getState().setTokens("acc-123", "ref-456")
    useAuthStore.getState().clearTokens()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().refreshToken).toBeNull()
  })

  it("store does not expose persist hydration API — no persist middleware", () => {
    // When Zustand's persist middleware is active, the store exposes
    // `persist.hasHydrated()` and `persist.onHydrate()` methods.
    // A plain store without persist has no such API.
    const storeApi = useAuthStore as unknown as Record<string, unknown>
    expect(storeApi["persist"]).toBeUndefined()
  })
})
