import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTenants } from "@/features/tenants/hooks/useTenants"
import { TenantStatusSchema } from "@/features/tenants/api/schema"
import { useTenantSelectionStore } from "@/store/tenantSelectionStore"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

export function TenantQuickSelect() {
  const { t } = useTranslation("tenants")
  const { data, isLoading, isError, error } = useTenants()
  const selectedTenantId = useTenantSelectionStore(s => s.selectedTenantId)
  const setSelectedTenantId = useTenantSelectionStore(
    s => s.setSelectedTenantId
  )

  const tenants = (data?.tenants ?? []).filter(
    tenant => tenant.status === TenantStatusSchema.enum.active
  )

  if (isError) {
    return (
      <p className="text-sm text-destructive" data-testid="tenant-select-error">
        {resolveApiErrorMessage(error, t)}
      </p>
    )
  }

  return (
    <Select
      value={selectedTenantId ?? undefined}
      onValueChange={setSelectedTenantId}
      disabled={isLoading || tenants.length === 0}
    >
      <SelectTrigger data-testid="tenant-quick-select" className="w-full">
        <SelectValue placeholder={t("tenantQuickSelect.placeholder")} />
      </SelectTrigger>
      <SelectContent>
        {tenants.map(tenant => (
          <SelectItem key={tenant.id} value={tenant.id}>
            {tenant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
