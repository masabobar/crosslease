import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SelectField } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useDocumentRequirementCatalogPreview } from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogPreview"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

type Props = {
  catalogId: string
  // Only the catalog's own contexts are offered — previewing one it doesn't apply to always
  // returns an empty set, per list_active_for_context's own filter.
  applicableProcessContexts: string[]
}

// US 16.21, scoped to what the backend actually does (see open-questions.md Q-061):
// MaterializationService.preview() filters this ONE catalog's own active rows by process
// context — it does not merge a Product-Specific catalog with any Default catalog. Framed here
// as exactly that, not as a cross-catalog effective-set comparison.
function DocumentRequirementCatalogPreviewPanel({
  catalogId,
  applicableProcessContexts,
}: Props) {
  const { t } = useTranslation("documentRequirements")
  const [selectedContext, setSelectedContext] = useState("")
  const [hasRequestedPreview, setHasRequestedPreview] = useState(false)

  const { data, isLoading, isError, error } =
    useDocumentRequirementCatalogPreview(
      catalogId,
      selectedContext,
      hasRequestedPreview
    )

  const contextOptions = applicableProcessContexts.map(value => ({
    value,
    label: t(`processContexts.${value}` as "processContexts.financing", {
      defaultValue: value,
    }),
  }))

  return (
    <div
      className="rounded-lg border border-border p-4"
      data-testid="document-requirement-catalog-preview-panel"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">
            {t("preview.title")}
          </h3>
          <Badge variant="outline">{t("preview.diagnosticBadge")}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SelectField
          data-testid="preview-process-context-select"
          value={selectedContext}
          onValueChange={v => {
            setSelectedContext(v)
            setHasRequestedPreview(false)
          }}
          options={contextOptions}
          placeholder={t("preview.selectProcessContext")}
          className="w-56"
        />
        <Button
          data-testid="preview-trigger-button"
          variant="outline"
          disabled={!selectedContext}
          onClick={() => setHasRequestedPreview(true)}
        >
          <Search size={16} />
          {t("preview.previewButton")}
        </Button>
      </div>

      {hasRequestedPreview && isError && (
        <p
          data-testid="preview-error"
          className="mt-3 text-sm text-destructive"
        >
          {resolveApiErrorMessage(error, t)}
        </p>
      )}

      {hasRequestedPreview && !isError && !isLoading && data && (
        <div className="mt-3 flex flex-col gap-2" data-testid="preview-results">
          {data.effective_requirements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("preview.emptyState")}
            </p>
          ) : (
            data.effective_requirements.map(req => (
              <div
                key={req.requirement_definition_id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                data-testid={`preview-row-${req.requirement_definition_id}`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {req.document_type_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {req.requirement_code}
                  </p>
                </div>
                <Badge variant="secondary">
                  {t(
                    `requirement.sourceLayers.${req.source_layer}` as "requirement.sourceLayers.default"
                  )}
                </Badge>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export { DocumentRequirementCatalogPreviewPanel }
