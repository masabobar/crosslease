import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { SourceLayerSchema } from "@/features/documentRequirements/api/schema"
import type { RequirementResponse } from "@/features/documentRequirements/api/schema"

type Props = {
  requirements: RequirementResponse[]
}

// Read-only grouping of this catalog's own requirements by their self-declared source_layer.
// Not a diff against a Default catalog — no such comparison exists on the backend (see
// open-questions.md Q-061); this shows exactly what US 16.20's field spec asks for ("source-layer
// attribution per requirement") and nothing more.
function DocumentRequirementCatalogSourceLayerTab({ requirements }: Props) {
  const { t } = useTranslation("documentRequirements")

  const groups = SourceLayerSchema.options.map(layer => ({
    layer,
    items: requirements.filter(r => r.source_layer === layer),
  }))

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="document-requirement-catalog-source-layer-tab"
    >
      {groups.map(group => (
        <div
          key={group.layer}
          className="rounded-lg border border-border p-4"
          data-testid={`source-layer-group-${group.layer}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">
              {t(
                `requirement.sourceLayers.${group.layer}` as "requirement.sourceLayers.default"
              )}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {group.items.length}
            </span>
          </div>
          {group.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("sourceLayer.emptyGroup")}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {group.items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">
                    {item.document_type_name}
                  </span>
                  <span className="text-muted-foreground">
                    {item.requirement_code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export { DocumentRequirementCatalogSourceLayerTab }
