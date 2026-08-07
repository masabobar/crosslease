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
      mutate: (vars: unknown, callbacks?: { onSuccess?: () => void }) => {
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

vi.mock("@/features/tenants/api/tenantsApi", () => ({
  createTenant: vi.fn(),
  suspendTenant: vi.fn(),
  archiveTenant: vi.fn(),
  reactivateTenant: vi.fn(),
  updateTenant: vi.fn(),
  activateTenantModule: vi.fn(),
  deactivateTenantModule: vi.fn(),
  createGrant: vi.fn(),
  revokeGrant: vi.fn(),
  upsertIntegrationBinding: vi.fn(),
  updateAccessPolicy: vi.fn(),
  TENANTS_QUERY_KEYS: {
    // Mirrors the real factory exactly. An earlier version of this mock had
    // `list()` return a two-element array, which is what the hooks *should*
    // invalidate but not what the real `list()` produced — so these assertions
    // passed against a key that never matched in the browser. Keep the two
    // shapes distinct here; tenantsApi.test.ts asserts the real ones.
    lists: () => ["tenants", "list"],
    list: (params?: unknown) => ["tenants", "list", params],
    detail: (id: string) => ["tenants", "detail", id],
    modules: (id: string) => ["tenants", "modules", id],
    grants: (id: string) => ["tenants", "grants", id],
    integrationBinding: (id: string) => ["tenants", "integration-binding", id],
    accessPolicy: (id: string) => ["tenants", "access-policy", id],
  },
}))

import { useCreateTenant } from "@/features/tenants/hooks/useCreateTenant"
import { useSuspendTenant } from "@/features/tenants/hooks/useSuspendTenant"
import { useArchiveTenant } from "@/features/tenants/hooks/useArchiveTenant"
import { useReactivateTenant } from "@/features/tenants/hooks/useReactivateTenant"
import { useUpdateTenant } from "@/features/tenants/hooks/useUpdateTenant"
import { useActivateTenantModule } from "@/features/tenants/hooks/useActivateTenantModule"
import { useDeactivateTenantModule } from "@/features/tenants/hooks/useDeactivateTenantModule"
import { useCreateGrant } from "@/features/tenants/hooks/useCreateGrant"
import { useRevokeGrant } from "@/features/tenants/hooks/useRevokeGrant"
import { useUpdateLicenceLimits } from "@/features/tenants/hooks/useUpdateLicenceLimits"
import { useUpsertIntegrationBinding } from "@/features/tenants/hooks/useUpsertIntegrationBinding"
import { useUpdateAccessPolicy } from "@/features/tenants/hooks/useUpdateAccessPolicy"
import {
  createTenant,
  suspendTenant,
  archiveTenant,
  reactivateTenant,
  updateTenant,
  activateTenantModule,
  deactivateTenantModule,
  createGrant,
  revokeGrant,
  upsertIntegrationBinding,
  updateAccessPolicy,
} from "@/features/tenants/api/tenantsApi"

const mockCreate = createTenant as ReturnType<typeof vi.fn>
const mockSuspend = suspendTenant as ReturnType<typeof vi.fn>
const mockArchive = archiveTenant as ReturnType<typeof vi.fn>
const mockReactivate = reactivateTenant as ReturnType<typeof vi.fn>
const mockUpdate = updateTenant as ReturnType<typeof vi.fn>
const mockActivateModule = activateTenantModule as ReturnType<typeof vi.fn>
const mockDeactivateModule = deactivateTenantModule as ReturnType<typeof vi.fn>
const mockCreateGrant = createGrant as ReturnType<typeof vi.fn>
const mockRevokeGrant = revokeGrant as ReturnType<typeof vi.fn>
const mockUpsert = upsertIntegrationBinding as ReturnType<typeof vi.fn>
const mockUpdatePolicy = updateAccessPolicy as ReturnType<typeof vi.fn>

const TENANT_ID = "tenant-123"

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockResolvedValue({})
  mockSuspend.mockResolvedValue({})
  mockArchive.mockResolvedValue({})
  mockReactivate.mockResolvedValue({})
  mockUpdate.mockResolvedValue({})
  mockActivateModule.mockResolvedValue({})
  mockDeactivateModule.mockResolvedValue({})
  mockCreateGrant.mockResolvedValue({})
  mockRevokeGrant.mockResolvedValue({})
  mockUpsert.mockResolvedValue({})
  mockUpdatePolicy.mockResolvedValue({})
})

