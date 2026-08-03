import { describe, it, expect, vi, beforeEach } from "vitest"

const mockInvalidateQueries = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(
    ({
      mutationFn,
      onSuccess,
    }: {
      mutationFn: (vars: { id: string; reason?: string }) => Promise<unknown>
      onSuccess: () => void
    }) => ({
      mutate: (
        vars: { id: string; reason?: string },
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

vi.mock("@/features/governedActions/api/governedActionsApi", () => ({
  reInitiateGovernedAction: vi.fn(),
  GOVERNED_ACTIONS_QUERY_KEYS: {
    lists: () => ["governed-actions", "list"],
  },
}))

import { useReInitiateAction } from "@/features/governedActions/hooks/useReInitiateAction"
import { reInitiateGovernedAction } from "@/features/governedActions/api/governedActionsApi"

const mockReInitiate = reInitiateGovernedAction as ReturnType<typeof vi.fn>

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
  initiator_snapshot: {},
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
  mockReInitiate.mockResolvedValue(VALID_ACTION)
})

describe("useReInitiateAction", () => {
  it("calls reInitiateGovernedAction with the correct id and no reason", async () => {
    const { mutate } = useReInitiateAction()
    await mutate({ id: "action-abc" })
    expect(mockReInitiate).toHaveBeenCalledWith("action-abc", undefined)
  })

  it("calls reInitiateGovernedAction with the correct id and reason when provided", async () => {
    const { mutate } = useReInitiateAction()
    await mutate({ id: "action-abc", reason: "Policy requires re-submission" })
    expect(mockReInitiate).toHaveBeenCalledWith(
      "action-abc",
      "Policy requires re-submission"
    )
  })

  it("invalidates governed-actions list queries on success", async () => {
    const { mutate } = useReInitiateAction()
    await mutate({ id: "action-abc" })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["governed-actions", "list"],
    })
  })
})
