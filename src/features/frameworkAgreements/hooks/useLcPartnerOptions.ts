import { useFrameworkAgreementLcPartners } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementLcPartners"

// GET /framework-agreements/lc-partners is the BE's own eligibility list for this dropdown —
// it returns exactly the confirmed legal-entity partners a Framework Agreement can be signed
// with, so the FE no longer derives eligibility itself via a filtered partner search.
type LcPartnerOptions = {
  options: { value: string; label: string }[]
  isLoading: boolean
}

export function useLcPartnerOptions(): LcPartnerOptions {
  const { data, isLoading } = useFrameworkAgreementLcPartners()

  return {
    options: (data?.items ?? []).map(p => ({
      value: p.id,
      label: p.legal_name,
    })),
    isLoading,
  }
}