const CREATE_TENANT_PAYLOAD = {
  name: "Acme Bank",
  code: "ACME",
  tenant_type: "bank" as const,
  default_currency: "EUR" as const,
  legal_entity_name: "Acme Bank GmbH",
  country: "DE",
  modules: ["financing"],
  seed_package: "minimal_sandbox" as const,
}

describe("useCreateTenant", () => {
  it("calls createTenant with the provided payload", async () => {
    const { mutate } = useCreateTenant()
    await mutate(CREATE_TENANT_PAYLOAD)
    expect(mockCreate).toHaveBeenCalledWith(CREATE_TENANT_PAYLOAD)
  })

  it("invalidates tenant list on success", async () => {
    const { mutate } = useCreateTenant()
    await mutate(CREATE_TENANT_PAYLOAD)
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "list"],
    })
  })
})

describe("useSuspendTenant", () => {
  it("calls suspendTenant with the correct tenantId and payload", async () => {
    const { mutate } = useSuspendTenant(TENANT_ID)
    const payload = { justification: "Compliance hold" }
    await mutate(payload)
    expect(mockSuspend).toHaveBeenCalledWith(TENANT_ID, payload)
  })

  it("invalidates tenant detail and list on success", async () => {
    const { mutate } = useSuspendTenant(TENANT_ID)
    await mutate({ justification: "Compliance hold" })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "detail", TENANT_ID],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "list"],
    })
  })
})

describe("useArchiveTenant", () => {
  it("calls archiveTenant with the correct tenantId and payload", async () => {
    const { mutate } = useArchiveTenant(TENANT_ID)
    const payload = {
      justification: "End of contract",
      irreversibility_acknowledgement: true,
    }
    await mutate(payload)
    expect(mockArchive).toHaveBeenCalledWith(TENANT_ID, payload)
  })

  it("invalidates tenant detail and list on success", async () => {
    const { mutate } = useArchiveTenant(TENANT_ID)
    await mutate({
      justification: "End of contract",
      irreversibility_acknowledgement: true,
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "detail", TENANT_ID],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "list"],
    })
  })
})

describe("useReactivateTenant", () => {
  it("calls reactivateTenant with the correct tenantId and payload", async () => {
    const { mutate } = useReactivateTenant(TENANT_ID)
    const payload = { justification: "Suspension resolved" }
    await mutate(payload)
    expect(mockReactivate).toHaveBeenCalledWith(TENANT_ID, payload)
  })

  it("invalidates tenant detail and list on success", async () => {
    const { mutate } = useReactivateTenant(TENANT_ID)
    await mutate({ justification: "Suspension resolved" })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "detail", TENANT_ID],
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "list"],
    })
  })
})

describe("useUpdateTenant", () => {
  it("calls updateTenant with the correct tenantId and payload", async () => {
    const { mutate } = useUpdateTenant(TENANT_ID)
    const payload = { name: "Acme Bank Updated" }
    await mutate(payload)
    expect(mockUpdate).toHaveBeenCalledWith(TENANT_ID, payload)
  })

  it("invalidates tenant detail on success", async () => {
    const { mutate } = useUpdateTenant(TENANT_ID)
    await mutate({ name: "Acme Bank Updated" })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "detail", TENANT_ID],
    })
  })
})

describe("useActivateTenantModule", () => {
  it("calls activateTenantModule with the correct tenantId, moduleKey, and payload", async () => {
    const { mutate } = useActivateTenantModule(TENANT_ID)
    const vars = {
      moduleKey: "leasing",
      payload: { justification: "Approved" },
    }
    await mutate(vars)
    expect(mockActivateModule).toHaveBeenCalledWith(
      TENANT_ID,
      vars.moduleKey,
      vars.payload
    )
  })

  it("invalidates tenant modules on success", async () => {
    const { mutate } = useActivateTenantModule(TENANT_ID)
    await mutate({ moduleKey: "leasing", payload: { justification: "Ok" } })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "modules", TENANT_ID],
    })
  })
})

describe("useDeactivateTenantModule", () => {
  it("calls deactivateTenantModule with the correct tenantId, moduleKey, and payload", async () => {
    const { mutate } = useDeactivateTenantModule(TENANT_ID)
    const vars = {
      moduleKey: "leasing",
      payload: { justification: "No longer needed" },
    }
    await mutate(vars)
    expect(mockDeactivateModule).toHaveBeenCalledWith(
      TENANT_ID,
      vars.moduleKey,
      vars.payload
    )
  })

  it("invalidates tenant modules on success", async () => {
    const { mutate } = useDeactivateTenantModule(TENANT_ID)
    await mutate({
      moduleKey: "leasing",
      payload: { justification: "No longer needed" },
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "modules", TENANT_ID],
    })
  })
})

