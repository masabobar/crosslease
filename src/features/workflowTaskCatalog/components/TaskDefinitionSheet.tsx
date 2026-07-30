import { useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectField } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { useGlobalDefaultTasks } from "@/features/workflowTaskCatalog/hooks/useGlobalDefaultTasks"
import { useAddCatalogTask } from "@/features/workflowTaskCatalog/hooks/useAddCatalogTask"
import { useUpdateCatalogTask } from "@/features/workflowTaskCatalog/hooks/useUpdateCatalogTask"
import { useRemoveCatalogTask } from "@/features/workflowTaskCatalog/hooks/useRemoveCatalogTask"
import {
  PRODUCT_SPECIFIC_TASK_TYPE_OPTIONS,
  TASK_CATEGORY_OPTIONS,
  TASK_RESPONSIBLE_ROLE_OPTIONS,
  TASK_STAGE_OPTIONS,
} from "@/features/workflowTaskCatalog/constants"
import {
  CatalogLayerSchema,
  ConditionalTriggerSchema,
  LayerActionSchema,
  TaskProcessContextSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type {
  AddTaskRequest,
  CatalogEntityType,
  CatalogLayer,
  LayerAction,
  TaskDefinitionItem,
  UpdateTaskRequest,
} from "@/features/workflowTaskCatalog/api/schema"

type SheetMode = "view" | "edit" | "add"

// Identity fields belong to the task itself for `defined` and `supplement`; for `override` and
// `deactivated` they come from the Global Default parent, so the form requires a parent instead.
const PARENT_BACKED_ACTIONS: readonly LayerAction[] = [
  LayerActionSchema.enum.override,
  LayerActionSchema.enum.deactivated,
]

// Mirrors AddTaskRequest.validate_action_constraints: a defined/supplement task must carry all
// of these. `openapi.json` marks them optional — the requirement lives in the Pydantic model
// validator, not the schema, so the FE has to encode it or every submit 422s.
const REQUIRED_FOR_OWN_TASK = [
  "task_name",
  "task_description",
  "category",
  "responsible_role",
  "is_mandatory",
  "display_order",
  "stage_categorization",
] as const

const taskFormSchema = z
  .object({
    layer_action: LayerActionSchema,
    parent_task_id: z.string(),
    task_code: z.string(),
    task_name: z.string(),
    task_description: z.string(),
    category: z.string(),
    responsible_role: z.string(),
    weight: z.string(),
    display_order: z.string(),
    is_mandatory: z.string(),
    stage_categorization: z.string(),
    applicable_process_contexts: z.array(TaskProcessContextSchema),
    is_active: z.boolean(),
    treasury_threshold_trigger: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Override and deactivate carry nothing but their parent — the values are inherited.
    if (PARENT_BACKED_ACTIONS.includes(data.layer_action)) {
      if (!data.parent_task_id) {
        ctx.addIssue({
          code: "custom",
          path: ["parent_task_id"],
          message: "required",
        })
      }
      return
    }

    if (!data.task_code.trim()) {
      ctx.addIssue({ code: "custom", path: ["task_code"], message: "required" })
    }
    for (const field of REQUIRED_FOR_OWN_TASK) {
      if (!data[field].trim()) {
        ctx.addIssue({ code: "custom", path: [field], message: "required" })
      }
    }
    // Required by the BE too, and easy to miss because it is a multi-select rather than a field.
    if (data.applicable_process_contexts.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["applicable_process_contexts"],
        message: "required",
      })
    }
  })

type TaskFormValues = z.infer<typeof taskFormSchema>

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
    responsible_role: task?.responsible_role ?? "",
    weight: task && task.weight !== null ? String(task.weight) : "",
    display_order:
      task && task.display_order !== null ? String(task.display_order) : "",
    is_mandatory:
      task && task.is_mandatory !== null ? String(task.is_mandatory) : "",
    stage_categorization: task?.stage_categorization ?? "",
    applicable_process_contexts: task?.applicable_process_contexts ?? [],
    is_active: task?.is_active ?? true,
    treasury_threshold_trigger: Boolean(task && task.conditional_trigger),
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
function toWirePayload(
  values: TaskFormValues
): Omit<AddTaskRequest, "layer_action"> {
  const orUndefined = (value: string): string | undefined =>
    value === "" ? undefined : value
  const weight = values.weight === "" ? undefined : Number(values.weight)

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
      responsible_role: orUndefined(
        values.responsible_role
      ) as AddTaskRequest["responsible_role"],
      display_order:
        values.display_order === "" ? undefined : Number(values.display_order),
      stage_categorization: orUndefined(
        values.stage_categorization
      ) as AddTaskRequest["stage_categorization"],
      is_active: values.is_active,
    }
  }

  // defined / supplement: the task owns all of its own values.
  return {
    task_code: values.task_code.trim(),
    task_name: values.task_name.trim(),
    task_description: values.task_description.trim(),
    category: orUndefined(values.category) as AddTaskRequest["category"],
    responsible_role: orUndefined(
      values.responsible_role
    ) as AddTaskRequest["responsible_role"],
    is_mandatory: values.is_mandatory === "true",
    weight,
    display_order: Number(values.display_order),
    stage_categorization: orUndefined(
      values.stage_categorization
    ) as AddTaskRequest["stage_categorization"],
    applicable_process_contexts: values.applicable_process_contexts,
    is_active: values.is_active,
    conditional_trigger: values.treasury_threshold_trigger
      ? ConditionalTriggerSchema.enum.financing_amount_over_threshold
      : undefined,
  }
}

function ViewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}

