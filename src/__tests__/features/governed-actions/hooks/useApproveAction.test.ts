import { describe, it, expect, vi, beforeEach } from "vitest"

const mockInvalidateQueries = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(
    ({
      mutationFn,
      onSuccess,
    }: {
      mutationFn: (vars: {
        id: string
        comment?: string
        extraParams?: Record<string, unknown>
      }) => Promise<unknown>
      onSuccess: () => void
    }) => ({
      mutate: (
        vars: {
          id: string
          comment?: string
          extraParams?: Record<string, unknown>
        },
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
  approveGovernedAction: vi.fn(),
  GOVERNED_ACTIONS_QUERY_KEYS: {
    lists: () => ["governed-actions", "list"],
  },
}))

import { useApproveAction } from "@/features/governed-actions/hooks/useApproveAction"
import { approveGovernedAction } from "@/features/governed-actions/api/governedActionsApi"

const mockApprove = approveGovernedAction as ReturnType<typeof vi.fn>

const VALID_ACTION = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  action_type: "user_role_change",
  subject_type: "user",
  subject_id: "550e8400-e29b-41d4-a716-446655440001",
  tenant_id: null,
  status: "approved",
  initiator_id: "550e8400-e29b-41d4-a716-446655440002",
  approver_id: "550e8400-e29b-41d4-a716-446655440003",
  display_snapshot: {},
  initiator_snapshot: {},
  approver_snapshot: {},
  execution_params: {},
  reason: null,
  approver_comment: "Looks good",
  expires_at: null,
  resolved_at: "2026-06-01T11:00:00.000Z",
  correlation_id: null,
  created_at: "2026-06-01T10:00:00.000Z",
  updated_at: "2026-06-01T11:00:00.000Z",
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApprove.mockResolvedValue(VALID_ACTION)
})

describe("useApproveAction", () => {
  it("calls approveGovernedAction with the correct id and no comment", async () => {
    const { mutate } = useApproveAction()
    await mutate({ id: "action-abc" })
    expect(mockApprove).toHaveBeenCalledWith("action-abc", undefined, undefined)
  })

  it("calls approveGovernedAction with the correct id and comment when provided", async () => {
    const { mutate } = useApproveAction()
    await mutate({ id: "action-abc", comment: "Policy compliant" })
    expect(mockApprove).toHaveBeenCalledWith(
      "action-abc",
      "Policy compliant",
      undefined
    )
  })

  it("calls approveGovernedAction with extraParams when provided (merge conflict gate)", async () => {
    const { mutate } = useApproveAction()
    await mutate({
      id: "action-abc",
      extraParams: { conflict_acknowledged: true },
    })
    expect(mockApprove).toHaveBeenCalledWith("action-abc", undefined, {
      conflict_acknowledged: true,
    })
  })

  it("invalidates governed-actions list queries on success", async () => {
    const { mutate } = useApproveAction()
    await mutate({ id: "action-abc" })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["governed-actions", "list"],
    })
  })
})
