import { describe, it, expect } from "vitest"
import { PATHS } from "@/router/paths"
import { LC_ONLY_ROLES } from "@/features/users/types"

/**
 * LC workspace routing constraint tests.
 *
 * Verifies that path constants are correctly defined and that the LC role
 * set is exclusive — ensuring routing guards make correct allow/deny decisions.
 */

describe("LC workspace paths", () => {
  it("LC_WORKSPACE path is /lc", () => {
    expect(PATHS.LC_WORKSPACE).toBe("/lc")
  })

  it("LC_REQUESTS path is /lc/requests", () => {
    expect(PATHS.LC_REQUESTS).toBe("/lc/requests")
  })

  it("LC_STATUS path is /lc/status", () => {
    expect(PATHS.LC_STATUS).toBe("/lc/status")
  })

  it("LC_DOCUMENTS path is /lc/documents", () => {
    expect(PATHS.LC_DOCUMENTS).toBe("/lc/documents")
  })

  it("LC_PROPOSALS path is /lc/proposals", () => {
    expect(PATHS.LC_PROPOSALS).toBe("/lc/proposals")
  })

  it("LC_FRAMEWORK_AGREEMENTS path is /lc/framework-agreements", () => {
    expect(PATHS.LC_FRAMEWORK_AGREEMENTS).toBe("/lc/framework-agreements")
  })

  it("all LC sub-paths start with the LC_WORKSPACE prefix", () => {
    const lcSubPaths = [
      PATHS.LC_REQUESTS,
      PATHS.LC_STATUS,
      PATHS.LC_DOCUMENTS,
      PATHS.LC_PROPOSALS,
      PATHS.LC_FRAMEWORK_AGREEMENTS,
    ]
    lcSubPaths.forEach(path => {
      expect(path.startsWith(PATHS.LC_WORKSPACE)).toBe(true)
    })
  })
})

describe("LC role exclusivity", () => {
  it("leasing_company_user is the only LC-only role", () => {
    expect(LC_ONLY_ROLES).toEqual(["leasing_company_user"])
  })

  it("LC paths are separate from internal bank paths", () => {
    const internalPaths = [PATHS.DASHBOARD, PATHS.USER_MANAGEMENT]
    internalPaths.forEach(path => {
      expect(path.startsWith(PATHS.LC_WORKSPACE)).toBe(false)
    })
  })

  it("DASHBOARD path is not an LC path", () => {
    expect(PATHS.DASHBOARD).not.toBe(PATHS.LC_WORKSPACE)
    expect(PATHS.DASHBOARD.startsWith(PATHS.LC_WORKSPACE)).toBe(false)
  })
})
