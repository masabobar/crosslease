import { useTranslation } from "react-i18next"
import { File, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { DetailRow } from "@/components/shared/DetailRow"
import { useFieldRegistry } from "@/features/workflowTaskCatalog/hooks/useFieldRegistry"
import type {
  CatalogLayer,
  TaskDefinitionItem,
} from "@/features/workflowTaskCatalog/api/schema"
import type { DocumentRequirement } from "@/features/documentRequirements/api/schema"

// The read-only half of TaskDefinitionSheet. Split out of it because the sheet held the
// view branch and the authoring form in one ~850-line component; the two share only the
// task being looked at, and the form's react-hook-form state has no bearing here.
type Props = {
  task: TaskDefinitionItem
  catalogLayer: CatalogLayer
  // Resolved by the parent from the tenant's requirements; undefined when the linked
  // requirement is not in scope, in which case the raw ref renders instead.
  linkedRequirement: DocumentRequirement | undefined
  // Both resolve a bare UUID to something readable, and both fall back to the id: a document
  // check and a four-eyes exclusion carry nothing else on the wire.
  resolveDocumentCode: (ref: string) => string
  resolveTaskName: (taskId: string) => string
  canEdit: boolean
  isPending: boolean
  onClose: () => void
  onRemove: () => void
  onRequestEdit: () => void
}

function TaskDefinitionViewPanel({
  task,
  catalogLayer,
  linkedRequirement,
  resolveDocumentCode,
  resolveTaskName,
  canEdit,
  isPending,
  onClose,
  onRemove,
  onRequestEdit,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const notApplicable = t("detail.taskDefinitions.notApplicable")
  // Only fetched for a task that actually has rules to name — see the hook's own note.
  const { data: fieldRegistry } = useFieldRegistry(
    task.condition_rows.length > 0
  )

  function mandatoryLabel(isMandatory: boolean | null): string {
    if (isMandatory === null) return notApplicable
    return t(
      isMandatory
        ? "detail.taskSheet.mandatoryOptions.yes"
        : "detail.taskSheet.mandatoryOptions.no"
    )
  }

  function booleanLabel(value: boolean): string {
    return t(value ? "detail.taskSheet.yes" : "detail.taskSheet.no")
  }

  // The set is what new authoring writes; the singular is all a pre-17-Aug row has. Falling back
  // to it is why a historical task still shows a role instead of a dash.
  function rolesLabel(
    roles: readonly string[] | null,
    singular: string | null
  ): string {
    if (roles?.length) {
      return roles
        .map(role =>
          t(
            `detail.taskSheet.responsibleRoles.${role}` as "detail.taskSheet.responsibleRoles.front_office"
          )
        )
        .join(", ")
    }
    if (singular) {
      return t(
        `detail.taskSheet.responsibleRoles.${singular}` as "detail.taskSheet.responsibleRoles.front_office"
      )
    }
    return notApplicable
  }

  function fieldLabel(fieldRegistryId: string): string {
    return (
      (fieldRegistry ?? []).find(field => field.id === fieldRegistryId)
        ?.label ?? fieldRegistryId
    )
  }

  return (
    <Sheet open onOpenChange={o => !o && onClose()}>
      <SheetContent data-testid="task-definition-view-sheet">
        <SheetHeader>
          <SheetTitle>
            {task.task_name ?? task.inherited?.task_name ?? task.id}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {/* Server-assigned and stable, and the number the bank says out loud — so it leads
                the subtitle rather than sitting in a row further down. */}
            {task.task_number !== null && (
              <span className="font-medium text-foreground">
                {t("detail.taskSheet.stepNumber", { number: task.task_number })}
              </span>
            )}
            <span>{task.task_code ?? task.inherited?.task_code ?? "—"}</span>
            <Badge variant="outline">
              {t(`catalogLayers.${catalogLayer}`)}
            </Badge>
            <Badge variant="secondary">
              {t(`detail.taskDefinitions.types.${task.layer_action}`)}
            </Badge>
            {task.four_eyes && (
              <Badge variant="outline" className="gap-1">
                <ShieldCheck size={12} />
                {t("detail.taskDefinitions.fourEyesBadge")}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 overflow-y-auto">
          {task.task_description && (
            <p className="text-sm text-foreground">{task.task_description}</p>
          )}

          <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("detail.taskSheet.sections.behaviorAndGating")}
            </p>
            <DetailRow
              label={t("detail.taskSheet.fields.mandatory")}
              variant="emphasized"
            >
              {mandatoryLabel(task.is_mandatory)}
            </DetailRow>
            <DetailRow
              label={t("detail.taskSheet.fields.weight")}
              variant="emphasized"
            >
              {task.weight ?? notApplicable}
            </DetailRow>
            <DetailRow
              label={t("detail.taskSheet.fields.displayOrder")}
              variant="emphasized"
            >
              {task.display_order ?? notApplicable}
            </DetailRow>
            <DetailRow
              label={t("detail.taskSheet.fields.responsibleRoles")}
              variant="emphasized"
            >
              {rolesLabel(task.responsible_roles, task.responsible_role)}
            </DetailRow>
            <DetailRow
              label={t("detail.taskSheet.fields.applicability")}
              variant="emphasized"
            >
              {task.applicability
                ? t(
                    `detail.taskSheet.applicabilities.${task.applicability}` as "detail.taskSheet.applicabilities.always"
                  )
                : notApplicable}
            </DetailRow>
            {task.conditional_trigger && (
              <DetailRow
                label={t("detail.taskSheet.fields.conditionalTrigger")}
                variant="emphasized"
              >
                {t("detail.taskSheet.treasuryThresholdTrigger")}
              </DetailRow>
            )}
          </div>

          {/* US 15.7. The design shows the code in primary blue — i.e. as a link to the
              Document Requirement Catalog — but Epic 16 has no screen to navigate to, so it
              renders as plain text. Restore the link, don't restyle it, once E16 ships a route. */}
          {task.doc_requirement_ref && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {t("detail.taskSheet.sections.documentLinkage")}
              </p>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-1 text-foreground">
                  <File size={16} className="text-muted-foreground" />
                  {linkedRequirement?.requirement_code ??
                    task.doc_requirement_ref}
                </span>
                <span className="text-muted-foreground">
                  {task.doc_requirement_pin_mode
                    ? t(
                        `detail.taskSheet.pinModes.${task.doc_requirement_pin_mode}` as "detail.taskSheet.pinModes.pin_by_id"
                      )
                    : notApplicable}
                </span>
              </div>
              {linkedRequirement && (
                <p className="text-xs text-muted-foreground">
                  {linkedRequirement.document_type_name}
                </p>
              )}
            </div>
          )}

          {/* PRD1042-1894 Block 3 — the flag alone does not say who is excluded, so the set is
              shown with it. `wide` and a specific list compose: both can be in force at once. */}
          {(task.four_eyes ||
            task.four_eyes_exclusion_wide ||
            task.exclusion_task_ids.length > 0) && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {t("detail.taskSheet.sections.fourEyes")}
              </p>
              <DetailRow
                label={t("detail.taskSheet.fields.fourEyes")}
                variant="emphasized"
              >
                {booleanLabel(task.four_eyes)}
              </DetailRow>
              <DetailRow
                label={t("detail.taskSheet.fields.fourEyesExclusionWide")}
                variant="emphasized"
              >
                {booleanLabel(task.four_eyes_exclusion_wide)}
              </DetailRow>
              {task.exclusion_task_ids.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">
                    {t("detail.taskSheet.fields.exclusionTasks")}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {task.exclusion_task_ids.map(excludedId => (
                      <li key={excludedId} className="text-sm text-foreground">
                        {resolveTaskName(excludedId)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* PRD1042-1894 — the ordered documents a typed_upload task asks the worker to check
              off. Read-only: the service writes these through its own path and this app has no
              picker for them (the runtime marks live on the case item, not here). */}
          {task.document_checks.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {t("detail.taskSheet.sections.documentChecks")}
              </p>
              <ol className="flex flex-col gap-1">
                {[...task.document_checks]
                  .sort((a, b) => a.position - b.position)
                  .map(check => (
                    <li
                      key={`${check.document_ref}-${check.position}`}
                      className="flex items-center gap-1 text-sm text-foreground"
                    >
                      <File size={16} className="text-muted-foreground" />
                      {resolveDocumentCode(check.document_ref)}
                    </li>
                  ))}
              </ol>
            </div>
          )}

          {/* The rules behind `applicability: rule`. The field name comes from the field
              registry; until that request settles the id renders, which is still better than an
              empty rule. */}
          {task.condition_rows.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {t("detail.taskSheet.sections.conditions")}
              </p>
              <ul className="flex flex-col gap-1">
                {task.condition_rows.map((row, index) => (
                  <li
                    key={`${row.field_registry_id}-${index}`}
                    className="text-sm text-foreground"
                  >
                    <span className="font-medium">
                      {fieldLabel(row.field_registry_id)}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {t(
                        `detail.taskSheet.conditionOperators.${row.operator}` as "detail.taskSheet.conditionOperators.is"
                      )}
                    </span>{" "}
                    {row.value_raw ?? row.value_config_ref ?? notApplicable}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* US 15.23: an override row must show the Global Default values it replaces. */}
          {task.inherited && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {t("detail.taskSheet.sections.inheritedFromGlobalDefault")}
              </p>
              <DetailRow
                label={t("detail.taskSheet.fields.taskName")}
                variant="emphasized"
              >
                {task.inherited.task_name ?? notApplicable}
              </DetailRow>
              <DetailRow
                label={t("detail.taskSheet.fields.mandatory")}
                variant="emphasized"
              >
                {mandatoryLabel(task.inherited.is_mandatory)}
              </DetailRow>
              <DetailRow
                label={t("detail.taskSheet.fields.weight")}
                variant="emphasized"
              >
                {task.inherited.weight ?? notApplicable}
              </DetailRow>
              {/* The parent's role set — the value an override is most often made to change, and
                  until now the one inherited value the panel could not show. */}
              <DetailRow
                label={t("detail.taskSheet.fields.responsibleRoles")}
                variant="emphasized"
              >
                {rolesLabel(
                  task.inherited.responsible_roles,
                  task.inherited.responsible_role
                )}
              </DetailRow>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            data-testid="task-sheet-close"
            onClick={onClose}
          >
            {t("detail.taskSheet.closeButton")}
          </Button>
          {canEdit && (
            <>
              <Button
                type="button"
                variant="destructive"
                data-testid="task-sheet-remove"
                disabled={isPending}
                onClick={onRemove}
              >
                {t("detail.taskSheet.removeButton")}
              </Button>
              <Button
                type="button"
                data-testid="task-sheet-edit"
                onClick={onRequestEdit}
              >
                {t("detail.taskSheet.editButton")}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { TaskDefinitionViewPanel }
