import { describe, it, expect } from "vitest"
import { READ_ONLY_VIEWER_ROLES } from "@/features/users/types"
import { getUserActionVisibility } from "@/features/users/utils"

describe("READ_ONLY_VIEWER_ROLES", () => {
  it("includes support_user", () => {
    expect(READ_ONLY_VIEWER_ROLES).toContain("support_user")
  })

  it("includes auditor", () => {
    expect(READ_ONLY_VIEWER_ROLES).toContain("auditor")
  })

  it("does not include system_admin", () => {
    expect(READ_ONLY_VIEWER_ROLES).not.toContain("system_admin")
  })
})

describe("getUserActionVisibility — read-only viewer roles", () => {
  it("returns canSuspend: false when viewerRole is support_user", () => {
    const result = getUserActionVisibility(
      "active",
      "front_office",
      "support_user"
    )
    expect(result.canSuspend).toBe(false)
  })

  it("returns canSuspend: true when viewerRole is system_admin and status is active", () => {
    const result = getUserActionVisibility(
      "active",
      "front_office",
      "system_admin"
    )
    expect(result.canSuspend).toBe(true)
  })

  it("returns hasAnyAction: false when viewerRole is auditor", () => {
    const result = getUserActionVisibility("active", "front_office", "auditor")
    expect(result.hasAnyAction).toBe(false)
  })
})
