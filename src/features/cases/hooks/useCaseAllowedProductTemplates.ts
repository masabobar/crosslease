import { useQuery } from "@tanstack/react-query"
import {
  fetchFrameworkAgreementDetail,
  fetchFrameworkAgreements,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { filterTemplatesAllowedByAgreement } from "@/features/cases/allowedTemplates"
import { FALifecycleStatusSchema } from "@/features/frameworkAgreements/api/schema"
import type { SelectableTemplateItem } from "@/features/frameworkAgreements/api/schema"

// The lifecycle value that makes an agreement the one in force. Referenced from the schema enum
// rather than written as a literal (enums-and-constants.md §4); only an active agreement governs a
// new case.
const ACTIVE_AGREEMENT_STATUS = FALifecycleStatusSchema.enum.active

// One page is enough: D-79 states there is exactly one active framework agreement per leasing
// company, so this asks for a handful rather than paging. More than one coming back is a data
// problem, not a paging problem — see the note on `agreementCount` below.
const AGREEMENT_LOOKUP_LIMIT = 5

/**
 * The product templates a case may bind, for the leasing company selected in wizard step 1.
 *
 * Three reads, chained, because no single endpoint answers this:
 *
 *   1. the active framework agreement for the partner (`/framework-agreements?lc_partner_id=…`)
 *   2. that agreement's permitted template ids (`/framework-agreements/{id}` → `product_template_ids`)
 *   3. the bank's selectable templates, for names and versions
 *
 * Steps 1 and 2 reuse the framework-agreement fetchers and their query keys rather than declaring
 * new ones, so they share the cache with the FA screens instead of double-fetching. They are not
 * routed through `useFrameworkAgreementDetail`, which takes a bare id and cannot be disabled — an
 * un-guarded call would fire a request for `""` before a company is chosen.
 */
export function useCaseAllowedProductTemplates(
  lcPartnerId: string | undefined
) {
  const agreements = useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.list({
      lc_partner_id: lcPartnerId,
      status: ACTIVE_AGREEMENT_STATUS,
      per_page: AGREEMENT_LOOKUP_LIMIT,
    }),
    queryFn: () =>
      fetchFrameworkAgreements({
        lc_partner_id: lcPartnerId,
        status: ACTIVE_AGREEMENT_STATUS,
        per_page: AGREEMENT_LOOKUP_LIMIT,
      }),
    enabled: Boolean(lcPartnerId),
  })

  const agreementId = agreements.data?.items[0]?.id

  const detail = useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.detail(agreementId ?? ""),
    queryFn: () => fetchFrameworkAgreementDetail(agreementId as string),
    enabled: Boolean(agreementId),
  })

  const selectable = useSelectableProductTemplates()

  const templates: SelectableTemplateItem[] =
    detail.data && selectable.data
      ? filterTemplatesAllowedByAgreement(
          selectable.data.items,
          detail.data.product_template_ids
        )
      : []

  return {
    templates,
    isLoading:
      agreements.isLoading ||
      (Boolean(agreementId) && detail.isLoading) ||
      selectable.isLoading,
    isError: agreements.isError || detail.isError || selectable.isError,
    error: agreements.error ?? detail.error ?? selectable.error,
    /**
     * True when the partner has no active framework agreement. Distinct from "still loading" and
     * from "the agreement allows no templates" — the first blocks the case outright (D-79 makes the
     * agreement mandatory), the second is a configuration gap on the agreement.
     */
    hasNoActiveAgreement:
      agreements.isSuccess && agreements.data.items.length === 0,
    /**
     * How many active agreements came back. D-79 says one; more than one means the data contradicts
     * the rule, and the step says so rather than silently binding against `items[0]`.
     */
    agreementCount: agreements.data?.items.length ?? 0,
  }
}
