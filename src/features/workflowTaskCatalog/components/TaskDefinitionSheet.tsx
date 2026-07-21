import { useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SelectField } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  CATALOG_LAYER,
  DOCUMENT_PINNING_BEHAVIOR,
  PLACEHOLDER_DOCUMENT_REQUIREMENT_OPTIONS,
  PLACEHOLDER_PARENT_TASK_OPTIONS,
  PRODUCT_SPECIFIC_TASK_TYPE_OPTIONS,
  TASK_CATEGORY_OPTIONS,
  TASK_DEFINITION_TYPE,
  TASK_RESPONSIBLE_ROLE_OPTIONS,
  TASK_STAGE_OPTIONS,
} from "@/features/workflowTaskCatalog/constants"
import type {
  CatalogLayer,
  DocumentPinningBehavior,
  PlaceholderTaskDefinition,
  TaskDefinitionType,
} from "@/features/workflowTaskCatalog/constants"

type SheetMode = "view" | "edit" | "add"

const taskDefinitionFormSchema = z
  .object({
    type: z.enum(["global", "override", "deactivate", "supplement"]),
    parentTaskCode: z.string(),
    taskCode: z.string(),
    taskName: z.string(),
    description: z.string(),
    category: z.string(),
    responsibleRole: z.string(),
    weight: z.string(),
    displayOrder: z.string(),
    mandatory: z.string(),
    stage: z.string(),
    documentRequirementRef: z.string(),
    pinningBehavior: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "override" || data.type === "deactivate") {
      if (!data.parentTaskCode) {
        ctx.addIssue({
          code: "custom",
          path: ["parentTaskCode"],
          message: "required",
        })
      }
      return
    }
    if (!data.taskCode.trim()) {
      ctx.addIssue({ code: "custom", path: ["taskCode"], message: "required" })
    }
    if (!data.taskName.trim()) {
      ctx.addIssue({ code: "custom", path: ["taskName"], message: "required" })
    }
    if (!data.description.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "required",
      })
    }
  })

type TaskDefinitionFormValues = z.infer<typeof taskDefinitionFormSchema>

