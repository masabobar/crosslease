import { Controller } from "react-hook-form"
import type { Control, FieldErrors } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectField } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  StateTransitionOutcomeSchema,
  TaskTypeSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type { TaskFormValues } from "@/features/workflowTaskCatalog/taskFormSchema"

// PRD1042-1894 Block 5 — a task type's own parameters. Three of the seven types carry them, and
// `_activation_blockers` refuses the whole catalogue when they are absent:
//
//   generate         → generated_document_ref + trigger_event
//   state_transition → permitted_outcomes + lifecycle_entity
//   capture          → capture_section_name (optional; not an activation blocker)
//
// Upload's parameter is `doc_requirement_ref`, which has its own fieldset (US 15.7), so it is not
// repeated here. The types that close on their own action with nothing to configure — checkbox,
// calculation, external_handover — render no parameters at all.
//
// Rendered per selected type rather than all at once: a field that does not apply to the chosen
// type is not an empty input, it is a question the type never asks. The which-types predicate lives
// in constants.ts — a component file may only export components (react-refresh).

type Props = {
  control: Control<TaskFormValues>
  errors: FieldErrors<TaskFormValues>
  taskType: string
  // The tenant's document requirements, already loaded for the linkage fieldset. A generate task's
  // document is the same registry: the backend stores the ref without resolving it, and the DRC is
  // the only document registry that exists (the document-type registry, PRD1042-1794 Block 10, is
  // not built). The requested/generated origin match is not enforced yet either.
  documentOptions: { value: string; label: string }[]
  isDocumentsLoading: boolean
  isDocumentsError: boolean
  resolveMessage: (message: string | undefined) => string | undefined
}

export function TaskTypeParameterFields({
  control,
  errors,
  taskType,
  documentOptions,
  isDocumentsLoading,
  isDocumentsError,
  resolveMessage,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  const isGenerate = taskType === TaskTypeSchema.enum.generated_document
  const isStateTransition = taskType === TaskTypeSchema.enum.state_transition
  const isCapture = taskType === TaskTypeSchema.enum.field_capture

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
        {t("detail.taskSheet.sections.typeParameters")}
      </p>

      {isGenerate && (
        <>
          <div>
            <Label
              className="mb-2"
              error={!!errors.generated_document_ref}
              htmlFor="task-sheet-generated-document"
            >
              {t("detail.taskSheet.fields.generatedDocument")}
            </Label>
            {isDocumentsError ? (
              <p
                className="text-sm text-destructive"
                data-testid="task-sheet-generated-document-error"
              >
                {t("detail.taskSheet.documentRequirementsUnavailable")}
              </p>
            ) : isDocumentsLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Controller
                control={control}
                name="generated_document_ref"
                render={({ field }) => (
                  <SelectField
                    id="task-sheet-generated-document"
                    data-testid="task-sheet-generated-document"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={documentOptions}
                    placeholder={t("detail.taskSheet.notSet")}
                    error={!!errors.generated_document_ref}
                  />
                )}
              />
            )}
            {errors.generated_document_ref && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.generated_document_ref.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              className="mb-2"
              error={!!errors.trigger_event}
              htmlFor="task-sheet-trigger-event"
            >
              {t("detail.taskSheet.fields.triggerEvent")}
            </Label>
            <Controller
              control={control}
              name="trigger_event"
              render={({ field }) => (
                <Input
                  id="task-sheet-trigger-event"
                  data-testid="task-sheet-trigger-event"
                  maxLength={50}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("detail.taskSheet.triggerEventPlaceholder")}
                />
              )}
            />
            {errors.trigger_event && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.trigger_event.message)}
              </p>
            )}
          </div>
        </>
      )}

      {isStateTransition && (
        <>
          <div>
            <Label className="mb-2" error={!!errors.permitted_outcomes}>
              {t("detail.taskSheet.fields.permittedOutcomes")}
            </Label>
            <Controller
              control={control}
              name="permitted_outcomes"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-input p-2.5">
                  {StateTransitionOutcomeSchema.options.map(option => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        data-testid={`task-sheet-permitted-outcome-${option}`}
                        checked={field.value.includes(option)}
                        onCheckedChange={checked =>
                          field.onChange(
                            checked === true
                              ? [...field.value, option]
                              : field.value.filter(v => v !== option)
                          )
                        }
                      />
                      <span className="text-sm text-foreground">
                        {t(
                          `detail.taskSheet.stateTransitionOutcomes.${option}`
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.permitted_outcomes && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.permitted_outcomes.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              className="mb-2"
              error={!!errors.lifecycle_entity}
              htmlFor="task-sheet-lifecycle-entity"
            >
              {t("detail.taskSheet.fields.lifecycleEntity")}
            </Label>
            <Controller
              control={control}
              name="lifecycle_entity"
              render={({ field }) => (
                <Input
                  id="task-sheet-lifecycle-entity"
                  data-testid="task-sheet-lifecycle-entity"
                  maxLength={50}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("detail.taskSheet.lifecycleEntityPlaceholder")}
                />
              )}
            />
            {errors.lifecycle_entity && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.lifecycle_entity.message)}
              </p>
            )}
          </div>
        </>
      )}

      {isCapture && (
        <div>
          {/* Optional, and not an activation blocker: PRD1042-1892 item 12 makes a capture step a
              jump target into the case form, and the section name is the target. */}
          <Label
            className="mb-2"
            error={!!errors.capture_section_name}
            htmlFor="task-sheet-capture-section"
          >
            {t("detail.taskSheet.fields.captureSectionName")}
          </Label>
          <Controller
            control={control}
            name="capture_section_name"
            render={({ field }) => (
              <Input
                id="task-sheet-capture-section"
                data-testid="task-sheet-capture-section"
                maxLength={100}
                value={field.value}
                onChange={field.onChange}
                placeholder={t("detail.taskSheet.captureSectionPlaceholder")}
              />
            )}
          />
          {errors.capture_section_name && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMessage(errors.capture_section_name.message)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
