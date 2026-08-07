import { usePartnerList } from "@/features/partners/hooks/usePartnerList"

// Any confirmed legal-entity partner can become a leasing company by signing a
// Framework Agreement — counterparty status is derived from the FA itself, not
// from a partner role (PRD1042-1453). The old "leasing_company" role filter no
// longer exists on the backend.
type LcPartnerOptions = {
  options: { value: string; label: string }[]
  isLoading: boolean
}

export function useLcPartnerOptions(
  tenantId: string | null,
  search: string
): LcPartnerOptions {
  const { data, isLoading } = usePartnerList(tenantId, {
    status: ["confirmed"],
    search: search || undefined,
  })

  return {
    // No partner-type restriction (PRD1042-1453 AC): LCs are expected to be
    // legal entities in practice but this must not be enforced.
    options: (data?.items ?? []).map(p => ({
      value: p.partner_id,
      label: p.display_name,
    })),
    isLoading,
  }
}
