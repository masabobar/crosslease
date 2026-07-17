import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  withdrawGovernedAction,
  reInitiateGovernedAction,
  fetchGovernedActions,
  approveGovernedAction,
  rejectGovernedAction,
} from "@/features/governed-actions/api/governedActionsApi"

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.name = "ApiError"
      this.code = code
    }
  },
}))

import { api } from "@/lib/api"

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
}

const VALID_ACTION = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  action_type: "user_role_change",
  subject_type: "user",
  subject_id: "550e8400-e29b-41d4-a716-446655440001",
  tenant_id: null,
  status: "pending",
  initiator_id: "550e8400-e29b-41d4-a716-446655440002",
  approver_id: null,
  display_snapshot: {},
  initiator_snapshot: {
    user_id: "USR-00001",
    first_name: "Jane",
    last_name: "Doe",
    role: "system_admin",
    tenant_id: null,
  },
  approver_snapshot: null,
  execution_params: {},
  reason: null,
  approver_comment: null,
  expires_at: null,
  resolved_at: null,
  correlation_id: null,
  created_at: "2026-06-01T10:00:00.000Z",
  updated_at: "2026-06-01T10:00:00.000Z",
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.post.mockResolvedValue(VALID_ACTION)
  mockApi.get.mockResolvedValue(VALID_ACTION)
})

describe("withdrawGovernedAction", () => {
  it("calls POST /governed-actions/:id/withdraw with empty body", async () => {
    await withdrawGovernedAction("action-123")
    expect(mockApi.post).toHaveBeenCalledWith(
      "/governed-actions/action-123/withdraw",
      {}
    )
  })

  it("returns the parsed GovernedAction", async () => {
    const result = await withdrawGovernedAction("action-123")
    expect(result.id).toBe(VALID_ACTION.id)
    expect(result.status).toBe("pending")
  })

  it("throws when API response does not match GovernedActionSchema", async () => {
    mockApi.post.mockResolvedValue({ unexpected: true })
    await expect(withdrawGovernedAction("action-123")).rejects.toThrow()
  })

  it("propagates API errors", async () => {
    const error = {
      name: "ApiError",
      code: "ACTION_NOT_PENDING",
      message: "Not pending",
    }
    mockApi.post.mockRejectedValue(error)
    await expect(withdrawGovernedAction("action-123")).rejects.toMatchObject({
      code: "ACTION_NOT_PENDING",
    })
  })
})

describe("reInitiateGovernedAction", () => {
  it("calls POST /governed-actions/:id/re-initiate with null reason when no reason provided", async () => {
    await reInitiateGovernedAction("action-123")
    expect(mockApi.post).toHaveBeenCalledWith(
      "/governed-actions/action-123/re-initiate",
      { reason: null }
    )
  })

  it("calls POST /governed-actions/:id/re-initiate with provided reason", async () => {
    await reInitiateGovernedAction(
      "action-123",
      "Policy update requires re-submission"
    )
    expect(mockApi.post).toHaveBeenCalledWith(
      "/governed-actions/action-123/re-initiate",
      { reason: "Policy update requires re-submission" }
    )
  })

  it("returns the parsed GovernedAction", async () => {
    const result = await reInitiateGovernedAction("action-123")
    expect(result.id).toBe(VALID_ACTION.id)
    expect(result.action_type).toBe("user_role_change")
  })

  it("throws when API response does not match GovernedActionSchema", async () => {
    mockApi.post.mockResolvedValue({ unexpected: true })
    await expect(reInitiateGovernedAction("action-123")).rejects.toThrow()
  })

  it("propagates API errors", async () => {
    const error = {
      name: "ApiError",
      code: "GOVERNED_ACTION_FORBIDDEN",
      message: "Forbidden",
    }
    mockApi.post.mockRejectedValue(error)
    await expect(reInitiateGovernedAction("action-123")).rejects.toMatchObject({
      code: "GOVERNED_ACTION_FORBIDDEN",
    })
  })
})