const CREATE_GRANT_PAYLOAD = {
  grantee_id: "user-1",
  access_reason: "user_access_issue" as const,
  valid_from: "2026-07-01T00:00:00.000Z",
  valid_until: "2026-07-31T00:00:00.000Z",
}

describe("useCreateGrant", () => {
  it("calls createGrant with the correct tenantId and payload", async () => {
    const { mutate } = useCreateGrant(TENANT_ID)
    await mutate(CREATE_GRANT_PAYLOAD)
    expect(mockCreateGrant).toHaveBeenCalledWith(
      TENANT_ID,
      CREATE_GRANT_PAYLOAD
    )
  })

  it("invalidates tenant grants on success", async () => {
    const { mutate } = useCreateGrant(TENANT_ID)
    await mutate(CREATE_GRANT_PAYLOAD)
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "grants", TENANT_ID],
    })
  })
})

describe("useRevokeGrant", () => {
  it("calls revokeGrant with the correct tenantId, grantId, and payload", async () => {
    const { mutate } = useRevokeGrant(TENANT_ID)
    const vars = {
      grantId: "grant-abc",
      payload: { revocation_reason: "Access no longer needed" },
    }
    await mutate(vars)
    expect(mockRevokeGrant).toHaveBeenCalledWith(
      TENANT_ID,
      vars.grantId,
      vars.payload
    )
  })

  it("invalidates tenant grants on success", async () => {
    const { mutate } = useRevokeGrant(TENANT_ID)
    await mutate({
      grantId: "grant-abc",
      payload: { revocation_reason: "Access no longer needed" },
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "grants", TENANT_ID],
    })
  })
})

describe("useUpdateLicenceLimits", () => {
  it("calls updateTenant with the correct tenantId and licence limits payload", async () => {
    const { mutate } = useUpdateLicenceLimits(TENANT_ID)
    const payload = {
      max_lc_count: 10,
      max_bank_user_count: 50,
      max_users_per_lc: 5,
    }
    await mutate(payload)
    expect(mockUpdate).toHaveBeenCalledWith(TENANT_ID, payload)
  })

  it("invalidates tenant detail on success", async () => {
    const { mutate } = useUpdateLicenceLimits(TENANT_ID)
    await mutate({
      max_lc_count: 10,
      max_bank_user_count: 50,
      max_users_per_lc: 5,
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "detail", TENANT_ID],
    })
  })
})

describe("useUpsertIntegrationBinding", () => {
  it("calls upsertIntegrationBinding with the correct tenantId and payload", async () => {
    const { mutate } = useUpsertIntegrationBinding(TENANT_ID)
    const payload = {
      endpoint_url: "https://api.example.com",
      credential_scope_identifier: "scope-1",
      integration_active: true,
      justification: "Initial setup",
    }
    await mutate(payload)
    expect(mockUpsert).toHaveBeenCalledWith(TENANT_ID, payload)
  })

  it("invalidates integration binding on success", async () => {
    const { mutate } = useUpsertIntegrationBinding(TENANT_ID)
    await mutate({
      endpoint_url: "https://api.example.com",
      credential_scope_identifier: "scope-1",
      integration_active: true,
      justification: "Initial setup",
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "integration-binding", TENANT_ID],
    })
  })
})

describe("useUpdateAccessPolicy", () => {
  it("calls updateAccessPolicy with the correct tenantId and payload", async () => {
    const { mutate } = useUpdateAccessPolicy(TENANT_ID)
    const payload = {
      support_read_only_access_allowed: true,
      auditor_access_allowed: false,
      lc_portal_enabled: true,
      reason: "Policy review",
    }
    await mutate(payload)
    expect(mockUpdatePolicy).toHaveBeenCalledWith(TENANT_ID, payload)
  })

  it("invalidates access policy on success", async () => {
    const { mutate } = useUpdateAccessPolicy(TENANT_ID)
    await mutate({
      support_read_only_access_allowed: true,
      auditor_access_allowed: false,
      lc_portal_enabled: true,
      reason: "Policy review",
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["tenants", "access-policy", TENANT_ID],
    })
  })
})
