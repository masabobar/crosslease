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
  confirmPartner: vi.fn(),
  rejectPartner: vi.fn(),
  archivePartner: vi.fn(),
  assignPartnerRoles: vi.fn(),
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
  confirmPartner,
  rejectPartner,
  archivePartner,
  assignPartnerRoles,
} from "@/features/partners/api/partnersApi"

import { useConfirmPartner } from "@/features/partners/hooks/useConfirmPartner"
import { useRejectPartner } from "@/features/partners/hooks/useRejectPartner"
import { useArchivePartner } from "@/features/partners/hooks/useArchivePartner"
import { useAssignPartnerRoles } from "@/features/partners/hooks/useAssignPartnerRoles"

const PARTNER_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useConfirmPartner", () => {
  it("calls confirmPartner with the correct arguments", async () => {
    vi.mocked(confirmPartner).mockResolvedValue({} as never)
    const mutation = useConfirmPartner(PARTNER_ID)
    await mutation.mutate({ note: "Looks good" })
    expect(confirmPartner).toHaveBeenCalledWith(PARTNER_ID, {
      note: "Looks good",
    })
  })

  it("invalidates detail and list queries on success", async () => {
    vi.mocked(confirmPartner).mockResolvedValue({} as never)
    const mutation = useConfirmPartner(PARTNER_ID)
    await mutation.mutate({ note: null })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "detail", PARTNER_ID],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "list"],
    })
  })
})

describe("useRejectPartner", () => {
  it("calls rejectPartner with the correct arguments", async () => {
    vi.mocked(rejectPartner).mockResolvedValue({} as never)
    const mutation = useRejectPartner(PARTNER_ID)
    await mutation.mutate({ note: "Identity mismatch" })
    expect(rejectPartner).toHaveBeenCalledWith(PARTNER_ID, {
      note: "Identity mismatch",
    })
  })

  it("invalidates detail and list queries on success", async () => {
    vi.mocked(rejectPartner).mockResolvedValue({} as never)
    const mutation = useRejectPartner(PARTNER_ID)
    await mutation.mutate({ note: "Identity mismatch" })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "detail", PARTNER_ID],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["partners", "list"],
    })
  })
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
