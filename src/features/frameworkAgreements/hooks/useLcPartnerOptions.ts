import { usePartnerList } from "@/features/partners/hooks/usePartnerList"

// Leasing Companies are Partner records carrying the "leasing_company" role — there is no
// distinct partner_type for them (see PartnerRoleSchema in features/partners/api/schema.ts).
export function useLcPartnerOptions(tenantId: string | null, search: string) {
  const { data, isLoading } = usePartnerList(tenantId, {
    role: ["leasing_company"],
    status: ["confirmed"],
    search: search || undefined,
  })

  return {
    options: (data?.items ?? []).map(p => ({
      value: p.partner_id,
      label: p.display_name,
    })),
    isLoading,
  }
}