function toFormValues(
  task: PlaceholderTaskDefinition | null,
  defaultType: TaskDefinitionType
): TaskDefinitionFormValues {
  return {
    type: task?.type ?? defaultType,
    parentTaskCode: task?.parentTaskCode ?? "",
    taskCode: task?.taskCode ?? "",
    taskName: task?.taskName ?? "",
    description: task?.description ?? "",
    category: task?.category ?? "",
    responsibleRole: task?.responsibleRole ?? "",
    weight: task && task.weight !== null ? String(task.weight) : "",
    displayOrder:
      task && task.displayOrder !== null ? String(task.displayOrder) : "",
    mandatory: task && task.mandatory !== null ? String(task.mandatory) : "",
    stage: task?.stage ?? "",
    documentRequirementRef: task?.documentRequirementRef ?? "",
    pinningBehavior: DOCUMENT_PINNING_BEHAVIOR.PIN_BY_VERSION,
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
  task: PlaceholderTaskDefinition | null
  catalogLayer: CatalogLayer
  canEdit: boolean
  onOpenChange: (open: boolean) => void
  onRequestEdit: () => void
}

// Static shell only — no backend exists yet for Epic 15 (see CLAUDE.md). Saving
// validates the form client-side, then only closes the sheet; it never simulates a
// network call or shows a success toast.
function TaskDefinitionSheet({
  mode,
  task,
  catalogLayer,
  canEdit,
  onOpenChange,
  onRequestEdit,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const isGlobalDefaultLayer = catalogLayer === CATALOG_LAYER.GLOBAL_DEFAULT
  const defaultAddType: TaskDefinitionType = isGlobalDefaultLayer
    ? TASK_DEFINITION_TYPE.GLOBAL
    : TASK_DEFINITION_TYPE.OVERRIDE

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskDefinitionFormValues>({
    resolver: zodResolver(taskDefinitionFormSchema),
    values: toFormValues(task, defaultAddType),
  })

  // useWatch (a proper hook) instead of the form's watch() function — watch() returns
  // fresh values on every call in a way the React Compiler cannot memoize safely.
  const selectedType = useWatch({ control, name: "type" })
  const selectedParentTaskCode = useWatch({ control, name: "parentTaskCode" })
  const isLockedIdentity =
    selectedType === TASK_DEFINITION_TYPE.OVERRIDE ||
    selectedType === TASK_DEFINITION_TYPE.DEACTIVATE
  const parentTask = PLACEHOLDER_PARENT_TASK_OPTIONS.find(
    o => o.value === selectedParentTaskCode
  )

  function handleClose() {
    onOpenChange(false)
  }

  function onSubmit() {
    handleClose()
  }

  if (mode === "view" && task) {
    return (
      <Sheet open onOpenChange={o => !o && handleClose()}>
        <SheetContent data-testid="task-definition-view-sheet">
          <SheetHeader>
            <SheetTitle>{task.taskName}</SheetTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{task.taskCode}</span>
              <Badge variant="outline">
                {t(`catalogLayers.${catalogLayer}`)}
              </Badge>
              <Badge variant="secondary">
                {t(`detail.taskDefinitions.types.${task.type}`)}
              </Badge>
            </div>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {t("detail.taskSheet.sections.taskIdentity")}
              </p>
              <p className="text-sm text-foreground">{task.description}</p>
            </div>

            <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {t("detail.taskSheet.sections.behaviorAndGating")}
              </p>
              {task.category && (
                <ViewRow
                  label={t("detail.taskSheet.fields.category")}
                  value={t(`detail.taskSheet.categories.${task.category}`)}
                />
              )}
              <ViewRow
                label={t("detail.taskSheet.fields.mandatory")}
                value={
                  task.mandatory === null
                    ? t("detail.taskDefinitions.notApplicable")
                    : t(
                        task.mandatory
                          ? "detail.taskSheet.mandatoryOptions.yes"
                          : "detail.taskSheet.mandatoryOptions.no"
                      )
                }
              />
              {task.weight !== null && (
                <ViewRow
                  label={t("detail.taskSheet.fields.weight")}
                  value={task.weight}
                />
              )}
              {task.displayOrder !== null && (
                <ViewRow
                  label={t("detail.taskSheet.fields.displayOrder")}
                  value={task.displayOrder}
                />
              )}
              {task.responsibleRole && (
                <ViewRow
                  label={t("detail.taskSheet.fields.responsibleRole")}
                  value={t(
                    `detail.taskSheet.responsibleRoles.${task.responsibleRole}`
                  )}
                />
              )}
              {task.stage && (
                <ViewRow
                  label={t("detail.taskSheet.fields.stage")}
                  value={t(`detail.taskSheet.stages.${task.stage}`)}
                />
              )}
              {task.processContext && (
                <ViewRow
                  label={t("detail.taskSheet.fields.processContext")}
                  value={task.processContext}
                />
              )}
              <ViewRow
                label={t("detail.taskSheet.fields.active")}
                value={t(
                  task.active
                    ? "detail.taskSheet.mandatoryOptions.yes"
                    : "detail.taskSheet.mandatoryOptions.no"
                )}
              />
            </div>

            {task.documentRequirementRef && (
              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("detail.taskSheet.sections.documentLinkage")}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-primary">
                  <FileText size={14} />
                  {task.documentRequirementRef}
                </div>
              </div>
            )}
          </div>

          {canEdit && (
            <SheetFooter>
              <Button
                type="button"
                data-testid="task-definition-edit-button"
                onClick={onRequestEdit}
              >
                {t("detail.taskSheet.editButton")}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open onOpenChange={o => !o && handleClose()}>
      <SheetContent
        data-testid="task-definition-edit-sheet"
        className="sm:max-w-md"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 flex-1 overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {mode === "add"
                ? t("detail.taskSheet.addTitle")
                : t("detail.taskSheet.editTitle")}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            {mode === "add" && (
              <div>
                <Label className="mb-2">
                  {t("detail.taskSheet.fields.type")}
                </Label>
                {isGlobalDefaultLayer ? (
                  <p className="text-sm text-muted-foreground">
                    {t("detail.taskDefinitions.types.global")}
                  </p>
                ) : (
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <SelectField
                        data-testid="task-definition-type-select"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={PRODUCT_SPECIFIC_TASK_TYPE_OPTIONS.map(o => ({
                          value: o.value,
                          label: t(o.labelKey),
                        }))}
                      />
                    )}
                  />
                )}
              </div>
            )}

            {isLockedIdentity ? (
              <>
                <div>
                  <Label
                    htmlFor="task-parent-task"
                    error={!!errors.parentTaskCode}
                    className="mb-2"
                  >
                    {t("detail.taskSheet.fields.parentTask")}
                  </Label>
                  <Controller
                    control={control}
                    name="parentTaskCode"
                    render={({ field }) => (
                      <SelectField
                        id="task-parent-task"
                        data-testid="task-definition-parent-task-select"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[...PLACEHOLDER_PARENT_TASK_OPTIONS]}
                        placeholder={t(
                          "detail.taskSheet.parentTaskPlaceholder"
                        )}
                        error={!!errors.parentTaskCode}
                      />
                    )}
                  />
                </div>

                {parentTask && (
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      {t("detail.taskSheet.overrideInheritedNote")}
                    </p>
                    <ViewRow
                      label={t("detail.taskSheet.fields.taskCode")}
                      value={parentTask.value}
                    />
                    <ViewRow
                      label={t("detail.taskSheet.fields.taskName")}
                      value={parentTask.label.split(", ")[1]}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <Label
                    htmlFor="task-code"
                    error={!!errors.taskCode}
                    className="mb-2"
                  >
                    {t("detail.taskSheet.fields.taskCode")}
                  </Label>
                  <Input
                    id="task-code"
                    data-testid="task-definition-code-input"
                    error={!!errors.taskCode}
                    {...register("taskCode")}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="task-name"
                    error={!!errors.taskName}
                    className="mb-2"
                  >
                    {t("detail.taskSheet.fields.taskName")}
                  </Label>
                  <Input
                    id="task-name"
                    data-testid="task-definition-name-input"
                    error={!!errors.taskName}
                    {...register("taskName")}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="task-description"
                    error={!!errors.description}
                    className="mb-2"
                  >
                    {t("detail.taskSheet.fields.description")}
                  </Label>
                  <Textarea
                    id="task-description"
                    data-testid="task-definition-description-input"
                    rows={3}
                    aria-invalid={!!errors.description || undefined}
                    {...register("description")}
                  />
                </div>
                <div>
                  <Label className="mb-2">
                    {t("detail.taskSheet.fields.category")}
                  </Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <SelectField
                        data-testid="task-definition-category-select"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={TASK_CATEGORY_OPTIONS.map(o => ({
                          value: o.value,
                          label: t(o.labelKey),
                        }))}
                      />
                    )}
                  />
                </div>
              </>
            )}

            {selectedType !== TASK_DEFINITION_TYPE.DEACTIVATE && (
              <>
                <div>
                  <Label className="mb-2">
                    {t("detail.taskSheet.fields.responsibleRole")}
                  </Label>
                  <Controller
                    control={control}
                    name="responsibleRole"
                    render={({ field }) => (
                      <SelectField
                        data-testid="task-definition-responsible-role-select"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={TASK_RESPONSIBLE_ROLE_OPTIONS.map(o => ({
                          value: o.value,
                          label: t(o.labelKey),
                        }))}
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="task-weight" className="mb-2">
                      {t("detail.taskSheet.fields.weight")}
                    </Label>
                    <Input
                      id="task-weight"
                      type="number"
                      data-testid="task-definition-weight-input"
                      {...register("weight")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-display-order" className="mb-2">
                      {t("detail.taskSheet.fields.displayOrder")}
                    </Label>
                    <Input
                      id="task-display-order"
                      type="number"
                      data-testid="task-definition-display-order-input"
                      {...register("displayOrder")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">
                      {t("detail.taskSheet.fields.mandatory")}
                    </Label>
                    <Controller
                      control={control}
                      name="mandatory"
                      render={({ field }) => (
                        <SelectField
                          data-testid="task-definition-mandatory-select"
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
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label className="mb-2">
                      {t("detail.taskSheet.fields.stage")}
                    </Label>
                    <Controller
                      control={control}
                      name="stage"
                      render={({ field }) => (
                        <SelectField
                          data-testid="task-definition-stage-select"
                          value={field.value}
                          onValueChange={field.onChange}
                          options={TASK_STAGE_OPTIONS.map(o => ({
                            value: o.value,
                            label: t(o.labelKey),
                          }))}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center justify-between">
                    <Label className="mb-0">
                      {t("detail.taskSheet.fields.documentRequirementRef")}
                    </Label>
                  </div>
                  <Controller
                    control={control}
                    name="documentRequirementRef"
                    render={({ field }) => (
                      <SelectField
                        data-testid="task-definition-document-ref-select"
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[...PLACEHOLDER_DOCUMENT_REQUIREMENT_OPTIONS]}
                        placeholder={t(
                          "detail.taskSheet.documentRequirementPlaceholder"
                        )}
                      />
                    )}
                  />
                </div>

                <div>
                  <Label className="mb-2">
                    {t("detail.taskSheet.fields.pinningBehavior")}
                  </Label>
                  <Controller
                    control={control}
                    name="pinningBehavior"
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex items-center gap-4"
                      >
                        <label
                          htmlFor="pin-by-version"
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <RadioGroupItem
                            id="pin-by-version"
                            value={
                              DOCUMENT_PINNING_BEHAVIOR.PIN_BY_VERSION satisfies DocumentPinningBehavior
                            }
                          />
                          {t("detail.taskSheet.fields.pinByVersion")}
                        </label>
                        <label
                          htmlFor="pin-by-id"
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <RadioGroupItem
                            id="pin-by-id"
                            value={
                              DOCUMENT_PINNING_BEHAVIOR.PIN_BY_ID satisfies DocumentPinningBehavior
                            }
                          />
                          {t("detail.taskSheet.fields.pinById")}
                        </label>
                      </RadioGroup>
                    )}
                  />
                </div>
              </>
            )}
          </div>

          <SheetFooter className="flex-row justify-end gap-1.5 border-t">
            <Button
              type="button"
              variant="outline"
              data-testid="task-definition-cancel-button"
              onClick={handleClose}
            >
              {t("detail.taskSheet.cancelButton")}
            </Button>
            <Button type="submit" data-testid="task-definition-save-button">
              {mode === "add"
                ? t("detail.taskSheet.addButton")
                : t("detail.taskSheet.saveButton")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export { TaskDefinitionSheet }
