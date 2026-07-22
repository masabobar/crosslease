import { describe, it, expect, vi, beforeEach } from "vitest"

const mockInvalidateQueries = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(
    ({
      mutationFn,
      onSuccess,
      onSettled,
    }: {
      mutationFn: (vars: unknown) => Promise<unknown>
      onSuccess?: () => void
      onSettled?: () => void
    }) => ({
      mutate: (
        vars: unknown,
        callbacks?: { onSuccess?: () => void; onError?: (err: unknown) => void }
      ) =>
        mutationFn(vars).then(
          () => {
            onSuccess?.()
            callbacks?.onSuccess?.()
            onSettled?.()
          },
          (err: unknown) => {
            callbacks?.onError?.(err)
            onSettled?.()
          }
        ),
      isPending: false,
    })
  ),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}))

vi.mock("@/features/partners/api/partnersApi", () => ({
  archivePartner: vi.fn(),
  confirmPartner: vi.fn(),
  rejectPartner: vi.fn(),
  proposeIdentityChange: vi.fn(),
  captureUboOwnership: vi.fn(),
  resolveDuplicatePair: vi.fn(),
  initiateMerge: vi.fn(),
  PARTNERS_QUERY_KEYS: {
    list: (tenantId?: unknown, params?: unknown) =>
      tenantId === undefined
        ? ["partners", "list"]
        : ["partners", "list", tenantId, params],
    detail: (id: string) => ["partners", "detail", id],
    resolutionCandidates: (id: string) => [
      "partners",
      "resolution-candidates",
      id,
    ],
    roles: (id: string) => ["partners", "roles", id],
    ubo: (id: string) => ["partners", "ubo", id],
    confirmationHistory: (id: string) => [
      "partners",
      "confirmation-history",
      id,
    ],
    decisionHistory: (id: string) => ["partners", "decision-history", id],
    archiveEligibility: (id: string) => ["partners", "archive-eligibility", id],
    identityHistory: (id: string) => ["partners", "identity-history", id],
    identityChangeDetail: (id: string, changeId: string) => [
      "partners",
      "identity-change",
      id,
      changeId,
    ],
    duplicatePairs: (tenantId: string | null) => [
      "partners",
      "duplicate-pairs",
      tenantId,
    ],
  },
}))

import {
  archivePartner,
  confirmPartner,
  rejectPartner,
  proposeIdentityChange,
  captureUboOwnership,
  resolveDuplicatePair,
  initiateMerge,
} from "@/features/partners/api/partnersApi"

import { useArchivePartner } from "@/features/partners/hooks/useArchivePartner"
import { useConfirmPartner } from "@/features/partners/hooks/useConfirmPartner"
import { useRejectPartner } from "@/features/partners/hooks/useRejectPartner"
import { useProposeIdentityChange } from "@/features/partners/hooks/useProposeIdentityChange"
import { useCaptureUboOwnership } from "@/features/partners/hooks/useCaptureUboOwnership"
import { useResolveDuplicatePair } from "@/features/partners/hooks/useResolveDuplicatePair"
import { useInitiateMerge } from "@/features/partners/hooks/useInitiateMerge"

const PARTNER_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
const TENANT_ID = "f6a7b8c9-d0e1-4f2a-8b3c-4d5e6f708192"
const PAIR_ID = "e5f6a7b8-c9d0-4e1f-8a3b-4c5d6e7f8091"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useArchivePartner", () => {
  it("calls archivePartner with the correct arguments", async () => {
    vi.mocked(archivePartner).mockResolvedValue({} as never)
    const mutation = useArchivePartner(PARTNER_ID)
    await mutation.mutate({ reason: "No longer active counterparty." })
    expect(archivePartner).toHaveBeenCalledWith(PARTNER_ID, {
      reason: "No longer active counterparty.",
    })
  })

  it("invalidates detail and list queries on success", async () => {
    vi.mocked(archivePartner).mockResolvedValue({} as never)
    const mutation = useArchivePartner(PARTNER_ID)
    await mutation.mutate({ reason: "No longer active counterparty." })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "detail", PARTNER_ID],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "list"],
    })
  })
})

describe("useConfirmPartner", () => {
  it("calls confirmPartner with the correct arguments", async () => {
    vi.mocked(confirmPartner).mockResolvedValue({} as never)
    const mutation = useConfirmPartner(PARTNER_ID)
    await mutation.mutate({ note: "Verified against register." })
    expect(confirmPartner).toHaveBeenCalledWith(PARTNER_ID, {
      note: "Verified against register.",
    })
  })

  it("invalidates detail, list, and confirmation-history queries on success", async () => {
    vi.mocked(confirmPartner).mockResolvedValue({} as never)
    const mutation = useConfirmPartner(PARTNER_ID)
    await mutation.mutate({ note: null })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "detail", PARTNER_ID],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "list"],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "confirmation-history", PARTNER_ID],
    })
  })
})

describe("useRejectPartner", () => {
  it("calls rejectPartner with the correct arguments", async () => {
    vi.mocked(rejectPartner).mockResolvedValue({} as never)
    const mutation = useRejectPartner(PARTNER_ID)
    await mutation.mutate({ note: "Duplicate of existing counterparty." })
    expect(rejectPartner).toHaveBeenCalledWith(PARTNER_ID, {
      note: "Duplicate of existing counterparty.",
    })
  })

  it("invalidates detail, list, and confirmation-history queries on success", async () => {
    vi.mocked(rejectPartner).mockResolvedValue({} as never)
    const mutation = useRejectPartner(PARTNER_ID)
    await mutation.mutate({ note: "Duplicate of existing counterparty." })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "detail", PARTNER_ID],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "list"],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "confirmation-history", PARTNER_ID],
    })
  })
})

