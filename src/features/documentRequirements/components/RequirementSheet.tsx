import { useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { SelectField } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { resolveFormMessage } from "@/lib/formMessages"
import { useAddRequirement } from "@/features/documentRequirements/hooks/useAddRequirement"
import { useUpdateRequirement } from "@/features/documentRequirements/hooks/useUpdateRequirement"
import { ProcessContextCheckboxGroup } from "@/features/documentRequirements/components/ProcessContextCheckboxGroup"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import {
  DocumentOriginSchema,
  DocumentRequirementCatalogTypeSchema,
  GovernanceClassificationSchema,
  RequirementApplicabilitySchema,
  RequirementClassificationSchema,
  SourceLayerSchema,
  StageCategorizationSchema,
} from "@/features/documentRequirements/api/schema"
import type {
  DocumentRequirementCatalogType,
  RequirementResponse,
} from "@/features/documentRequirements/api/schema"

type SheetMode = "view" | "edit" | "add"

const STAGE_OPTIONS = [
  { value: "", labelKey: "requirement.fields.stageNone" as const },
  ...StageCategorizationSchema.options.map(value => ({
    value,
    labelKey: `requirement.stages.${value}` as const,
  })),
]

const GOVERNANCE_OPTIONS = GovernanceClassificationSchema.options.map(
  value => ({
    value,
    labelKey: `requirement.governance.${value}` as const,
  })
)

const CLASSIFICATION_OPTIONS = RequirementClassificationSchema.options.map(
  value => ({
    value,
    labelKey: `requirement.classifications.${value}` as const,
  })
)

const DOCUMENT_ORIGIN_OPTIONS = DocumentOriginSchema.options.map(value => ({
  value,
  labelKey: `requirement.documentOrigins.${value}` as const,
}))

// requirement_code and document_type_code are immutable once created (UpdateRequirementRequest
// has neither field), so the edit form hides them — but the resolver stays a single schema
// (rather than an edit-mode variant that omits them) so useForm's generic type doesn't have to
// vary by mode. Pre-filled and hidden, they always validate trivially in edit mode.
// Mirrors AddRequirementRequest's own Field(max_length=…) bounds. Every rule carries a message
// *code*, never bare prose: an unannotated `.max()` would surface Zod's own English text to the
// user (see resolveFormMessage).
const CODE_MAX_LENGTH = 100
const DOCUMENT_TYPE_NAME_MAX_LENGTH = 255

// Manual ordering is not part of this screen; the backend defaults to the same value.
const DEFAULT_SORT_ORDER = 0

const requirementFieldsSchema = z.object({
  requirementCode: z
    .string()
    .trim()
    .min(1, "required")
    .max(CODE_MAX_LENGTH, "tooLong"),
  documentTypeCode: z
    .string()
    .trim()
    .min(1, "required")
    .max(CODE_MAX_LENGTH, "tooLong"),
  documentTypeName: z
    .string()
    .trim()
    .min(1, "required")
    .max(DOCUMENT_TYPE_NAME_MAX_LENGTH, "tooLong"),
  description: z.string(),
  classification: z.string().min(1, "required"),
  governanceClassification: z.string().min(1, "required"),
  processContexts: z.array(z.string()).min(1, "required"),
  stageCategorization: z.string(),
  blocksSubmission: z.boolean(),
  documentOrigin: z.string().min(1, "required"),
})

type RequirementFormValues = z.infer<typeof requirementFieldsSchema>

function toFormValues(
  requirement?: RequirementResponse
): RequirementFormValues {
  return {
    requirementCode: requirement?.requirement_code ?? "",
    documentTypeCode: requirement?.document_type_code ?? "",
    documentTypeName: requirement?.document_type_name ?? "",
    description: requirement?.description ?? "",
    classification:
      requirement?.classification ??
      RequirementClassificationSchema.enum.mandatory,
    governanceClassification: requirement?.governance_classification ?? "",
    processContexts: requirement?.applicable_process_contexts ?? [],
    stageCategorization: requirement?.stage_categorization ?? "",
    blocksSubmission: requirement?.blocks_submission ?? true,
    documentOrigin:
      requirement?.document_origin ?? DocumentOriginSchema.enum.uploaded,
  }
}

type Props = {
  catalogId: string
  catalogType: DocumentRequirementCatalogType
  mode: SheetMode
  requirement?: RequirementResponse
  onOpenChange: (open: boolean) => void
}

function RequirementSheet({
  catalogId,
  catalogType,
  mode,
  requirement,
  onOpenChange,
}: Props) {
  const { t } = useTranslation("documentRequirements")
  const isEdit = mode === "edit"
  const isProductSpecific =
    catalogType === DocumentRequirementCatalogTypeSchema.enum.product_specific

  const addRequirement = useAddRequirement(catalogId)
  const updateRequirement = useUpdateRequirement(catalogId)

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementFieldsSchema),
    defaultValues: toFormValues(requirement),
  })

  const classification = useWatch({ control, name: "classification" })
  const isConditional =
    classification === RequirementClassificationSchema.enum.conditional

  function resolveMessage(message: string | undefined): string | undefined {
    return resolveFormMessage(message, t, "requirement.errors")
  }

  function handleClose() {
    onOpenChange(false)
  }

  function onSubmit(values: RequirementFormValues) {
    const shared = {
      document_type_name: values.documentTypeName.trim(),
      description: values.description.trim() || null,
      classification: RequirementClassificationSchema.parse(
        values.classification
      ),
      governance_classification: GovernanceClassificationSchema.parse(
        values.governanceClassification
      ),
      applicable_process_contexts: values.processContexts,
      stage_categorization: values.stageCategorization
        ? StageCategorizationSchema.parse(values.stageCategorization)
        : null,
      blocks_submission: values.blocksSubmission,
      document_origin: DocumentOriginSchema.parse(values.documentOrigin),
    }

    const onError = (err: unknown) => {
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

    if (isEdit && requirement) {
      updateRequirement.mutate(
        { requirementId: requirement.id, body: shared },
        {
          onSuccess: () => {
            toast.success(t("requirement.editSuccess"))
            handleClose()
          },
          onError,
        }
      )
      return
    }

    addRequirement.mutate(
      {
        requirement_code: values.requirementCode.trim(),
        document_type_code: values.documentTypeCode.trim(),
        // A Global Default catalog's rows are forced to `default` server-side regardless of what
        // is sent; a Product-Specific catalog's must be override/supplement/deactivated. Override
        // has no target-requirement link to record (see open-questions.md Q-061), so every
        // Product-Specific addition here is a Supplement.
        source_layer: isProductSpecific
          ? SourceLayerSchema.enum.supplement
          : undefined,
        sort_order: DEFAULT_SORT_ORDER,
        // The predicate authoring UI is post-MVP (US 16.4), so nothing here can produce a
        // conditional requirement — `condition` is never sent and applicability stays `always`.
        applicability: RequirementApplicabilitySchema.enum.always,
        ...shared,
      },
      {
        onSuccess: () => {
          toast.success(t("requirement.addSuccess"))
          handleClose()
        },
        onError,
      }
    )
  }

  const isPending = addRequirement.isPending || updateRequirement.isPending

  if (mode === "view" && requirement) {
    return (
      <Sheet open onOpenChange={o => !o && handleClose()}>
        <SheetContent data-testid="requirement-view-sheet">
          <SheetHeader>
            <SheetTitle>{requirement.requirement_code}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto">
            <div>
              <Badge variant="secondary">
                {t(
                  `requirement.sourceLayers.${requirement.source_layer}` as "requirement.sourceLayers.default"
                )}
              </Badge>
              {!requirement.is_active && (
                <Badge variant="outline" className="ml-2">
                  {t("requirement.inactive")}
                </Badge>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-3">
              {[
                [
                  "requirement.fields.documentTypeCode",
                  requirement.document_type_code,
                ],
                [
                  "requirement.fields.documentTypeName",
                  requirement.document_type_name,
                ],
                [
                  "requirement.fields.description",
                  requirement.description ?? t("detail.identity.notApplicable"),
                ],
                [
                  "requirement.fields.classification",
                  t(
                    `requirement.classifications.${requirement.classification}` as "requirement.classifications.mandatory"
                  ),
                ],
                [
                  "requirement.fields.governanceClassification",
                  t(
                    `requirement.governance.${requirement.governance_classification}` as "requirement.governance.operational"
                  ),
                ],
                [
                  "requirement.fields.processContexts",
                  requirement.applicable_process_contexts
                    .map(v =>
                      t(`processContexts.${v}` as "processContexts.financing", {
                        defaultValue: v,
                      })
                    )
                    .join(", "),
                ],
                [
                  "requirement.fields.stageCategorization",
                  requirement.stage_categorization
                    ? t(
                        `requirement.stages.${requirement.stage_categorization}` as "requirement.stages.submission"
                      )
                    : t("requirement.fields.stageNone"),
                ],
                [
                  "requirement.fields.blocksSubmission",
                  requirement.blocks_submission
                    ? t("requirement.yes")
                    : t("requirement.no"),
                ],
                [
                  "requirement.fields.documentOrigin",
                  t(
                    `requirement.documentOrigins.${requirement.document_origin}` as "requirement.documentOrigins.uploaded"
                  ),
                ],
              ].map(([labelKey, value]) => (
                <div key={labelKey}>
                  <dt className="text-sm text-muted-foreground">
                    {t(labelKey as "requirement.fields.documentTypeCode")}
                  </dt>
                  <dd className="text-sm text-foreground mt-1">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="requirement-view-close"
              onClick={handleClose}
            >
              {t("create.actions.cancel")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open onOpenChange={o => !o && handleClose()}>
      <SheetContent data-testid="requirement-form-sheet">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col h-full"
        >
          <SheetHeader>
            <SheetTitle>
              {isEdit ? t("requirement.editTitle") : t("requirement.addTitle")}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1">
            {!isEdit && (
              <>
                <div>
                  <Label
                    htmlFor="requirement-code"
                    error={!!errors.requirementCode}
                    className="mb-2"
                  >
                    {t("requirement.fields.requirementCode")}
                  </Label>
                  <Input
                    id="requirement-code"
                    data-testid="requirement-code-input"
                    error={!!errors.requirementCode}
                    {...register("requirementCode")}
                  />
                  {errors.requirementCode && (
                    <p className="mt-1 text-sm text-destructive">
                      {resolveMessage(errors.requirementCode.message)}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="requirement-document-type-code"
                    error={!!errors.documentTypeCode}
                    className="mb-2"
                  >
                    {t("requirement.fields.documentTypeCode")}
                  </Label>
                  <Input
                    id="requirement-document-type-code"
                    data-testid="requirement-document-type-code-input"
                    error={!!errors.documentTypeCode}
                    {...register("documentTypeCode")}
                  />
                  {errors.documentTypeCode && (
                    <p className="mt-1 text-sm text-destructive">
                      {resolveMessage(errors.documentTypeCode.message)}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <Label
                htmlFor="requirement-document-type-name"
                error={!!errors.documentTypeName}
                className="mb-2"
              >
                {t("requirement.fields.documentTypeName")}
              </Label>
              <Input
                id="requirement-document-type-name"
                data-testid="requirement-document-type-name-input"
                error={!!errors.documentTypeName}
                {...register("documentTypeName")}
              />
              {errors.documentTypeName && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.documentTypeName.message)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="requirement-description" className="mb-2">
                {t("requirement.fields.description")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("create.fields.optional")}
                </span>
              </Label>
              <Textarea
                id="requirement-description"
                data-testid="requirement-description-input"
                rows={3}
                {...register("description")}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.description.message)}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="requirement-classification"
                error={!!errors.classification}
                className="mb-2"
              >
                {t("requirement.fields.classification")}
              </Label>
              <Controller
                control={control}
                name="classification"
                render={({ field }) => (
                  <SelectField
                    id="requirement-classification"
                    data-testid="requirement-classification-select"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={CLASSIFICATION_OPTIONS.map(o => ({
                      value: o.value,
                      label: t(o.labelKey),
                    }))}
                    error={!!errors.classification}
                  />
                )}
              />
              {errors.classification && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.classification.message)}
                </p>
              )}
              {isConditional && (
                <p
                  data-testid="requirement-predicate-placeholder"
                  className="mt-2 text-sm text-muted-foreground opacity-80"
                >
                  {t("requirement.fields.predicatePostMvpNote")}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="requirement-governance"
                error={!!errors.governanceClassification}
                className="mb-2"
              >
                {t("requirement.fields.governanceClassification")}
              </Label>
              <Controller
                control={control}
                name="governanceClassification"
                render={({ field }) => (
                  <SelectField
                    id="requirement-governance"
                    data-testid="requirement-governance-select"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={GOVERNANCE_OPTIONS.map(o => ({
                      value: o.value,
                      label: t(o.labelKey),
                    }))}
                    placeholder={t("create.fields.catalogTypePlaceholder")}
                    error={!!errors.governanceClassification}
                  />
                )}
              />
              {errors.governanceClassification && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.governanceClassification.message)}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-2" error={!!errors.processContexts}>
                {t("create.fields.processContexts")}
              </Label>
              <Controller
                control={control}
                name="processContexts"
                render={({ field }) => (
                  <ProcessContextCheckboxGroup
                    value={field.value}
                    onChange={field.onChange}
                    testIdPrefix="requirement"
                  />
                )}
              />
              {errors.processContexts && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.processContexts.message)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="requirement-stage" className="mb-2">
                {t("requirement.fields.stageCategorization")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("create.fields.optional")}
                </span>
              </Label>
              <Controller
                control={control}
                name="stageCategorization"
                render={({ field }) => (
                  <SelectField
                    id="requirement-stage"
                    data-testid="requirement-stage-select"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={STAGE_OPTIONS.map(o => ({
                      value: o.value,
                      label: t(o.labelKey),
                    }))}
                    error={!!errors.stageCategorization}
                  />
                )}
              />
              {errors.stageCategorization && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.stageCategorization.message)}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="requirement-document-origin"
                error={!!errors.documentOrigin}
                className="mb-2"
              >
                {t("requirement.fields.documentOrigin")}
              </Label>
              <Controller
                control={control}
                name="documentOrigin"
                render={({ field }) => (
                  <SelectField
                    id="requirement-document-origin"
                    data-testid="requirement-document-origin-select"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={DOCUMENT_ORIGIN_OPTIONS.map(o => ({
                      value: o.value,
                      label: t(o.labelKey),
                    }))}
                    error={!!errors.documentOrigin}
                  />
                )}
              />
              {errors.documentOrigin && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.documentOrigin.message)}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="requirement-blocks-submission"
                  error={!!errors.blocksSubmission}
                >
                  {t("requirement.fields.blocksSubmission")}
                </Label>
                <Controller
                  control={control}
                  name="blocksSubmission"
                  render={({ field }) => (
                    <Switch
                      id="requirement-blocks-submission"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="requirement-blocks-submission-switch"
                    />
                  )}
                />
              </div>
              {errors.blocksSubmission && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.blocksSubmission.message)}
                </p>
              )}
            </div>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="requirement-form-cancel"
              onClick={handleClose}
            >
              {t("create.actions.cancel")}
            </Button>
            <Button
              type="submit"
              data-testid="requirement-form-submit"
              disabled={isPending}
            >
              {isEdit
                ? t("requirement.editSubmit")
                : t("requirement.addSubmit")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export { RequirementSheet }