describe("fetchGovernedActions", () => {
  it("calls GET /governed-actions with no params when called with empty object", async () => {
    mockApi.get.mockResolvedValue({
      actions: [VALID_ACTION],
      total: 1,
      page: 1,
      per_page: 20,
      total_pages: 1,
    })
    await fetchGovernedActions()
    expect(mockApi.get).toHaveBeenCalledWith("/governed-actions")
  })

  it("calls GET /governed-actions with status query param when provided", async () => {
    mockApi.get.mockResolvedValue({
      actions: [],
      total: 0,
      page: 1,
      per_page: 20,
      total_pages: 0,
    })
    await fetchGovernedActions({ status: ["pending"] })
    expect(mockApi.get).toHaveBeenCalledWith("/governed-actions?status=pending")
  })

  it("returns parsed PaginatedGovernedActions", async () => {
    mockApi.get.mockResolvedValue({
      actions: [VALID_ACTION],
      total: 1,
      page: 1,
      per_page: 20,
      total_pages: 1,
    })
    const result = await fetchGovernedActions()
    expect(result.actions).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it("throws when response does not match PaginatedGovernedActionsSchema", async () => {
    mockApi.get.mockResolvedValue({ unexpected: true })
    await expect(fetchGovernedActions()).rejects.toThrow()
  })
})

describe("approveGovernedAction", () => {
  it("calls POST /governed-actions/:id/approve with null comment and extra_params by default", async () => {
    mockApi.post.mockResolvedValue(VALID_ACTION)
    await approveGovernedAction("action-123")
    expect(mockApi.post).toHaveBeenCalledWith(
      "/governed-actions/action-123/approve",
      { comment: null, extra_params: null }
    )
  })

  it("calls POST with provided comment", async () => {
    mockApi.post.mockResolvedValue(VALID_ACTION)
    await approveGovernedAction("action-123", "Looks good")
    expect(mockApi.post).toHaveBeenCalledWith(
      "/governed-actions/action-123/approve",
      { comment: "Looks good", extra_params: null }
    )
  })

  it("calls POST with provided extra_params", async () => {
    mockApi.post.mockResolvedValue(VALID_ACTION)
    await approveGovernedAction("action-123", undefined, {
      conflict_acknowledged: true,
    })
    expect(mockApi.post).toHaveBeenCalledWith(
      "/governed-actions/action-123/approve",
      { comment: null, extra_params: { conflict_acknowledged: true } }
    )
  })

  it("returns the parsed GovernedAction", async () => {
    mockApi.post.mockResolvedValue(VALID_ACTION)
    const result = await approveGovernedAction("action-123")
    expect(result.id).toBe(VALID_ACTION.id)
  })

  it("throws when response does not match GovernedActionSchema", async () => {
    mockApi.post.mockResolvedValue({ unexpected: true })
    await expect(approveGovernedAction("action-123")).rejects.toThrow()
  })

  it("propagates API errors", async () => {
    const error = {
      name: "ApiError",
      code: "GOVERNED_ACTION_FORBIDDEN",
      message: "Forbidden",
    }
    mockApi.post.mockRejectedValue(error)
    await expect(approveGovernedAction("action-123")).rejects.toMatchObject({
      code: "GOVERNED_ACTION_FORBIDDEN",
    })
  })
})

describe("rejectGovernedAction", () => {
  it("calls POST /governed-actions/:id/reject with null comment by default", async () => {
    mockApi.post.mockResolvedValue(VALID_ACTION)
    await rejectGovernedAction("action-123")
    expect(mockApi.post).toHaveBeenCalledWith(
      "/governed-actions/action-123/reject",
      { comment: null }
    )
  })

  it("calls POST with provided comment", async () => {
    mockApi.post.mockResolvedValue(VALID_ACTION)
    await rejectGovernedAction("action-123", "Does not meet policy")
    expect(mockApi.post).toHaveBeenCalledWith(
      "/governed-actions/action-123/reject",
      { comment: "Does not meet policy" }
    )
  })

  it("returns the parsed GovernedAction", async () => {
    mockApi.post.mockResolvedValue(VALID_ACTION)
    const result = await rejectGovernedAction("action-123")
    expect(result.id).toBe(VALID_ACTION.id)
  })

  it("throws when response does not match GovernedActionSchema", async () => {
    mockApi.post.mockResolvedValue({ unexpected: true })
    await expect(rejectGovernedAction("action-123")).rejects.toThrow()
  })

  it("propagates API errors", async () => {
    const error = {
      name: "ApiError",
      code: "ACTION_NOT_PENDING",
      message: "Not pending",
    }
    mockApi.post.mockRejectedValue(error)
    await expect(rejectGovernedAction("action-123")).rejects.toMatchObject({
      code: "ACTION_NOT_PENDING",
    })
  })
})
