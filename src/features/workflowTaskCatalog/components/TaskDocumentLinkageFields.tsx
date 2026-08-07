import { Controller } from "react-hook-form"
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DocRequirementPinModeSchema } from "@/features/workflowTaskCatalog/api/schema"
import type { TaskFormValues } from "@/features/workflowTaskCatalog/taskFormSchema"

// Wire values, taken from the schema rather than hand-listed.
const PIN_MODE_OPTIONS = DocRequirementPinModeSchema.options

// US 15.7's document-linkage fieldset, split out of TaskDefinitionSheet's form. Kept as a
// controlled fieldset over the parent's form rather than its own form: ref and pin mode are
// cross-validated against each other in the parent's schema, so they cannot own separate state.
type Props = {
  control: Control<TaskFormValues>
  errors: FieldErrors<TaskFormValues>
  setValue: UseFormSetValue<TaskFormValues>
  options: { value: string; label: string }[]
  isLoading: boolean
  isError: boolean
  // Current value of doc_requirement_ref — the pin-mode select stays inert until a ref exists.
  selectedRef: string
}

function TaskDocumentLinkageFields({
  control,
  errors,
  setValue,
  options,
  isLoading,
  isError,
  selectedRef,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
        {t("detail.taskSheet.sections.documentLinkage")}
      </p>

      {isError ? (
        <p
          data-testid="task-sheet-doc-requirements-error"
          className="text-sm text-destructive"
        >
          {t("detail.taskSheet.documentRequirementsUnavailable")}
        </p>
      ) : isLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : options.length === 0 ? (
        <p
          data-testid="task-sheet-no-doc-requirements"
          className="text-sm text-muted-foreground"
        >
          {t("detail.taskSheet.noDocumentRequirements")}
        </p>
      ) : (
        <>
          <div>
            <Label className="mb-2" htmlFor="task-sheet-doc-ref">
              {t("detail.taskSheet.fields.documentRequirement")}
            </Label>
            <Controller
              control={control}
              name="doc_requirement_ref"
              render={({ field }) => (
                <SelectField
                  id="task-sheet-doc-ref"
                  data-testid="task-sheet-doc-ref-select"
                  value={field.value}
                  // Clearing the ref clears the pin mode with it — the BE rejects a
                  // pin mode without a ref just as it rejects the reverse.
                  onValueChange={value => {
                    field.onChange(value)
                    if (!value) setValue("doc_requirement_pin_mode", "")
                  }}
                  options={options}
                  placeholder={t("detail.taskSheet.documentRequirementNone")}
                />
              )}
            />
          </div>

          <div>
            <Label
              className="mb-2"
              error={!!errors.doc_requirement_pin_mode}
              htmlFor="task-sheet-pin-mode"
            >
              {t("detail.taskSheet.fields.pinningBehavior")}
            </Label>
            <Controller
              control={control}
              name="doc_requirement_pin_mode"
              render={({ field }) => (
                <SelectField
                  id="task-sheet-pin-mode"
                  data-testid="task-sheet-pin-mode-select"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={PIN_MODE_OPTIONS.map(option => ({
                    value: option,
                    label: t(
                      `detail.taskSheet.pinModes.${option}` as "detail.taskSheet.pinModes.pin_by_id"
                    ),
                  }))}
                  placeholder={t("detail.taskSheet.fields.pinningBehavior")}
                  error={!!errors.doc_requirement_pin_mode}
                  // Mandatory only once a ref is chosen (field spec: C), so it stays
                  // inert until there is something to pin.
                  disabled={!selectedRef}
                />
              )}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("detail.taskSheet.pinningBehaviorHint")}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export { TaskDocumentLinkageFields }
