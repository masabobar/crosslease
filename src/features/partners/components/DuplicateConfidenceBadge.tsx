import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import type { DuplicateConfidence } from "@/features/partners/api/schema"

const CONFIDENCE_CLASSES: Record<DuplicateConfidence, string> = {
  definite: "border-destructive/40 text-destructive bg-destructive/5",
  probable: "border-warning/40 text-warning bg-warning/5",
  possible: "border-info/40 text-info bg-info/5",
}

function DuplicateConfidenceBadge({
  confidence,
}: {
  confidence: DuplicateConfidence
}) {
  const { t } = useTranslation("partners")

  return (
    <Badge variant="outline" className={CONFIDENCE_CLASSES[confidence]}>
      {t(
        `duplicates.confidence.${confidence}` as "duplicates.confidence.definite"
      )}
    </Badge>
  )
}

export { DuplicateConfidenceBadge }
