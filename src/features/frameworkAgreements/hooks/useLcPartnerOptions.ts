import { usePartnerList } from "@/features/partners/hooks/usePartnerList"

// Any confirmed legal-entity partner can become a leasing company by signing a
// Framework Agreement — counterparty status is derived from the FA itself, not
// from a partner role (PRD1042-1453). The old "leasing_company" role filter no
// longer exists on the backend.
export function useLcPartnerOptions(tenantId: string | null, search: string) {
  const { data, isLoading } = usePartnerList(tenantId, {
    status: ["confirmed"],
    search: search || undefined,
  })

  return {
    options: (data?.items ?? [])
      .filter(p => p.partner_type === "legal_entity")
      .map(p => ({
        value: p.partner_id,
        label: p.display_name,
      })),
    isLoading,
  }
}
