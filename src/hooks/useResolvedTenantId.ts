import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { SYSTEM_ADMIN_ROLE } from "@/features/users/types"
import { useTenantSelectionStore } from "@/store/tenantSelectionStore"

// Most partner/duplicate endpoints are tenant-scoped (…/tenants/{tenant_id}/…).
// A tenant-bound user carries their own `tenant_id`; a System Admin has none, so
// they pick one through the session-only quick select (TenantQuickSelect /
// tenantSelectionStore). Every screen that calls a tenant-scoped endpoint needs
// the same resolution, so it lives here rather than being re-derived per page.
//
// Returns null when no tenant can be resolved — callers gate on that (render a
// TenantScopeGate, or leave the query disabled).
export function useResolvedTenantId(): string | null {
  const { data: currentUser } = useCurrentUser()
  const selectedTenantId = useTenantSelectionStore(s => s.selectedTenantId)

  return (
    currentUser?.tenant_id ??
    (currentUser?.role === SYSTEM_ADMIN_ROLE ? selectedTenantId : null)
  )
}
