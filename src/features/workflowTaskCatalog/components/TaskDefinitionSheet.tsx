import { useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskDefinitionViewPanel } from "@/features/workflowTaskCatalog/components/TaskDefinitionViewPanel"
import { TaskDocumentLinkageFields } from "@/features/workflowTaskCatalog/components/TaskDocumentLinkageFields"
import { TaskTypeParameterFields } from "@/features/workflowTaskCatalog/components/TaskTypeParameterFields"
import {
  PARENT_BACKED_ACTIONS,
  taskFormSchema,
} from "@/features/workflowTaskCatalog/taskFormSchema"
import type { TaskFormValues } from "@/features/workflowTaskCatalog/taskFormSchema"
import { SelectField } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { cn } from "@/lib/utils"
import { useGlobalDefaultTasks } from "@/features/workflowTaskCatalog/hooks/useGlobalDefaultTasks"
import { useTenantDocumentRequirements } from "@/features/documentRequirements/hooks/useTenantDocumentRequirements"
import { useAddCatalogTask } from "@/features/workflowTaskCatalog/hooks/useAddCatalogTask"
import { useUpdateCatalogTask } from "@/features/workflowTaskCatalog/hooks/useUpdateCatalogTask"
import { useRemoveCatalogTask } from "@/features/workflowTaskCatalog/hooks/useRemoveCatalogTask"
import { useCatalogPhases } from "@/features/workflowTaskCatalog/hooks/useCatalogPhases"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import {
  PRODUCT_SPECIFIC_TASK_TYPE_OPTIONS,
  TASK_APPLICABILITY_OPTIONS,
  TASK_CATEGORY_OPTIONS,
  STEP_RESPONSIBLE_ROLE_OPTIONS,
  taskTypeHasParameters,
  TASK_STAGE_OPTIONS,
  TASK_TYPE_OPTIONS,
} from "@/features/workflowTaskCatalog/constants"
import {
  CatalogLayerSchema,
  ConditionalTriggerSchema,
  LayerActionSchema,
  StepResponsibleRoleSchema,
  TaskProcessContextSchema,
  TaskTypeSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type {
  AddTaskRequest,
  CatalogEntityType,
  CatalogLayer,
  LayerAction,
  StepResponsibleRole,
  TaskDefinitionItem,
  UpdateTaskRequest,
} from "@/features/workflowTaskCatalog/api/schema"

type SheetMode = "view" | "edit" | "add"

// US 15.7. Document linkage is authorable on three of the four change types — including override,
// which may set its own linkage even though it inherits everything else. Note this is the OPPOSITE
// of conditional_trigger, which override inherits and must not author
// (`task_service._OVERRIDE_FORBIDDEN_ON_UPDATE`). Deactivate takes the parent and nothing else.
// The roles a write may carry, as a set for the O(1) membership test toFormValues needs. Derived
// from the schema so it cannot drift from what the BE accepts.
const AUTHORABLE_STEP_ROLES = new Set<StepResponsibleRole>(
  StepResponsibleRoleSchema.options
)

const DOC_LINKABLE_ACTIONS: readonly LayerAction[] = [
  LayerActionSchema.enum.defined,
  LayerActionSchema.enum.supplement,
  LayerActionSchema.enum.override,
]

function toFormValues(
  task: TaskDefinitionItem | null,
  defaultAction: LayerAction
): TaskFormValues {
  return {
    layer_action: task?.layer_action ?? defaultAction,
    parent_task_id: task?.parent_task_id ?? "",
    task_code: task?.task_code ?? "",
    task_name: task?.task_name ?? "",
    task_description: task?.task_description ?? "",
    category: task?.category ?? "",
    task_type: task?.task_type ?? "",
    phase_id: task?.phase_id ?? "",
    generated_document_ref: task?.generated_document_ref ?? "",
    trigger_event: task?.trigger_event ?? "",
    permitted_outcomes: task?.permitted_outcomes ?? [],
    lifecycle_entity: task?.lifecycle_entity ?? "",
    capture_section_name: task?.capture_section_name ?? "",
    // Narrowed to the authorable set on the way IN: the read schema follows the wire
    // (`list[UserRole]`), while this multi-select offers only front_office / back_office because
    // that is all `_validate_step_roles` accepts on a write. A stored row carrying anything else
    // therefore cannot be represented here — it is dropped rather than shown as an unselectable
    // value, and the form's own "at least one role" rule then makes the author pick. Sending it
    // back untouched would 422, so silently preserving it is not an option either.
    responsible_roles: (task?.responsible_roles ?? []).filter(
      (role): role is StepResponsibleRole =>
        AUTHORABLE_STEP_ROLES.has(role as StepResponsibleRole)
    ),
    weight: task && task.weight !== null ? String(task.weight) : "",
    display_order:
      task && task.display_order !== null ? String(task.display_order) : "",
    is_mandatory:
      task && task.is_mandatory !== null ? String(task.is_mandatory) : "",
    stage_categorization: task?.stage_categorization ?? "",
    applicable_process_contexts: task?.applicable_process_contexts ?? [],
    is_active: task?.is_active ?? true,
    applicability: task?.applicability ?? "",
    four_eyes: task?.four_eyes ?? false,
    four_eyes_exclusion_wide: task?.four_eyes_exclusion_wide ?? false,
    treasury_threshold_trigger: Boolean(task && task.conditional_trigger),
    doc_requirement_ref: task?.doc_requirement_ref ?? "",
    doc_requirement_pin_mode: task?.doc_requirement_pin_mode ?? "",
  }
}

/**
 * Builds the wire payload for one `layer_action`, and only the keys that action allows.
 *
 * This cannot be a single shared shape: `AddTaskRequest`'s model validator **rejects** a field
 * that the action does not own, not just ignores it. An override that sends `category` fails with
 * "Fields not authorable on Override (inherited from Global Default)", and a deactivate entry
 * accepts nothing but its parent. Empty optionals are omitted rather than nulled, because the BE
 * distinguishes "not provided" from an explicit null (PATCH rejects the latter on a mandatory
 * field with WTC_TASK_MANDATORY_FIELD_NULL).
 */
// PRD1042-1894 Block 5 — the parameters of the selected type, and nothing else. Returned as a
// partial so the caller spreads it: an omitted key is not sent, which is what keeps a generate
// task's trigger event off a checkbox task.
function typeParameterPayload(values: TaskFormValues): Partial<AddTaskRequest> {
  if (values.task_type === TaskTypeSchema.enum.generated_document) {
    return {
      generated_document_ref: values.generated_document_ref,
      trigger_event: values.trigger_event.trim(),
    }
  }
  if (values.task_type === TaskTypeSchema.enum.state_transition) {
    return {
      permitted_outcomes: values.permitted_outcomes,
      lifecycle_entity: values.lifecycle_entity.trim(),
    }
  }
  if (values.task_type === TaskTypeSchema.enum.field_capture) {
    // Optional — omitted rather than sent empty when the author left it blank.
    return values.capture_section_name.trim()
      ? { capture_section_name: values.capture_section_name.trim() }
      : {}
  }
  return {}
}

function toWirePayload(
  values: TaskFormValues
): Omit<AddTaskRequest, "layer_action"> {
  const orUndefined = (value: string): string | undefined =>
    value === "" ? undefined : value
  const weight = values.weight === "" ? undefined : Number(values.weight)
  // US 15.7: the pair travels together or not at all — the BE rejects one without the other.
  const docLinkage = values.doc_requirement_ref
    ? {
        doc_requirement_ref: values.doc_requirement_ref,
        doc_requirement_pin_mode:
          values.doc_requirement_pin_mode as AddTaskRequest["doc_requirement_pin_mode"],
      }
    : {}

  // Deactivate: parent only. Every content field is forbidden.
  if (values.layer_action === LayerActionSchema.enum.deactivated) {
    return {
      parent_task_id: values.parent_task_id,
      is_active: values.is_active,
    }
  }

  // Override: only the six values US 15.4 makes authorable. The rest is inherited from the
  // Global Default parent and must not be sent at all.
  if (values.layer_action === LayerActionSchema.enum.override) {
    return {
      parent_task_id: values.parent_task_id,
      is_mandatory:
        values.is_mandatory === "" ? undefined : values.is_mandatory === "true",
      weight,
      responsible_roles: values.responsible_roles.length
        ? values.responsible_roles
        : undefined,
      display_order:
        values.display_order === "" ? undefined : Number(values.display_order),
      stage_categorization: orUndefined(
        values.stage_categorization
      ) as AddTaskRequest["stage_categorization"],
      is_active: values.is_active,
      // Authorable on an override: neither flag appears in the BE's override-forbidden set, so a
      // product may tighten (or relax) four eyes on a step it inherits. `applicability` is NOT
      // here — that one IS forbidden, and sending it fails the whole request.
      four_eyes: values.four_eyes,
      four_eyes_exclusion_wide: values.four_eyes_exclusion_wide,
      ...docLinkage,
    }
  }

  // defined / supplement: the task owns all of its own values.
  return {
    task_code: values.task_code.trim(),
    task_name: values.task_name.trim(),
    task_description: values.task_description.trim(),
    category: orUndefined(values.category) as AddTaskRequest["category"],
    task_type: orUndefined(values.task_type) as AddTaskRequest["task_type"],
    responsible_roles: values.responsible_roles,
    phase_id: values.phase_id,
    // PRD1042-1894 Block 5 — send only what the chosen type uses. A parameter belonging to another
    // type would be stored against a task that never reads it, and PATCH treats a sent key as an
    // intentional write (see _OVERRIDE_FORBIDDEN_ON_UPDATE for the same reasoning).
    ...typeParameterPayload(values),
    is_mandatory: values.is_mandatory === "true",
    weight,
    display_order: Number(values.display_order),
    stage_categorization: orUndefined(
      values.stage_categorization
    ) as AddTaskRequest["stage_categorization"],
    applicable_process_contexts: values.applicable_process_contexts,
    is_active: values.is_active,
    // Omitted when unset so the service applies its own `always` default, rather than the FE
    // guessing at it — the two would drift the moment the BE changes the default.
    applicability: orUndefined(
      values.applicability
    ) as AddTaskRequest["applicability"],
    four_eyes: values.four_eyes,
    four_eyes_exclusion_wide: values.four_eyes_exclusion_wide,
    conditional_trigger: values.treasury_threshold_trigger
      ? ConditionalTriggerSchema.enum.financing_amount_over_threshold
      : undefined,
    ...docLinkage,
  }
}

type Props = {
  mode: SheetMode
  task: TaskDefinitionItem | null
  catalogId: string
  versionId: string
  catalogLayer: CatalogLayer
  entityType: CatalogEntityType | null
  // US 15.7 — document requirements are tenant-scoped, matching the BE's validation scope.
  tenantId: string
  // Used to hide Global Default parents this catalogue already overrides or deactivates — the
  // BE allows one product-specific entry per parent per version and rejects a second with
  // WTC_TASK_PARENT_CONFLICT.
  existingTasks: TaskDefinitionItem[]
  canEdit: boolean
  // PRD1042-2145 — which change type an `add` opens on, decided by the caller at the moment the
  // sheet opens. Optional because view/edit take the action from the task itself.
  defaultLayerAction?: LayerAction
  onOpenChange: (open: boolean) => void
  onRequestEdit: () => void
}

function TaskDefinitionSheet({
  mode,
  task,
  catalogId,
  versionId,
  catalogLayer,
  entityType,
  tenantId,
  existingTasks,
  canEdit,
  defaultLayerAction,
  onOpenChange,
  onRequestEdit,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const { t: tCommon } = useTranslation("common")
  const isGlobalDefaultLayer =
    catalogLayer === CatalogLayerSchema.enum.global_default
  // A caller that has resolved a completable action wins; without one, fall back to the layer's
  // nominal default. See the tab's resolveDefaultLayerAction for why `override` is not always safe.
  const defaultAction: LayerAction =
    defaultLayerAction ??
    (isGlobalDefaultLayer
      ? LayerActionSchema.enum.defined
      : LayerActionSchema.enum.override)

  const addTask = useAddCatalogTask()
  const updateTask = useUpdateCatalogTask()
  const removeTask = useRemoveCatalogTask()
  // PRD1042-1892 item 2 — the stage options are this catalogue version's own, not a platform list.
  const { data: phases = [] } = useCatalogPhases(catalogId, versionId)
  const {
    data: globalDefaultTasks,
    isError: isParentLoadError,
    isPending: isParentLoading,
  } = useGlobalDefaultTasks(isGlobalDefaultLayer ? null : entityType)
  const {
    data: documentRequirements,
    isError: isDocRequirementsQueryError,
    isPending: isDocRequirementsLoading,
  } = useTenantDocumentRequirements(tenantId)

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    // defaultValues, NOT values: `values` re-syncs the form from the outside on every render, so
    // any re-render mid-edit (a settling query, a toast) silently discarded what the user had
    // typed. The caller gives this component a key per mode+task so a fresh default set is
    // picked up by remounting instead.
    defaultValues: toFormValues(task, defaultAction),
  })

  // useWatch (a proper hook) rather than the form's watch() function — watch() returns fresh
  // values on every call in a way the React Compiler cannot memoize safely.
  const selectedAction = useWatch({ control, name: "layer_action" })
  const selectedParentId = useWatch({ control, name: "parent_task_id" })
  const watchedDocRef = useWatch({ control, name: "doc_requirement_ref" })
  // Block 5's parameters follow the selected type, so the fieldset re-renders as it changes.
  const watchedTaskType = useWatch({ control, name: "task_type" })
  // The wide-exclusion checkbox is meaningless without the flag it widens, so it follows it.
  const watchedFourEyes = useWatch({ control, name: "four_eyes" })
  const isParentBacked = PARENT_BACKED_ACTIONS.includes(selectedAction)
  const isDocLinkable = DOC_LINKABLE_ACTIONS.includes(selectedAction)
  const isPending =
    addTask.isPending || updateTask.isPending || removeTask.isPending
  const isEdit = mode === "edit"

  // Already-claimed parents are excluded so a guaranteed 409 is never sent — except the one
  // this task itself points at, which must stay selectable while editing it.
  const claimedParentIds = new Set(
    existingTasks
      .filter(other => other.parent_task_id && other.id !== task?.id)
      .map(other => other.parent_task_id as string)
  )
  // "DOC-001, Signed lease agreement" mirrors the parent picker's "CODE, Name" label.
  const documentRequirementOptions = (documentRequirements ?? []).map(
    requirement => ({
      value: requirement.id,
      label: `${requirement.requirement_code}, ${requirement.document_type_name}`,
    })
  )
  // A failed *refetch* keeps the last good set in the cache: React Query leaves `data` in place
  // and flips `isError`, so treating "errored" as "unavailable" blanks a picker that still has
  // everything it needs — the PRD1042-2146 symptom, where the options were listed a moment
  // earlier and the section then collapsed to an error. Only a failure with nothing cached to
  // show is a real error state; the refetch failure itself is still surfaced by the global
  // query-error toast in main.tsx.
  const isDocRequirementsError =
    isDocRequirementsQueryError && documentRequirementOptions.length === 0

  const linkedRequirement = (documentRequirements ?? []).find(
    requirement => requirement.id === task?.doc_requirement_ref
  )

  // A document check names a requirement by id only. Same resolution the tab does for
  // `doc_requirement_ref`, reused here for the check list.
  function resolveDocumentCode(ref: string): string {
    return (
      (documentRequirements ?? []).find(requirement => requirement.id === ref)
        ?.requirement_code ?? ref
    )
  }

  // A four-eyes exclusion names a task by id. It may point at a task in this catalogue or at the
  // Global Default parent set, so both lists are searched before falling back to the id.
  function resolveTaskName(taskId: string): string {
    const match =
      existingTasks.find(candidate => candidate.id === taskId) ??
      (globalDefaultTasks ?? []).find(candidate => candidate.id === taskId)
    if (!match) return taskId
    return match.task_code
      ? `${match.task_code}, ${match.task_name ?? ""}`.replace(/, $/, "")
      : (match.task_name ?? taskId)
  }

  const parentOptions = (globalDefaultTasks ?? [])
    .filter(candidate => !claimedParentIds.has(candidate.id))
    .map(candidate => ({
      value: candidate.id,
      label: `${candidate.task_code ?? candidate.id}, ${candidate.task_name ?? ""}`,
    }))
  const selectedParent = (globalDefaultTasks ?? []).find(
    candidate => candidate.id === selectedParentId
  )

  function resolveMessage(message: string | undefined): string | undefined {
    if (!message) return undefined
    if (message === "required") return tCommon("validation.required")
    return message
  }

  function handleClose() {
    onOpenChange(false)
  }

  function reportError(err: unknown) {
    if (
      applyApiFieldErrors({
        error: err,
        fields: Object.keys(getValues()),
        setError,
      })
    )
      return

    toast.error(resolveApiErrorMessage(err, t))
  }

  function onSubmit(values: TaskFormValues) {
    const payload = toWirePayload(values)

    if (isEdit && task) {
      // layer_action, task_code and parent_task_id are absent from UpdateTaskRequest because they
      // are immutable once created. This annotation only narrows the type — the payload still
      // carries them at runtime, so the api layer strips them (see toUpdateTaskBody).
      const body: UpdateTaskRequest = payload
      updateTask.mutate(
        { catalogId, versionId, taskId: task.id, body },
        {
          onSuccess: () => {
            toast.success(t("detail.taskSheet.updated"))
            handleClose()
          },
          onError: reportError,
        }
      )
      return
    }

    addTask.mutate(
      {
        catalogId,
        versionId,
        body: { layer_action: values.layer_action, ...payload },
      },
      {
        onSuccess: response => {
          toast.success(t("detail.taskSheet.created"))
          for (const warning of response.warnings) toast.warning(warning)
          handleClose()
        },
        onError: reportError,
      }
    )
  }

  function onRemove() {
    if (!task) return
    removeTask.mutate(
      { catalogId, versionId, taskId: task.id },
      {
        onSuccess: () => {
          toast.success(t("detail.taskSheet.removed"))
          handleClose()
        },
        onError: reportError,
      }
    )
  }

  if (mode === "view" && task) {
    return (
      <TaskDefinitionViewPanel
        task={task}
        catalogLayer={catalogLayer}
        linkedRequirement={linkedRequirement}
        // A document check and a four-eyes exclusion both carry only a UUID, so the panel is
        // given the two lookups it would otherwise have to fetch for itself. Both fall back to
        // the raw id rather than rendering blank, so an out-of-scope reference stays diagnosable.
        resolveDocumentCode={resolveDocumentCode}
        resolveTaskName={resolveTaskName}
        canEdit={canEdit}
        isPending={isPending}
        onClose={handleClose}
        onRemove={onRemove}
        onRequestEdit={onRequestEdit}
      />
    )
  }

  return (
    <Sheet open onOpenChange={o => !o && handleClose()}>
      {/* Wider than the sheet default (sm:max-w-sm): this is the densest form in the app —
          three two-column rows, a nine-item process-context grid and four bordered
          fieldsets — and at the default width the paired controls wrapped mid-label. */}
      <SheetContent
        className="w-full data-[side=right]:sm:max-w-2xl"
        data-testid="task-definition-form-sheet"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full"
        >
          <SheetHeader>
            <SheetTitle>
              {t(
                isEdit
                  ? "detail.taskSheet.editTitle"
                  : "detail.taskSheet.addTitle"
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 overflow-y-auto flex-1">
            {/* A product-specific catalogue chooses which of the three change types it is
                authoring; a Global Default catalogue only ever authors `defined` entries. */}
            {!isGlobalDefaultLayer && !isEdit && (
              <div>
                <Label className="mb-2">
                  {t("detail.taskSheet.fields.type")}
                </Label>
                <Controller
                  control={control}
                  name="layer_action"
                  render={({ field }) => (
                    <SelectField
                      data-testid="task-sheet-layer-action"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={PRODUCT_SPECIFIC_TASK_TYPE_OPTIONS.map(o => ({
                        value: o.value,
                        label: t(o.labelKey),
                      }))}
                    />
                  )}
                />
              </div>
            )}

            {isParentBacked ? (
              <div>
                <Label
                  className="mb-2"
                  error={!!errors.parent_task_id}
                  htmlFor="task-sheet-parent"
                >
                  {t("detail.taskSheet.fields.parentTask")}
                </Label>
                {isParentLoading && !isParentLoadError ? (
                  <Skeleton className="h-9 w-full" />
                ) : parentOptions.length === 0 ? (
                  // Three distinct dead ends that must not share one message: the parent list
                  // failed to load, or no Global Default catalogue exists for this entity type
                  // at all, or one does and every task in it is already overridden/deactivated
                  // here. The failed-load case must not claim the catalogue is absent — the
                  // author would go create one that already exists.
                  <p
                    data-testid="task-sheet-no-parents"
                    className={
                      isParentLoadError
                        ? "text-sm text-destructive"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {t(
                      isParentLoadError
                        ? "detail.taskSheet.parentsUnavailable"
                        : (globalDefaultTasks ?? []).length === 0
                          ? "detail.taskSheet.noGlobalDefaultTasks"
                          : "detail.taskSheet.allParentsClaimed"
                    )}
                  </p>
                ) : (
                  <Controller
                    control={control}
                    name="parent_task_id"
                    render={({ field }) => (
                      <SelectField
                        id="task-sheet-parent"
                        data-testid="task-sheet-parent-select"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={parentOptions}
                        placeholder={t("detail.taskSheet.fields.parentTask")}
                        error={!!errors.parent_task_id}
                        disabled={isEdit}
                      />
                    )}
                  />
                )}
                {errors.parent_task_id && (
                  <p className="mt-1 text-sm text-destructive">
                    {resolveMessage(errors.parent_task_id.message)}
                  </p>
                )}
                {selectedParent && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("detail.taskSheet.inheritsFrom", {
                      name: selectedParent.task_name ?? selectedParent.id,
                    })}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <Label
                    className="mb-2"
                    error={!!errors.task_code}
                    htmlFor="task-sheet-code"
                  >
                    {t("detail.taskSheet.fields.taskCode")}
                  </Label>
                  <Input
                    id="task-sheet-code"
                    data-testid="task-sheet-task-code"
                    error={!!errors.task_code}
                    disabled={isEdit}
                    {...register("task_code")}
                  />
                  {errors.task_code && (
                    <p className="mt-1 text-sm text-destructive">
                      {resolveMessage(errors.task_code.message)}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    className="mb-2"
                    error={!!errors.task_name}
                    htmlFor="task-sheet-name"
                  >
                    {t("detail.taskSheet.fields.taskName")}
                  </Label>
                  <Input
                    id="task-sheet-name"
                    data-testid="task-sheet-task-name"
                    error={!!errors.task_name}
                    {...register("task_name")}
                  />
                  {errors.task_name && (
                    <p className="mt-1 text-sm text-destructive">
                      {resolveMessage(errors.task_name.message)}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    className="mb-2"
                    error={!!errors.task_description}
                    htmlFor="task-sheet-description"
                  >
                    {t("detail.taskSheet.fields.description")}
                  </Label>
                  <Textarea
                    id="task-sheet-description"
                    data-testid="task-sheet-task-description"
                    rows={3}
                    aria-invalid={!!errors.task_description}
                    {...register("task_description")}
                  />
                  {errors.task_description && (
                    <p className="mt-1 text-sm text-destructive">
                      {resolveMessage(errors.task_description.message)}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-2" error={!!errors.task_type}>
                    {t("detail.taskSheet.fields.taskType")}
                  </Label>
                  <Controller
                    control={control}
                    name="task_type"
                    render={({ field }) => (
                      <SelectField
                        data-testid="task-sheet-task-type"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={TASK_TYPE_OPTIONS.map(o => ({
                          value: o.value,
                          label: t(o.labelKey),
                        }))}
                        placeholder={t("detail.taskSheet.notSet")}
                        error={!!errors.task_type}
                      />
                    )}
                  />
                  {errors.task_type && (
                    <p className="mt-1 text-sm text-destructive">
                      {resolveMessage(errors.task_type.message)}
                    </p>
                  )}
                </div>
                {/* PRD1042-1790 items 3/4 — WHEN the step applies, beside WHAT kind of work it
                    is. Only rendered here, on a task that owns its values: the BE refuses the key
                    on override (inherited) and on deactivate. Left unset the service stores
                    `always`, so there is no error state and no required marker. */}
                <div>
                  <Label className="mb-2">
                    {t("detail.taskSheet.fields.applicability")}
                  </Label>
                  <Controller
                    control={control}
                    name="applicability"
                    render={({ field }) => (
                      <SelectField
                        data-testid="task-sheet-applicability"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={TASK_APPLICABILITY_OPTIONS.map(o => ({
                          value: o.value,
                          label: t(o.labelKey),
                        }))}
                        placeholder={t(
                          "detail.taskSheet.applicabilityPlaceholder"
                        )}
                      />
                    )}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("detail.taskSheet.applicabilityHint")}
                  </p>
                </div>
              </>
            )}

            {/* A `deactivated` entry only switches its parent off, so none of the value fields
                below apply to it. */}
            {selectedAction !== LayerActionSchema.enum.deactivated && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2" error={!!errors.is_mandatory}>
                      {t("detail.taskSheet.fields.mandatory")}
                    </Label>
                    <Controller
                      control={control}
                      name="is_mandatory"
                      render={({ field }) => (
                        <SelectField
                          data-testid="task-sheet-mandatory"
                          value={field.value}
                          onValueChange={field.onChange}
                          options={[
                            {
                              value: "true",
                              label: t("detail.taskSheet.mandatoryOptions.yes"),
                            },
                            {
                              value: "false",
                              label: t("detail.taskSheet.mandatoryOptions.no"),
                            },
                          ]}
                          placeholder={t("detail.taskSheet.notSet")}
                          error={!!errors.is_mandatory}
                        />
                      )}
                    />
                    {errors.is_mandatory && (
                      <p className="mt-1 text-sm text-destructive">
                        {resolveMessage(errors.is_mandatory.message)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-2" htmlFor="task-sheet-weight">
                      {t("detail.taskSheet.fields.weight")}
                    </Label>
                    <Input
                      id="task-sheet-weight"
                      data-testid="task-sheet-weight"
                      type="number"
                      min={0}
                      step="0.01"
                      {...register("weight")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category is inherited from the Global Default on an override, so the BE
                      rejects it there — only a task that owns its values may set it. */}
                  {!isParentBacked && (
                    <div>
                      <Label className="mb-2" error={!!errors.category}>
                        {t("detail.taskSheet.fields.category")}
                      </Label>
                      <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <SelectField
                            data-testid="task-sheet-category"
                            value={field.value}
                            onValueChange={field.onChange}
                            options={TASK_CATEGORY_OPTIONS.map(o => ({
                              value: o.value,
                              label: t(o.labelKey),
                            }))}
                            placeholder={t("detail.taskSheet.notSet")}
                            error={!!errors.category}
                          />
                        )}
                      />
                      {errors.category && (
                        <p className="mt-1 text-sm text-destructive">
                          {resolveMessage(errors.category.message)}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <Label className="mb-2" error={!!errors.responsible_roles}>
                      {t("detail.taskSheet.fields.responsibleRoles")}
                    </Label>
                    <Controller
                      control={control}
                      name="responsible_roles"
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-input p-2.5">
                          {STEP_RESPONSIBLE_ROLE_OPTIONS.map(option => (
                            <label
                              key={option.value}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Checkbox
                                data-testid={`task-sheet-responsible-role-${option.value}`}
                                checked={field.value.includes(option.value)}
                                onCheckedChange={checked =>
                                  field.onChange(
                                    checked === true
                                      ? [...field.value, option.value]
                                      : field.value.filter(
                                          v => v !== option.value
                                        )
                                  )
                                }
                              />
                              <span className="text-sm text-foreground">
                                {t(option.labelKey)}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                    {errors.responsible_roles && (
                      <p className="mt-1 text-sm text-destructive">
                        {resolveMessage(errors.responsible_roles.message)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2" error={!!errors.phase_id}>
                      {t("detail.taskSheet.fields.phase")}
                    </Label>
                    <Controller
                      control={control}
                      name="phase_id"
                      render={({ field }) => (
                        <SelectField
                          data-testid="task-sheet-phase"
                          value={field.value}
                          onValueChange={field.onChange}
                          options={phases.map(phase => ({
                            value: phase.id,
                            label: phase.name,
                          }))}
                          placeholder={
                            phases.length === 0
                              ? t("detail.taskSheet.noStagesYet")
                              : t("detail.taskSheet.notSet")
                          }
                          error={!!errors.phase_id}
                        />
                      )}
                    />
                    {errors.phase_id && (
                      <p className="mt-1 text-sm text-destructive">
                        {resolveMessage(errors.phase_id.message)}
                      </p>
                    )}
                    {/* PRD1042-2145 — with no stages a defined/supplement task can never be
                        saved (phase_id is mandatory), so the author has to leave for the Stages
                        panel on the tab behind this sheet. Closing discards nothing that could
                        have been saved anyway. */}
                    {phases.length === 0 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-sm font-normal"
                          data-testid="task-sheet-add-stage-link"
                          onClick={handleClose}
                        >
                          {t("detail.taskSheet.addStageAction")}
                        </Button>
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      className="mb-2"
                      error={!!errors.stage_categorization}
                    >
                      {t("detail.taskSheet.fields.stage")}
                    </Label>
                    <Controller
                      control={control}
                      name="stage_categorization"
                      render={({ field }) => (
                        <SelectField
                          data-testid="task-sheet-stage"
                          value={field.value}
                          onValueChange={field.onChange}
                          options={TASK_STAGE_OPTIONS.map(o => ({
                            value: o.value,
                            label: t(o.labelKey),
                          }))}
                          placeholder={t("detail.taskSheet.notSet")}
                          error={!!errors.stage_categorization}
                        />
                      )}
                    />
                    {errors.stage_categorization && (
                      <p className="mt-1 text-sm text-destructive">
                        {resolveMessage(errors.stage_categorization.message)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      className="mb-2"
                      error={!!errors.display_order}
                      htmlFor="task-sheet-display-order"
                    >
                      {t("detail.taskSheet.fields.displayOrder")}
                    </Label>
                    <Input
                      id="task-sheet-display-order"
                      data-testid="task-sheet-display-order"
                      type="number"
                      min={0}
                      step="1"
                      error={!!errors.display_order}
                      {...register("display_order")}
                    />
                    {errors.display_order && (
                      <p className="mt-1 text-sm text-destructive">
                        {resolveMessage(errors.display_order.message)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Process contexts and the Treasury trigger are inherited on an override, so
                    the BE forbids sending them — they only appear for a task that owns its
                    values. Required by AddTaskRequest's validator despite reading as optional
                    in openapi.json. */}
                {!isParentBacked && (
                  <>
                    <div>
                      <Label
                        className="mb-2"
                        error={!!errors.applicable_process_contexts}
                      >
                        {t("detail.taskSheet.fields.processContexts")}
                      </Label>
                      <Controller
                        control={control}
                        name="applicable_process_contexts"
                        render={({ field }) => (
                          <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-input p-2.5">
                            {TaskProcessContextSchema.options.map(option => (
                              <label
                                key={option}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Checkbox
                                  data-testid={`task-sheet-process-context-${option}`}
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
                                    `detail.taskSheet.processContexts.${option}`
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      />
                      {errors.applicable_process_contexts && (
                        <p className="mt-1 text-sm text-destructive">
                          {resolveMessage(
                            errors.applicable_process_contexts.message
                          )}
                        </p>
                      )}
                    </div>

                    {/* CR B8's authoring half: Contact Treasury is an ordinary checklist step
                        raised when a financing exceeds the threshold. Nothing here contacts
                        Treasury — the runtime surface that shows it is a separate,
                        design-blocked unit (Q-040). */}
                    <label className="flex items-start gap-2 cursor-pointer">
                      <Controller
                        control={control}
                        name="treasury_threshold_trigger"
                        render={({ field }) => (
                          <Checkbox
                            data-testid="task-sheet-treasury-trigger"
                            checked={field.value}
                            onCheckedChange={v => field.onChange(v === true)}
                          />
                        )}
                      />
                      <span className="text-sm text-foreground leading-snug">
                        {t("detail.taskSheet.treasuryThresholdTrigger")}
                      </span>
                    </label>
                  </>
                )}
              </>
            )}

            {/* PRD1042-1894 Block 5 — only the types that carry parameters render the fieldset.
                Without these the endpoint accepts the task and the catalogue then cannot be
                activated, with nothing on screen to fix. */}
            {taskTypeHasParameters(watchedTaskType) && (
              <TaskTypeParameterFields
                control={control}
                errors={errors}
                taskType={watchedTaskType}
                documentOptions={documentRequirementOptions}
                isDocumentsLoading={isDocRequirementsLoading}
                isDocumentsError={isDocRequirementsError}
                resolveMessage={resolveMessage}
              />
            )}

            {/* US 15.7 — authorable on defined / supplement / override, never on deactivate. */}
            {isDocLinkable && (
              <TaskDocumentLinkageFields
                control={control}
                errors={errors}
                setValue={setValue}
                options={documentRequirementOptions}
                isLoading={isDocRequirementsLoading}
                isError={isDocRequirementsError}
                selectedRef={watchedDocRef}
              />
            )}

            {/* PRD1042-1894 Block 3 / 1892 item 5 — four eyes is a flag on the step plus its
                exclusion set, not a task type. Offered on every action except `deactivated`,
                which runs nothing and so has nobody to sign off: the BE would accept the key
                there, but storing a control on a switched-off row is meaningless.
                The exclusion SET is read-only for now — the service writes it through its own
                path and picking specific tasks needs a picker this sheet does not have, so the
                catalogue-wide rule is the only one authorable here. The view panel lists whatever
                specific exclusions a row already carries. */}
            {selectedAction !== LayerActionSchema.enum.deactivated && (
              <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("detail.taskSheet.sections.fourEyes")}
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Controller
                    control={control}
                    name="four_eyes"
                    render={({ field }) => (
                      <Checkbox
                        data-testid="task-sheet-four-eyes"
                        checked={field.value}
                        onCheckedChange={v => field.onChange(v === true)}
                      />
                    )}
                  />
                  <span className="text-sm text-foreground leading-snug">
                    {t("detail.taskSheet.fields.fourEyes")}
                  </span>
                </label>
                <label
                  className={cn(
                    "flex items-start gap-2",
                    watchedFourEyes
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60"
                  )}
                >
                  <Controller
                    control={control}
                    name="four_eyes_exclusion_wide"
                    render={({ field }) => (
                      <Checkbox
                        data-testid="task-sheet-four-eyes-wide"
                        checked={field.value}
                        disabled={!watchedFourEyes}
                        onCheckedChange={v => field.onChange(v === true)}
                      />
                    )}
                  />
                  <span className="text-sm text-foreground leading-snug">
                    {t("detail.taskSheet.fields.fourEyesExclusionWide")}
                  </span>
                </label>
                <p className="text-xs text-muted-foreground">
                  {t("detail.taskSheet.fourEyesHint")}
                </p>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => (
                  <Checkbox
                    data-testid="task-sheet-is-active"
                    checked={field.value}
                    onCheckedChange={v => field.onChange(v === true)}
                  />
                )}
              />
              <span className="text-sm text-foreground">
                {t("detail.taskSheet.fields.active")}
              </span>
            </label>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="task-sheet-cancel"
              onClick={handleClose}
              disabled={isPending}
            >
              {t("detail.taskSheet.cancelButton")}
            </Button>
            <Button
              type="submit"
              data-testid="task-sheet-submit"
              disabled={isPending}
            >
              {t("detail.taskSheet.saveButton")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export { TaskDefinitionSheet }
