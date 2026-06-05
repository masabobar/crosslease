import { describe, it, expect, vi, beforeEach } from "vitest"

const mockInvalidateQueries = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(
    ({
      mutationFn,
      onSuccess,
    }: {
      mutationFn: (vars: { id: string; comment?: string }) => Promise<unknown>
      onSuccess: () => void
    }) => ({
      mutate: (
        vars: { id: string; comment?: string },
        callbacks?: { onSuccess?: () => void }
      ) => {
        return mutationFn(vars).then(() => {
          onSuccess()
          callbacks?.onSuccess?.()
        })
      },
      isPending: false,
    })
  ),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}))

vi.mock("@/features/governed-actions/api/governedActionsApi", () => ({
  rejectGovernedAction: vi.fn(),
  GOVERNED_ACTIONS_QUERY_KEYS: {
    lists: () => ["governed-actions", "list"],
  },
}))

import { useRejectAction } from "@/features/governed-actions/hooks/useRejectAction"
import { rejectGovernedAction } from "@/features/governed-actions/api/governedActionsApi"

const mockReject = rejectGovernedAction as ReturnType<typeof vi.fn>

const VALID_ACTION = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  action_type: "user_role_change",
  subject_type: "user",
  subject_id: "550e8400-e29b-41d4-a716-446655440001",
  tenant_id: null,
  status: "rejected",
  initiator_id: "550e8400-e29b-41d4-a716-446655440002",
  approver_id: "550e8400-e29b-41d4-a716-446655440003",
  display_snapshot: {},
  initiator_snapshot: {},
  approver_snapshot: {},
  execution_params: {},
  reason: null,
  approver_comment: "Does not meet policy",
  expires_at: null,
  resolved_at: "2026-06-01T11:00:00.000Z",
  correlation_id: null,
  created_at: "2026-06-01T10:00:00.000Z",
  updated_at: "2026-06-01T11:00:00.000Z",
}

beforeEach(() => {
  vi.clearAllMocks()
  mockReject.mockResolvedValue(VALID_ACTION)
})

describe("useRejectAction", () => {
  it("calls rejectGovernedAction with the correct id and no comment", async () => {
    const { mutate } = useRejectAction()
    await mutate({ id: "action-abc" })
    expect(mockReject).toHaveBeenCalledWith("action-abc", undefined)
  })

  it("calls rejectGovernedAction with the correct id and comment when provided", async () => {
    const { mutate } = useRejectAction()
    await mutate({ id: "action-abc", comment: "Non-compliant request" })
    expect(mockReject).toHaveBeenCalledWith(
      "action-abc",
      "Non-compliant request"
    )
  })

  it("invalidates governed-actions list queries on success", async () => {
    const { mutate } = useRejectAction()
    await mutate({ id: "action-abc" })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["governed-actions", "list"],
    })
  })
})
