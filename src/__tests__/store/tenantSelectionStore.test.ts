import { describe, it, expect, beforeEach } from "vitest"
import { useTenantSelectionStore } from "@/store/tenantSelectionStore"

describe("useTenantSelectionStore", () => {
  beforeEach(() => {
    useTenantSelectionStore.setState({ selectedTenantId: null })
  })

  it("initial state has no selected tenant", () => {
    expect(useTenantSelectionStore.getState().selectedTenantId).toBeNull()
  })

  it("setSelectedTenantId stores the tenant id", () => {
    useTenantSelectionStore.getState().setSelectedTenantId("tenant-1")
    expect(useTenantSelectionStore.getState().selectedTenantId).toBe("tenant-1")
  })

  it("setSelectedTenantId(null) clears the selection", () => {
    useTenantSelectionStore.getState().setSelectedTenantId("tenant-1")
    useTenantSelectionStore.getState().setSelectedTenantId(null)
    expect(useTenantSelectionStore.getState().selectedTenantId).toBeNull()
  })
})
