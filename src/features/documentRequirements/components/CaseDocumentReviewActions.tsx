import { useTranslation } from "react-i18next"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { showApiError } from "@/lib/apiErrorMessage"
import { useTransitionFulfilment } from "@/features/documentRequirements/hooks/useTransitionFulfilment"

type Props = {
  catalogId: string
  businessObjectId: string
  requirementDefinitionId: string
  // Labels the buttons for the row so a test (and a screen reader) can tell per-requirement controls
  // apart.
  requirementLabel: string
}

// PRD1042-1794 A10/B3 — the bank's review controls on a document that a leasing company or front
// office uploaded (status uploaded_pending_review). Check confirms it (Met); Reject marks it invalid
// and reopens the requirement. Only Back Office reaches this (fulfilment_review_write); the page
// gates rendering by role.
function CaseDocumentReviewActions({
  catalogId,
  businessObjectId,
  requirementDefinitionId,
  requirementLabel,
}: Props) {
  const { t } = useTranslation("documentRequirements")
  const review = useTransitionFulfilment(catalogId, businessObjectId)

  function run(newStatus: "fulfilled" | "rejected") {
    review.mutate(
      { requirementDefinitionId, newStatus },
      {
        onSuccess: () =>
          toast.success(
            t(
              newStatus === "fulfilled"
                ? "caseDocuments.review.checkedSuccess"
                : "caseDocuments.review.rejectedSuccess"
            )
          ),
        onError: err => showApiError(err, t),
      }
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={review.isPending}
        onClick={() => run("fulfilled")}
        aria-label={t("caseDocuments.review.check", {
          requirement: requirementLabel,
        })}
        data-testid={`case-documents-check-${requirementDefinitionId}`}
      >
        <Check size={14} />
        {t("caseDocuments.review.checkLabel")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={review.isPending}
        onClick={() => run("rejected")}
        aria-label={t("caseDocuments.review.reject", {
          requirement: requirementLabel,
        })}
        data-testid={`case-documents-reject-${requirementDefinitionId}`}
      >
        <X size={14} />
        {t("caseDocuments.review.rejectLabel")}
      </Button>
    </div>
  )
}

export { CaseDocumentReviewActions }
