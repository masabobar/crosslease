import { useTranslation } from "react-i18next"
import { formatAnchorLabel } from "@/features/partners/utils"
import { useResolutionCandidates } from "@/features/partners/hooks/useResolutionCandidates"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

const SKELETON_COUNT = 3

type ResolutionCandidatesTabProps = {
  partnerId: string
}

function ResolutionCandidatesTab({ partnerId }: ResolutionCandidatesTabProps) {
  const { t } = useTranslation("partners")
  const { data, isLoading, isError, error } = useResolutionCandidates(partnerId)

  // classification and confidence are bare strings on the wire. The matching
  // service emits "exact" | "ambiguous" | "no_match" and the same
  // definite/probable/possible scale the duplicate queue uses, so both reuse
  // those label groups and fall back to the raw value for anything new.
  function classificationLabel(value: string): string {
    return t(`matchClassification.${value}` as "matchClassification.exact", {
      defaultValue: value,
    })
  }

  function confidenceLabel(value: string): string {
    return t(
      `duplicates.confidence.${value}` as "duplicates.confidence.definite",
      { defaultValue: value }
    )
  }

  if (isLoading) {
    return (
      <div className="py-8">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-muted animate-pulse mb-2"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-8 text-center">
        {resolveApiErrorMessage(error, t)}
      </p>
    )
  }

  const candidates = data?.candidates ?? []

  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {t("detail.resolutionCandidates.title")}
        </p>
        {data?.resolution && (
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>
              {t("detail.resolutionCandidates.classification")}:{" "}
              <span className="text-foreground">
                {classificationLabel(data.resolution.classification)}
              </span>
            </span>
            {data.resolution.confidence && (
              <span>
                {t("detail.resolutionCandidates.confidence")}:{" "}
                <span className="text-foreground">
                  {confidenceLabel(data.resolution.confidence)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          {t("detail.resolutionCandidates.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {candidates.map(c => (
            <div
              key={c.partner_id}
              className="rounded-xl border border-border px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {c.display_name}
                </p>
                <span className="text-xs text-muted-foreground">
                  {confidenceLabel(c.confidence)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("detail.resolutionCandidates.matchedAnchors")}:{" "}
                {c.matched_anchors.map(a => formatAnchorLabel(t, a)).join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { ResolutionCandidatesTab }
