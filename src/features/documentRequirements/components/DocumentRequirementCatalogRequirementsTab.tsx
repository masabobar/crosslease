import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api"
import { useDeactivateRequirement } from "@/features/documentRequirements/hooks/useDeactivateRequirement"
import { RequirementTable } from "@/features/documentRequirements/components/RequirementTable"
import { RequirementSheet } from "@/features/documentRequirements/components/RequirementSheet"
import { DocumentRequirementCatalogPreviewPanel } from "@/features/documentRequirements/components/DocumentRequirementCatalogPreviewPanel"
import type {
  DocumentRequirementCatalogDetailResponse,
  RequirementResponse,
} from "@/features/documentRequirements/api/schema"

type SheetState =
  | { mode: "add" }
  | { mode: "edit" | "view"; requirement: RequirementResponse }
  | null

type Props = {
  catalog: DocumentRequirementCatalogDetailResponse
  canManage: boolean
}

function DocumentRequirementCatalogRequirementsTab({
  catalog,
  canManage,
}: Props) {
  const { t } = useTranslation("documentRequirements")
  const [showInactive, setShowInactive] = useState(false)
  const [sheetState, setSheetState] = useState<SheetState>(null)
  const deactivateRequirement = useDeactivateRequirement(catalog.id)

  const requirements = showInactive
    ? catalog.requirements
    : catalog.requirements.filter(r => r.is_active)

  function handleDeactivate(requirement: RequirementResponse) {
    deactivateRequirement.mutate(requirement.id, {
      onSuccess: () => {
        toast.success(t("requirement.deactivateSuccess"))
      },
      onError: err => {
        toast.error(
          err instanceof ApiError
            ? t(`errors.${err.code}` as "errors.generic", {
                defaultValue: t("errors.generic"),
              })
            : t("errors.generic")
        )
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="show-inactive-requirements"
            checked={showInactive}
            onCheckedChange={setShowInactive}
            data-testid="show-inactive-requirements-switch"
          />
          <Label htmlFor="show-inactive-requirements">
            {t("requirement.showInactive")}
          </Label>
        </div>
        {canManage && (
          <Button
            data-testid="add-requirement-button"
            onClick={() => setSheetState({ mode: "add" })}
          >
            <Plus size={16} />
            {t("requirement.addButton")}
          </Button>
        )}
      </div>

      <RequirementTable
        requirements={requirements}
        hasActiveFilters={showInactive}
        canManage={canManage}
        onRowClick={requirement => setSheetState({ mode: "view", requirement })}
        onEdit={requirement => setSheetState({ mode: "edit", requirement })}
        onDeactivate={handleDeactivate}
      />

      <DocumentRequirementCatalogPreviewPanel
        catalogId={catalog.id}
        applicableProcessContexts={catalog.applicable_process_contexts}
      />

      {sheetState && (
        <RequirementSheet
          catalogId={catalog.id}
          catalogType={catalog.catalog_type}
          mode={sheetState.mode}
          requirement={
            sheetState.mode === "add" ? undefined : sheetState.requirement
          }
          onOpenChange={open => !open && setSheetState(null)}
        />
      )}
    </div>
  )
}

export { DocumentRequirementCatalogRequirementsTab }
