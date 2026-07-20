import { useQuery } from "@tanstack/react-query"
import {
  fetchSelectableProductTemplates,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useSelectableProductTemplates() {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.selectableTemplates(),
    queryFn: fetchSelectableProductTemplates,
    staleTime: THIRTY_SECONDS_MS,
  })
}
