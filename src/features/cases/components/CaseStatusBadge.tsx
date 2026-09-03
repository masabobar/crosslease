import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import {
  caseDisplayStatusBadgeVariant,
  caseDisplayStatusSlug,
} from "@/features/cases/types"
import type { CaseDisplayStatus } from "@/features/cases/api/schema"

/**
 * A case's status, as the Figma frames draw it: a pale tinted pill with a saturated leading dot
 * and same-hue text (`CREATE NEW.pdf` frame 1).
 *
 * One component rather than the two copies it replaces — the Cases list and the case workspace
 * header both show this pill, and they had already drifted into resolving the tone and the label
 * separately. Both go through `caseDisplayStatusSlug` here, which is what makes the colour and the
 * translation actually resolve (see the note on that function).
 *
 * The dot is `bg-current`, so it inherits whatever hue the tone set — one less thing to keep in
 * step when a status is added.
 */
export function CaseStatusBadge({ status }: { status: CaseDisplayStatus }) {
  const { t } = useTranslation("cases")
  const slug = caseDisplayStatusSlug(status)

  return (
    <Badge
      variant={caseDisplayStatusBadgeVariant(status)}
      data-testid={`case-status-badge-${slug}`}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-current"
      />
      {/* The wire value is already human-readable ("Missing information"), so it is the right
          fallback for a status this app has no key for yet — better an untranslated real label
          than a raw key on screen. */}
      {t(`displayStatuses.${slug}` as "displayStatuses.open", {
        defaultValue: status,
      })}
    </Badge>
  )
}