type Props = {
  mode: SheetMode
  task: TaskDefinitionItem | null
  catalogId: string
  versionId: string
  catalogLayer: CatalogLayer
  entityType: CatalogEntityType | null
  // Used to hide Global Default parents this catalogue already overrides or deactivates — the
  // BE allows one product-specific entry per parent per version and rejects a second with
  // WTC_TASK_PARENT_CONFLICT.
  existingTasks: TaskDefinitionItem[]
  canEdit: boolean
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
  existingTasks,
  canEdit,
  onOpenChange,
  onRequestEdit,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const { t: tCommon } = useTranslation("common")
  const isGlobalDefaultLayer =
    catalogLayer === CatalogLayerSchema.enum.global_default
  const defaultAction: LayerAction = isGlobalDefaultLayer
    ? LayerActionSchema.enum.defined
    : LayerActionSchema.enum.override

  const addTask = useAddCatalogTask()
  const updateTask = useUpdateCatalogTask()
  const removeTask = useRemoveCatalogTask()
  const { data: globalDefaultTasks, isError: isParentLoadError } =
    useGlobalDefaultTasks(isGlobalDefaultLayer ? null : entityType)

  const {
    control,
    register,
    handleSubmit,
    setError,
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
  const isParentBacked = PARENT_BACKED_ACTIONS.includes(selectedAction)
  const isPending =
    addTask.isPending || updateTask.isPending || removeTask.isPending
  const isEdit = mode === "edit"
  const notApplicable = t("detail.taskDefinitions.notApplicable")

  // Already-claimed parents are excluded so a guaranteed 409 is never sent — except the one
  // this task itself points at, which must stay selectable while editing it.
  const claimedParentIds = new Set(
    existingTasks
      .filter(other => other.parent_task_id && other.id !== task?.id)
      .map(other => other.parent_task_id as string)
  )
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

    toast.error(
      err instanceof ApiError
        ? t(`errors.${err.code}` as "errors.generic", {
            defaultValue: t("errors.generic"),
          })
        : t("errors.generic")
    )
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
      <Sheet open onOpenChange={o => !o && handleClose()}>
        <SheetContent data-testid="task-definition-view-sheet">
          <SheetHeader>
            <SheetTitle>
              {task.task_name ?? task.inherited?.task_name ?? task.id}
            </SheetTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{task.task_code ?? task.inherited?.task_code ?? "—"}</span>
              <Badge variant="outline">
                {t(`catalogLayers.${catalogLayer}`)}
              </Badge>
              <Badge variant="secondary">
                {t(`detail.taskDefinitions.types.${task.layer_action}`)}
              </Badge>
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
              <ViewRow
                label={t("detail.taskSheet.fields.mandatory")}
                value={
                  task.is_mandatory === null
                    ? notApplicable
                    : t(
                        task.is_mandatory
                          ? "detail.taskSheet.mandatoryOptions.yes"
                          : "detail.taskSheet.mandatoryOptions.no"
                      )
                }
              />
              <ViewRow
                label={t("detail.taskSheet.fields.weight")}
                value={task.weight ?? notApplicable}
              />
              <ViewRow
                label={t("detail.taskSheet.fields.displayOrder")}
                value={task.display_order ?? notApplicable}
              />
              {task.conditional_trigger && (
                <ViewRow
                  label={t("detail.taskSheet.fields.conditionalTrigger")}
                  value={t("detail.taskSheet.treasuryThresholdTrigger")}
                />
              )}
            </div>

            {/* US 15.23: an override row must show the Global Default values it replaces. */}
            {task.inherited && (
              <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("detail.taskSheet.sections.inheritedFromGlobalDefault")}
                </p>
                <ViewRow
                  label={t("detail.taskSheet.fields.taskName")}
                  value={task.inherited.task_name ?? notApplicable}
                />
                <ViewRow
                  label={t("detail.taskSheet.fields.mandatory")}
                  value={
                    task.inherited.is_mandatory === null
                      ? notApplicable
                      : t(
                          task.inherited.is_mandatory
                            ? "detail.taskSheet.mandatoryOptions.yes"
                            : "detail.taskSheet.mandatoryOptions.no"
                        )
                  }
                />
                <ViewRow
                  label={t("detail.taskSheet.fields.weight")}
                  value={task.inherited.weight ?? notApplicable}
                />
              </div>
            )}
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="task-sheet-close"
              onClick={handleClose}
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

  return (
    <Sheet open onOpenChange={o => !o && handleClose()}>
      <SheetContent data-testid="task-definition-form-sheet">
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
                {parentOptions.length === 0 ? (
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
              </>
            )}

            {/* A `deactivated` entry only switches its parent off, so none of the value fields
                below apply to it. */}
            {selectedAction !== LayerActionSchema.enum.deactivated && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">
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
                        />
                      )}
                    />
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
                    <Label className="mb-2">
                      {t("detail.taskSheet.fields.responsibleRole")}
                    </Label>
                    <Controller
                      control={control}
                      name="responsible_role"
                      render={({ field }) => (
                        <SelectField
                          data-testid="task-sheet-responsible-role"
                          value={field.value}
                          onValueChange={field.onChange}
                          options={TASK_RESPONSIBLE_ROLE_OPTIONS.map(o => ({
                            value: o.value,
                            label: t(o.labelKey),
                          }))}
                          placeholder={t("detail.taskSheet.notSet")}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">
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
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label className="mb-2" htmlFor="task-sheet-display-order">
                      {t("detail.taskSheet.fields.displayOrder")}
                    </Label>
                    <Input
                      id="task-sheet-display-order"
                      data-testid="task-sheet-display-order"
                      type="number"
                      min={0}
                      step="1"
                      {...register("display_order")}
                    />
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
