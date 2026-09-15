import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useDocumentRequirementCatalogList } from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogList"
import { useCaseDocumentRequirements } from "@/features/documentRequirements/hooks/useCaseDocumentRequirements"

/**
 * How many of a case's required documents are still missing.
 *
 * The wizard's Continue gate needs this a level above the panel that renders them, so the catalogue
 * resolution is repeated rather than the count being lifted out of the panel through a callback —
 * both queries are already in the React Query cache by the time the panel mounts, so this costs
 * nothing at runtime and keeps the panel a component rather than a component that also reports.
 *
 * `is_blocking` is the backend's own answer. Counting "mandatory and not yet accepted" again here
 * would be a second judgement, and the one that matters is whichever the Submit is checked against.
 *
 * Returns `0` while anything is still loading: a gate that bites before it knows would disable
 * Continue on every case for as long as the requests take, which reads as a broken button.
 */
export function useBlockingDocumentCount(
  businessObjectId: string | undefined,
  caseType: string | undefined
): number {
  const { data: currentUser } = useCurrentUser()
  const { data: catalogs } = useDocumentRequirementCatalogList(
    currentUser?.tenant_id ?? undefined,
    {}
  )
  // One catalogue per bank, so the single global default IS the case's catalogue — the same
  // resolution the panel makes.
  const catalogId = catalogs?.items?.[0]?.id

  const { data: surface } = useCaseDocumentRequirements(
    catalogId,
    businessObjectId,
    caseType
  )

  return (surface?.requirements ?? []).filter(
    requirement => requirement.is_blocking
  ).length
}
