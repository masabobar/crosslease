import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  DetailRow,
  DetailSection,
} from "@/features/productTemplates/components/ProductTemplateDetailPrimitives"
import { ProductTemplatePublishedActions } from "@/features/productTemplates/components/ProductTemplatePublishedActions"
import { useTemplateVersionDetail } from "@/features/productTemplates/hooks/useTemplateVersionDetail"
import { resolveApiErrorMessage } from "@/features/productTemplates/utils"
import { TemplateStatusSchema } from "@/features/productTemplates/api/schema"
import type {
  TemplateCurrentVersionSummary,
  TemplateVersionDetail,
} from "@/features/productTemplates/api/schema"
import {
  productTemplateDetail,
  productTemplateVersionHistory,
} from "@/router/paths"

type ProductTemplateDetailDrawerProps = {
  templateId: string | null
  currentVersion: TemplateCurrentVersionSummary | null
  canManageDraft: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Key information only, per CR-BPT-06 on PRD1042-1798: the panel is a preview, and the full field
// set lives on ProductTemplateDetailPage behind the link in the header.
//
// WHICH fields count as "key" is an interpretation — there is no Figma frame for a slim drawer, only
// the original full-height 500 × 1916 one (see the provenance note on ProductTemplateDetailPage).
// The choice here is identity plus the two fields that identify what the product *is* (financing
// type, legal structure) plus validity, since those are what a reader scanning the list needs to
// tell two templates apart. Everything else — the rest of the behavioural settings, eligibility and
// metadata — is on the page.
//
// Orchestration linkage and the created-by/updated-by/updated-at/tenant metadata remain omitted
// rather than stubbed, because the backend does not expose them (open-questions Q-028).
function DetailBody({ detail }: { detail: TemplateVersionDetail }) {
  const { t } = useTranslation("productTemplates")

  return (
    <div className="flex flex-col px-4">
      <DetailSection title={t("sections.identity")}>
        <DetailRow
          label={t("fields.templateName")}
          value={detail.template_name}
        />
        <DetailRow
          label={t("fields.templateDescription")}
          value={detail.template_description || "—"}
        />
      </DetailSection>

      <DetailSection title={t("sections.behavioralSettings")}>
        <DetailRow
          label={t("fields.refinancingForm")}
          value={t(
            `refinancingForms.${detail.refinancing_form}` as "refinancingForms.annuity"
          )}
        />
        <DetailRow
          label={t("fields.legalStructure")}
          value={t(
            `legalStructures.${detail.legal_structure}` as "legalStructures.loan_credit"
          )}
        />
        {/* Counts as key information since CR-BPT-02 put the refinancing rate on the
            product: two templates sharing a refinancing form and legal structure are now
            told apart precisely by their rate, which is what this panel exists to do. */}
        <DetailRow
          label={t("fields.effectiveRate")}
          value={
            detail.effective_rate !== undefined &&
            detail.effective_rate !== null
              ? `${detail.effective_rate}%`
              : "—"
          }
        />
      </DetailSection>

      <DetailSection title={t("sections.validity")}>
        <DetailRow
          label={t("fields.validFrom")}
          value={detail.valid_from || "—"}
        />
        <DetailRow
          label={t("fields.validUntil")}
          value={detail.valid_until || t("fields.openEnded")}
        />
      </DetailSection>
    </div>
  )
}

export function ProductTemplateDetailDrawer({
  templateId,
  currentVersion,
  canManageDraft,
  open,
  onOpenChange,
}: ProductTemplateDetailDrawerProps) {
  const { t } = useTranslation("productTemplates")
  const versionNumber = currentVersion?.version_number ?? null

  const { data, isLoading, isError, error } = useTemplateVersionDetail(
    templateId ?? "",
    versionNumber
  )

  const isActive = data?.version_status === TemplateStatusSchema.enum.effective
  const isDraft = data?.version_status === TemplateStatusSchema.enum.draft

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
        data-testid="product-template-detail-drawer"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>{data?.template_name ?? t("detail.title")}</SheetTitle>
          <SheetDescription>
            {data
              ? `${data.version_number} · ${t(`versionStatuses.${data.version_status}` as "versionStatuses.draft")}`
              : t("detail.subtitle")}
          </SheetDescription>
          {templateId && (
            <div className="mt-1 flex flex-col items-start gap-1">
              {/* CR-BPT-06's link through to the full field set. Only rendered when a version
                  exists, because the detail page is version-scoped and has nothing to fetch
                  without one — the same reason DetailBody is gated below. */}
              {versionNumber && (
                <Link
                  to={productTemplateDetail(templateId, versionNumber)}
                  data-testid="drawer-view-full-detail"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {t("detail.viewFullDetail")}
                  <ExternalLink size={14} />
                </Link>
              )}
              <Link
                to={productTemplateVersionHistory(templateId)}
                data-testid="drawer-view-version-history"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("detail.viewVersionHistory")}
                <ExternalLink size={14} />
              </Link>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {!versionNumber && (
            <p className="px-4 text-sm text-muted-foreground">
              {t("detail.noPublishedVersion")}
            </p>
          )}
          {versionNumber && isLoading && (
            <p className="px-4 text-sm text-muted-foreground">
              {t("detail.loading")}
            </p>
          )}
          {versionNumber && isError && (
            <p
              data-testid="drawer-error"
              className="px-4 text-sm text-destructive"
            >
              {resolveApiErrorMessage(error, t)}
            </p>
          )}
          {data && <DetailBody detail={data} />}
        </div>

        {data && (isActive || isDraft) && canManageDraft && templateId && (
          <SheetFooter className="border-t border-border">
            <ProductTemplatePublishedActions
              templateId={templateId}
              versionNumber={data.version_number}
              isDraft={isDraft}
            />
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
