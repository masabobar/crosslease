import { describe, it, expect, vi, beforeEach } from "vitest"

const mockInvalidateQueries = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(
    ({
      mutationFn,
      onSuccess,
    }: {
      mutationFn: (vars: unknown) => Promise<unknown>
      onSuccess: () => void
    }) => ({
      mutate: (vars: unknown, callbacks?: { onSuccess?: () => void }) =>
        mutationFn(vars).then(() => {
          onSuccess()
          callbacks?.onSuccess?.()
        }),
      isPending: false,
    })
  ),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}))

vi.mock("@/features/partners/api/partnersApi", () => ({
  archivePartner: vi.fn(),
  assignPartnerRoles: vi.fn(),
  proposeIdentityChange: vi.fn(),
  PARTNERS_QUERY_KEYS: {
    list: (params?: unknown) => ["partners", "list", params],
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
  },
}))

import {
  archivePartner,
  assignPartnerRoles,
  proposeIdentityChange,
} from "@/features/partners/api/partnersApi"

import { useArchivePartner } from "@/features/partners/hooks/useArchivePartner"
import { useAssignPartnerRoles } from "@/features/partners/hooks/useAssignPartnerRoles"
import { useProposeIdentityChange } from "@/features/partners/hooks/useProposeIdentityChange"

const PARTNER_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"

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

describe("useAssignPartnerRoles", () => {
  it("calls assignPartnerRoles with the correct arguments", async () => {
    vi.mocked(assignPartnerRoles).mockResolvedValue({ results: [] } as never)
    const mutation = useAssignPartnerRoles(PARTNER_ID)
    await mutation.mutate({ roles: ["lessee", "guarantor"], note: null })
    expect(assignPartnerRoles).toHaveBeenCalledWith(PARTNER_ID, {
      roles: ["lessee", "guarantor"],
      note: null,
    })
  })

  it("invalidates roles query on success", async () => {
    vi.mocked(assignPartnerRoles).mockResolvedValue({ results: [] } as never)
    const mutation = useAssignPartnerRoles(PARTNER_ID)
    await mutation.mutate({ roles: ["supplier"] })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "roles", PARTNER_ID],
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