describe("useProposeIdentityChange", () => {
  it("calls proposeIdentityChange with the correct arguments", async () => {
    vi.mocked(proposeIdentityChange).mockResolvedValue({} as never)
    const mutation = useProposeIdentityChange(PARTNER_ID)
    await mutation.mutate({
      target_anchors: ["legal_name"],
      proposed_values: { legal_name: "New Name GmbH" },
      change_reason: "Legal rename",
    })
    expect(proposeIdentityChange).toHaveBeenCalledWith(PARTNER_ID, {
      target_anchors: ["legal_name"],
      proposed_values: { legal_name: "New Name GmbH" },
      change_reason: "Legal rename",
    })
  })

  it("invalidates identity history and detail queries on success", async () => {
    vi.mocked(proposeIdentityChange).mockResolvedValue({} as never)
    const mutation = useProposeIdentityChange(PARTNER_ID)
    await mutation.mutate({
      target_anchors: ["legal_name"],
      proposed_values: { legal_name: "New Name GmbH" },
      change_reason: "Legal rename",
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "identity-history", PARTNER_ID],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "detail", PARTNER_ID],
    })
  })
})

describe("useCaptureUboOwnership", () => {
  it("calls captureUboOwnership with the correct arguments", async () => {
    vi.mocked(captureUboOwnership).mockResolvedValue({} as never)
    const mutation = useCaptureUboOwnership(PARTNER_ID)
    await mutation.mutate({
      ubo_partner_id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      ownership_percentage: 38,
      ownership_type: "direct",
    })
    expect(captureUboOwnership).toHaveBeenCalledWith(PARTNER_ID, {
      ubo_partner_id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      ownership_percentage: 38,
      ownership_type: "direct",
    })
  })

  it("invalidates ubo and detail queries on success", async () => {
    vi.mocked(captureUboOwnership).mockResolvedValue({} as never)
    const mutation = useCaptureUboOwnership(PARTNER_ID)
    await mutation.mutate({
      ubo_partner_id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
      ownership_percentage: 38,
      ownership_type: "direct",
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "ubo", PARTNER_ID],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "detail", PARTNER_ID],
    })
  })
})

describe("useResolveDuplicatePair", () => {
  it("calls resolveDuplicatePair with the correct arguments", async () => {
    vi.mocked(resolveDuplicatePair).mockResolvedValue({} as never)
    const mutation = useResolveDuplicatePair(TENANT_ID)
    await mutation.mutate({
      pairId: PAIR_ID,
      body: {
        decision: "confirmed_duplicate",
        reason_code: "identical_registry_identifiers",
        note: null,
      },
    })
    expect(resolveDuplicatePair).toHaveBeenCalledWith(PAIR_ID, {
      decision: "confirmed_duplicate",
      reason_code: "identical_registry_identifiers",
      note: null,
    })
  })

  it("invalidates the duplicate pairs query on success", async () => {
    vi.mocked(resolveDuplicatePair).mockResolvedValue({} as never)
    const mutation = useResolveDuplicatePair(TENANT_ID)
    await mutation.mutate({
      pairId: PAIR_ID,
      body: {
        decision: "deferred",
        reason_code: "insufficient_evidence",
      },
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "duplicate-pairs", TENANT_ID],
    })
  })

  it("invalidates the duplicate pairs query on error too (e.g. DUPLICATE_PAIR_ALREADY_RESOLVED race)", async () => {
    vi.mocked(resolveDuplicatePair).mockRejectedValue(new Error("conflict"))
    const mutation = useResolveDuplicatePair(TENANT_ID)
    await mutation.mutate({
      pairId: PAIR_ID,
      body: {
        decision: "confirmed_distinct",
        reason_code: "confirmed_different_entities",
      },
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "duplicate-pairs", TENANT_ID],
    })
  })
})

describe("useInitiateMerge", () => {
  it("calls initiateMerge with the correct arguments", async () => {
    vi.mocked(initiateMerge).mockResolvedValue({} as never)
    const mutation = useInitiateMerge(TENANT_ID)
    await mutation.mutate({
      pair_id: PAIR_ID,
      survivor_partner_id: PARTNER_ID,
      merge_reason_code: "same_legal_entity_different_name",
      note: null,
    })
    expect(initiateMerge).toHaveBeenCalledWith({
      pair_id: PAIR_ID,
      survivor_partner_id: PARTNER_ID,
      merge_reason_code: "same_legal_entity_different_name",
      note: null,
    })
  })

  it("invalidates the duplicate pairs query on success", async () => {
    vi.mocked(initiateMerge).mockResolvedValue({} as never)
    const mutation = useInitiateMerge(TENANT_ID)
    await mutation.mutate({
      pair_id: PAIR_ID,
      survivor_partner_id: PARTNER_ID,
      merge_reason_code: "same_legal_entity_different_name",
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "duplicate-pairs", TENANT_ID],
    })
  })

  it("invalidates the duplicate pairs query on error too (e.g. PAIR_NOT_FLAGGED_FOR_MERGE race)", async () => {
    vi.mocked(initiateMerge).mockRejectedValue(new Error("conflict"))
    const mutation = useInitiateMerge(TENANT_ID)
    await mutation.mutate({
      pair_id: PAIR_ID,
      survivor_partner_id: PARTNER_ID,
      merge_reason_code: "same_legal_entity_different_name",
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "duplicate-pairs", TENANT_ID],
    })
  })
})
