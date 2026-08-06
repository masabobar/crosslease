import { useQuery } from "@tanstack/react-query"
import {
  fetchSelectableProductTemplates,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { SelectableTemplatesResponse } from "@/features/frameworkAgreements/api/schema"
import { dedupeSelectableTemplates } from "@/features/frameworkAgreements/utils"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

// The endpoint is version-scoped — one row per selectable version, so a template with an
// active v2 and an in-window superseded v1 arrives twice under one template_id (see
// dedupeSelectableTemplates). Every consumer of this hook keys on template_id: the FA
// picker, both FA review steps, the FA detail Templates tab, and the Workflow Task
// Catalogue / Document Requirement list, detail and create surfaces. None of them wants
// version rows, and each broke differently on the duplicates — double-checked options in
// the picker, indistinguishable filter entries, and `.find()` / Map lookups resolving to
// whichever version the response happened to order first or last. Collapsing here fixes
// all of them at the one seam they share.
//
// A future version-level consumer (Financing, which the endpoint's `financing_type` param
// exists for) must call fetchSelectableProductTemplates directly rather than widen this.
export function selectUniqueTemplates(
  data: SelectableTemplatesResponse
): SelectableTemplatesResponse {
  return { items: [...dedupeSelectableTemplates(data.items)] }
}

export function useSelectableProductTemplates() {
  return useQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.selectableTemplates(),
    queryFn: fetchSelectableProductTemplates,
    // Module-scope reference so React Query can memoize the result instead of
    // recomputing on every render.
    select: selectUniqueTemplates,
    staleTime: THIRTY_SECONDS_MS,
  })
}
