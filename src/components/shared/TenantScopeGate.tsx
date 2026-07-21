import { TenantQuickSelect } from "@/features/tenants/components/TenantQuickSelect"

type Props = {
  isSystemAdmin: boolean
  selectTenantPrompt: string
  tenantRequiredMessage: string
}

// Shared "no tenant in scope" gate — shown when the current user (typically a System
// Admin) has no single tenant_id to scope a tenant-scoped screen to. System Admins get a
// session-only tenant picker; every other role sees a static "not available yet" message.
export function TenantScopeGate({
  isSystemAdmin,
  selectTenantPrompt,
  tenantRequiredMessage,
}: Props) {
  if (isSystemAdmin) {
    return (
      <div className="p-8 max-w-sm space-y-4">
        <p className="text-sm text-muted-foreground">{selectTenantPrompt}</p>
        <TenantQuickSelect />
      </div>
    )
  }

  return (
    <div className="p-8">
      <p className="text-sm text-muted-foreground">{tenantRequiredMessage}</p>
    </div>
  )
}
